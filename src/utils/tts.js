const path = require("node:path");
const { Readable } = require("node:stream");
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
    // Replace Discord markdown and symbols that break phonetics
    text = text.replace(/[*_~|`#$+%^&=/\\]+/g, " ");
    // Convert English words and phrases to Katakana using dictionary
    text = convertEnglishToKatakana(text);
    return text;
}

function sanitizeKoe(koe) {
    if (!koe) return "";
    // Clean up illegal characters not supported by AquesTalk phonetic syntax
    let clean = koe.replace(/[^ぁ-んァ-ヶー_/'?.,、。]/g, "");
    // Fix invalid underscores (only voiceless vowels can follow _)
    clean = clean.replace(/_([^シスキツチヒフピプ])/g, "$1");
    // Remove consecutive or trailing special phonetic symbols
    clean = clean.replace(/[_/']+(?=[_/']|$)/g, "");
    return clean.trim();
}

async function textToKatakana(rawText) {
    const text = preprocess(rawText);
    if (!text || text.trim().length === 0) return "";
    const kanji2koe = await getKanji2Koe();
    const result = await kanji2koe.convert(text);
    return sanitizeKoe(result);
}

async function tts(text, voice = "f1", speed = 100) {
    const koe = await textToKatakana(text);
    if (!koe || koe.length === 0) return null;

    const aquestalk = await getAquesTalk(voice);
    try {
        const wav = aquestalk.run(koe, speed);
        return Readable.from(Buffer.from(wav));
    } catch (err) {
        console.warn("[WARN] AquesTalk synthesis fallback:", err.message);
        // Fallback: strip accents/unvoicing and try with plain kana
        const plain = koe.replace(/[_/']/g, "");
        if (!plain || plain.trim().length === 0) return null;
        const wav = aquestalk.run(plain, speed);
        return Readable.from(Buffer.from(wav));
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
            const vc = await TemporaryVC.get(channelId);
            if (vc) {
                const prefs = await TemporaryVC.getPrefs(vc.creator_id);
                if (prefs?.voice_type) {
                    voice = prefs.voice_type;
                }
            }
        }

        const stream = await tts(text, voice || "f1");
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
