const db = require("./Database");

class Netatweet {
    static settingsCache = new Map();
    static postedCache = new Set();
    static isLoaded = false;

    static async initCache() {
        try {
            const [settings, posted] = await Promise.all([
                db.all("SELECT * FROM netatweet"),
                db.all("SELECT * FROM netatweet_list")
            ]);
            this.settingsCache.clear();
            for (const s of settings) {
                this.settingsCache.set(s.guild_id, s);
            }
            this.postedCache.clear();
            for (const p of posted) {
                this.postedCache.add(p.message_id);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] Netatweet: Failed to initialize cache:", err);
        }
    }

    static async isEnabled(guildId) {
        if (this.settingsCache.has(guildId)) return true;
        if (!this.isLoaded) {
            return !!await db.get("SELECT 1 FROM netatweet WHERE guild_id = ?", guildId);
        }
        return false;
    }

    static async get(guildId) {
        if (this.settingsCache.has(guildId)) {
            return this.settingsCache.get(guildId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM netatweet WHERE guild_id = ?", guildId);
            if (row) this.settingsCache.set(row.guild_id, row);
            return row;
        }
        return null;
    }

    static async enable(guildId, displayChannelId, netatweetChannelId, reactionCount) {
        const obj = { guild_id: guildId, display_channel_id: displayChannelId, netatweet_channel_id: netatweetChannelId, reaction_count: reactionCount };
        this.settingsCache.set(guildId, obj);
        return db.run(`
            INSERT INTO netatweet (guild_id, display_channel_id, netatweet_channel_id, reaction_count)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (guild_id) DO UPDATE SET
                display_channel_id = EXCLUDED.display_channel_id,
                netatweet_channel_id = EXCLUDED.netatweet_channel_id,
                reaction_count = EXCLUDED.reaction_count
        `, guildId, displayChannelId, netatweetChannelId, reactionCount);
    }

    static async disable(guildId) {
        this.settingsCache.delete(guildId);
        return db.run("DELETE FROM netatweet WHERE guild_id = ?", guildId);
    }

    static async isPosted(messageId) {
        if (this.postedCache.has(messageId)) return true;
        if (!this.isLoaded) {
            return !!await db.get("SELECT 1 FROM netatweet_list WHERE message_id = ?", messageId);
        }
        return false;
    }

    static async addPosted(userId, messageId) {
        this.postedCache.add(messageId);
        return db.run(
            "INSERT INTO netatweet_list (message_id, user_id) VALUES (?, ?) ON CONFLICT (message_id) DO UPDATE SET user_id = EXCLUDED.user_id",
            messageId,
            userId
        );
    }

    static async removePosted(messageId) {
        this.postedCache.delete(messageId);
        return db.run("DELETE FROM netatweet_list WHERE message_id = ?", messageId);
    }

    static async getPosted(messageId) {
        return db.get("SELECT * FROM netatweet_list WHERE message_id = ?", messageId);
    }

    static async getPostedAll() {
        if (this.isLoaded) {
            return Array.from(this.postedCache).map(message_id => ({ message_id }));
        }
        return db.all("SELECT * FROM netatweet_list");
    }
}

module.exports = Netatweet;