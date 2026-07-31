const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require("@discordjs/voice");
const audioPlayers = new Map();

async function tts(text, voice = "ja-JP-NanamiNeural") {
    const ttsClient = new MsEdgeTTS();
    await ttsClient.setMetadata(voice, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
    const { audioStream } = ttsClient.toStream(text, { volume: "-60%", rate: "medium" });
    return audioStream;
}

async function playTTS(connection, channelId, text) {
    try {
        let player = audioPlayers.get(channelId);
        if (!player) {
            player = createAudioPlayer();
            audioPlayers.set(channelId, player);
            connection.subscribe(player);
            player.on("error", (error) => console.error("[ERROR] TTS playback:", error));
        }
        const stream = await tts(text, "ja-JP-NanamiNeural");
        const resource = createAudioResource(stream, { inputType: StreamType.WebmOpus });

        // wait for it to finish first
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

module.exports = { playTTS, cleanupPlayer, audioPlayers };