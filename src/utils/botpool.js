const { getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice");

function getAvailableBot(guildId, botPool) {
    if (!botPool) return null;
    for (const bot of botPool) {
        if (!bot.client.readyAt) continue;
        const connection = getVoiceConnection(guildId, bot.client.user.id);
        if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
            return bot;
        }
    }
    return null;
}

function getBotForChannel(guildId, channelId, botPool) {
    if (!botPool) return null;
    for (const bot of botPool) {
        if (!bot.client.readyAt) continue;
        const connection = getVoiceConnection(guildId, bot.client.user.id);
        if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed && connection.joinConfig.channelId === channelId) {
            return bot;
        }
    }
    return null;
}

module.exports = {
    getAvailableBot,
    getBotForChannel
}