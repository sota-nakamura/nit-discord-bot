const db = require("./Database");

class LoLNotification {
    static async subscribe(userId) {
        return db.run("INSERT INTO lol_notification (user_id) VALUES (?) ", userId);
    }
    static async unsubscribe(userId) {
        return db.run("DELETE FROM lol_notification WHERE user_id = ? ", userId);
    }
    static async subscribed(userId) {
        return !!await db.get("SELECT * FROM lol_notification WHERE user_id = ? ", userId);
    }
    static async getAll() {
        return db.all("SELECT * FROM lol_notification");
    }
    static async setSettings(guildId, channelId) {
        if (await this.getSettings(guildId)) {
            return db.run("UPDATE lol_notification_channel SET channel_id = ? WHERE guild_id = ? ", channelId, guildId);
        }
        return db.run("INSERT INTO lol_notification_channel (guild_id, channel_id) VALUES (?, ?) ", guildId, channelId);
    }
    static async removeSettings(guildId) {
        return db.run("DELETE FROM lol_notification_channel WHERE guild_id = ? ", guildId);
    }
    static async getSettings(guildId) {
        return db.get("SELECT * FROM lol_notification_channel WHERE guild_id = ?", guildId);
    }
    static async enable(guildId, channelId) {
        if (await this.isEnabled(guildId)) {
            return;
        }
        return db.run("INSERT INTO lol_notification_channel (guild_id, channel_id) VALUES (?, ?) ", guildId, channelId);
    }
    static async disable(guildId) {
        return db.run("DELETE FROM lol_notification_channel WHERE guild_id = ? ", guildId);
    }
    static async isEnabled(guildId) {
        return !!await db.get("SELECT 1 FROM lol_notification_channel WHERE guild_id = ? ", guildId);
    }
    static async isEnabledSync(guildId) {
        // Compatibility helper if needed, but resolved via async where possible
        return !!await db.get("SELECT 1 FROM lol_notification_channel WHERE guild_id = ? ", guildId);
    }
}

module.exports = LoLNotification;