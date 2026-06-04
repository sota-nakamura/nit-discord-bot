const db = require("./Database");

class Netatweet {
    static isEnabled(guildId) {
        return !!db.prepare("SELECT 1 FROM netatweet WHERE guild_id = ?").get(guildId);
    }
    static get(guildId) {
        return db.prepare("SELECT * FROM netatweet WHERE guild_id = ?").get(guildId);
    }
    static async enable(guildId, displayChannelId, netatweetChannelId, reactionCount) {
        db.prepare("INSERT INTO netatweet (guild_id, display_channel_id, netatweet_channel_id, reaction_count) VALUES (?, ?, ?, ?)")
            .run(guildId, displayChannelId, netatweetChannelId, reactionCount);
    }
    static async disable(guildId) {
        if (!this.isEnabled(guildId)) {
            return;
        }
        db.prepare("DELETE FROM netatweet WHERE guild_id = ?").run(guildId);
    }
    static isPosted(messageId) {
        return !!db.prepare("SELECT 1 FROM netatweet_list WHERE message_id = ?").get(messageId);
    }
    static addPosted(userId, messageId) {
        return db.prepare("INSERT OR REPLACE INTO netatweet_list (message_id, user_id) VALUES (?, ?)").run(messageId, userId);
    }
    static removePosted(messageId) {
        return db.prepare("DELETE FROM netatweet_list WHERE message_id = ?").run(messageId);
    }
    static getPosted(messageId) {
        return db.prepare("SELECT * FROM netatweet_list WHERE message_id = ?").get(messageId);
    }
    static getPostedAll() {
        return db.prepare("SELECT * FROM netatweet_list").all();
    }
}

module.exports = Netatweet;