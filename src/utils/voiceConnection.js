const { joinVoiceChannel, createAudioPlayer, VoiceConnectionStatus, entersState } = require("@discordjs/voice");
const { cleanupPlayer, audioPlayers } = require("./tts");

function connectToVC({ channelId, guildId, adapterCreator, botUserId, botIndex }) {
    const connection = joinVoiceChannel({
        channelId,
        guildId,
        adapterCreator,
        selfDeaf: true,
        group: botUserId,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);
    audioPlayers.set(channelId, player);
    player.on("error", (error) => console.error("[ERROR] TTS playback:", error));

    // auto-reconnect on disconnect
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch (e) {
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                try {
                    connection.rejoin();
                } catch (err) {
                    console.error(`[ERROR] Bot ${botIndex} VC再接続に失敗:`, err);
                    connection.destroy();
                    cleanupPlayer(channelId);
                }
            }
        }
    });

    return { connection, player };
}

module.exports = { connectToVC };
