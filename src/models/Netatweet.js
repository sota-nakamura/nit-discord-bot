const db = require("./Database");

class Netatweet {
    static async isEnabled(guildId) {
        return !!await db.get("SELECT 1 FROM netatweet WHERE guild_id = ?", guildId);
    }
    static async get(guildId) {
        return db.get("SELECT * FROM netatweet WHERE guild_id = ?", guildId);
    }
    static async enable(guildId, displayChannelId, netatweetChannelId, reactionCount) {
        return db.run("INSERT INTO netatweet (guild_id, display_channel_id, netatweet_channel_id, reaction_count) VALUES (?, ?, ?, ?)", guildId, displayChannelId, netatweetChannelId, reactionCount);
    }
    static async disable(guildId) {
        if (!await this.isEnabled(guildId)) {
            return;
        }
        return db.run("DELETE FROM netatweet WHERE guild_id = ?", guildId);
    }
    static async isPosted(messageId) {
        return !!await db.get("SELECT 1 FROM netatweet_list WHERE message_id = ?", messageId);
    }
    static async addPosted(userId, messageId) {
        return db.run("INSERT OR REPLACE INTO netatweet_list (message_id, user_id) VALUES (?, ?)", messageId, userId);
    }
    static async removePosted(messageId) {
        return db.run("DELETE FROM netatweet_list WHERE message_id = ?", messageId);
    }
    static async getPosted(messageId) {
        return db.get("SELECT * FROM netatweet_list WHERE message_id = ?", messageId);
    }
    static async getPostedAll() {
        return db.all("SELECT * FROM netatweet_list");
    }
}

module.exports = Netatweet;