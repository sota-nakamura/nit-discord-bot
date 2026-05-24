const db = require("./Database");

class LoLNotification {
    static async subscribe(userId) {
        await db.prepare("INSERT INTO lol_notification (user_id) VALUES (?) ").run(userId);
    }
    static async unsubscribe(userId) {
        await db.prepare("DELETE FROM lol_notification WHERE user_id = ? ").run(userId);
    }
    static async subscribed(userId) {
        return !!db.prepare("SELECT * FROM lol_notification WHERE user_id = ? ").get(userId);
    }
    static getAll() {
        return db.prepare("SELECT * FROM lol_notification").all();
    }
    static async setSettings(guildId, channelId) {
        await db.prepare("INSERT INTO lol_notification_channel (guild_id, channel_id) VALUES (?, ?) ").run(guildId, channelId);
    }
    static async removeSettings(guildId) {
        await db.prepare("DELETE FROM lol_notification_channel WHERE guild_id = ? ").run(guildId);
    }
    static async getSettings(guildId) {
        return await db.prepare("SELECT channel_id FROM lol_notification_channel WHERE guild_id = ?").get(guildId);
    }
    static async enable(guildId, channelId) {
        await db.prepare("INSERT INTO lol_notification_channel (guild_id, channel_id) VALUES (?, ?) ").run(guildId, channelId);
    }
    static async disable(guildId) {
        await db.prepare("DELETE FROM lol_notification_channel WHERE guild_id = ? ").run(guildId);
    }
    static async isEnabled(guildId) {
        return !!db.prepare("SELECT 1 FROM lol_notification_channel WHERE guild_id = ? ").get(guildId);
    }
    static isEnabledSync(guildId) {
        return !!db.prepare("SELECT 1 FROM lol_notification_channel WHERE guild_id = ? ").get(guildId);
    }
}

module.exports = LoLNotification;