const { Readable } = require("node:stream");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { convertEnglishToKatakana } = require("./dictConverter");
const TemporaryVC = require("../models/TemporaryVC");

const audioPlayers = new Map();

// Lazy-loaded Kanji2Koe OpenJTalk instance
let kanji2koePromise = null;
function getKanji2Koe() {
    if (!kanji2koePromise) {
        kanji2koePromise = (async () => {
            const { load } = await import("kanji2koe-openjtalk");
            return load();
        })();
    }
    return kanji2koePromise;
}

// Cache AquesTalk WASM instances per voice
const aquestalkMap = new Map();
const VALID_VOICES = ["dvd", "f1", "f2", "imd1", "jgr", "m1", "m2", "r1"];

function getAquesTalk(voice = "f1") {
    const v = VALID_VOICES.includes(voice) ? voice : "f1";
    if (!aquestalkMap.has(v)) {
        const promise = (async () => {
            const { load } = await import("aquestalk.js");
            return load(v);
        })();
        aquestalkMap.set(v, promise);
    }
    return aquestalkMap.get(v);
}

function preprocess(text) {
    if (!text) return "";
    text = text.replace(/https?:\/\/\S+/g, "ユーアールエル");
    text = text.replace(/<@!?\d+>/g, "メンション");
    text = text.replace(/<#\d+>/g, "チャンネル");
    text = text.replace(/<a?:\w+:\d+>/g, "");
    // Remove Discord markdown and symbols
    text = text.replace(/[*_~|`#$+%^&=/\\]+/g, "");

    // Read standalone/multiple question marks and exclamation marks aloud
    if (/^[?？!！\s]+$/.test(text)) {
        text = text.replace(/[?？]/g, "はてな ").replace(/[!！]/g, "びっくり ");
    } else {
        text = text.replace(/[?？]{2,}/g, " はてな？");
    }

    // Convert English words and phrases to Katakana using dictionary
    text = convertEnglishToKatakana(text);

    // Strip spaces so OpenJTalk doesn't insert unwanted pauses/読点
    text = text.replace(/\s+/g, "");
    return text;
}

function sanitizeKoe(koe) {
    if (!koe) return "";
    // Clean up illegal characters not supported by AquesTalk phonetic syntax (keep ? and ？)
    let clean = koe.replace(/[^ぁ-んァ-ヶー_/'?.,、。？]/g, "");
    // Convert trailing / illegal sokuon (っ / ッ) before punctuation or pause to prolonged sound
    clean = clean.replace(/[っッ]+(?=[。、/.,?\s_']|$)/g, "ー");
    // Remove isolated / leading prolonged sound marks
    clean = clean.replace(/(?:^|[/、。,.\s])ー+/g, "");
    // Fix invalid unvoiced consonants (AquesTalk only supports _ before [シスキツチヒフピプ])
    clean = clean.replace(/_([^シスキツチヒフピプ])/g, "$1");
    // Remove consecutive or trailing special phonetic symbols
    clean = clean.replace(/[_/']+(?=[_/']|$)/g, "");
    clean = clean.replace(/\s+/g, "");
    clean = clean.trim();

    // Must contain at least one valid kana character
    if (!/[ぁ-んァ-ヶ]/.test(clean)) return "";
    return clean;
}

async function textToKatakana(rawText) {
    const text = preprocess(rawText);
    if (!text || text.trim().length === 0) return "";
    const kanji2koe = await getKanji2Koe();
    const result = await kanji2koe.convert(text);
    return sanitizeKoe(result);
}

const EDGE_VOICES = [
    "ja-JP-NanamiNeural",
    "ja-JP-KeitaNeural",
    "ja-JP-AoiNeural",
    "ja-JP-DaichiNeural",
    "ja-JP-MayuNeural",
    "ja-JP-NaokiNeural",
    "ja-JP-ShioriNeural"
];

async function edgeTts(text, voice = "ja-JP-NanamiNeural") {
    try {
        const ttsClient = new MsEdgeTTS();
        await ttsClient.setMetadata(voice, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
        const { audioStream } = ttsClient.toStream(text, { volume: "-60%", rate: "medium" });
        return audioStream;
    } catch (e) {
        console.warn("[WARN] Edge TTS error, falling back to AquesTalk:", e.message);
        return null;
    }
}

async function tts(text, voice = "f1", speed = 100) {
    if (voice && (voice.startsWith("ja-JP-") || EDGE_VOICES.includes(voice))) {
        const edgeStream = await edgeTts(text, voice);
        if (edgeStream) return edgeStream;
        // If Edge TTS failed or returned null, fallback to AquesTalk f1
        voice = "f1";
    }

    const koe = await textToKatakana(text);
    if (!koe || koe.length === 0) return null;

    const aquestalk = await getAquesTalk(voice);
    try {
        const wav = aquestalk.run(koe, speed);
        return Readable.from(Buffer.from(wav));
    } catch (err) {
        console.warn("[WARN] AquesTalk synthesis fallback:", err.message);
        try {
            // Fallback: strip accents/unvoicing and any isolated symbols
            let plain = koe.replace(/[_/']/g, "");
            plain = plain.replace(/[っッ]+(?=[。、/.,?\s]|$)/g, "");
            plain = plain.replace(/^ー+/g, "").trim();
            if (!plain || !/[ぁ-んァ-ヶ]/.test(plain)) return null;

            const wav = aquestalk.run(plain, speed);
            return Readable.from(Buffer.from(wav));
        } catch (e2) {
            console.warn("[WARN] AquesTalk fallback also failed:", e2.message);
            return null;
        }
    }
}

async function playTTS(connection, channelId, text, customVoice = null) {
    try {
        let player = audioPlayers.get(channelId);
        if (!player) {
            player = createAudioPlayer();
            audioPlayers.set(channelId, player);
            connection.subscribe(player);
            player.on("error", (error) => console.error("[ERROR] TTS playback:", error));
        }

        let voice = customVoice;
        if (!voice) {
            const vc = await TemporaryVC.getVC(channelId);
            if (vc) {
                const prefs = await TemporaryVC.getPrefs(vc.creator_id);
                if (prefs?.voice_type) {
                    voice = prefs.voice_type;
                }
            }
        }

        const stream = await tts(text, voice);
        if (!stream) return;

        const resource = createAudioResource(stream);

        // wait for current playback to finish first
        if (player.state.status === AudioPlayerStatus.Playing) {
            await new Promise((resolve) => player.once(AudioPlayerStatus.Idle, resolve));
        }

        player.play(resource);
    } catch (e) {
        console.error("[ERROR] TTS:", e);
    }
}

// Clean up audio player for a channel
function cleanupPlayer(channelId) {
    const player = audioPlayers.get(channelId);
    if (player) {
        player.stop();
        audioPlayers.delete(channelId);
    }
}

module.exports = { playTTS, cleanupPlayer, audioPlayers, textToKatakana, tts };
