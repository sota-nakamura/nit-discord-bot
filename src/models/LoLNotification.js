const db = require("./Database");

class LoLNotification {
    static userCache = new Set();
    static channelCache = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const [users, channels] = await Promise.all([
                db.all("SELECT * FROM lol_notification"),
                db.all("SELECT * FROM lol_notification_channel")
            ]);
            this.userCache.clear();
            for (const u of users) {
                this.userCache.add(u.user_id);
            }
            this.channelCache.clear();
            for (const c of channels) {
                this.channelCache.set(c.guild_id, c.channel_id);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] LoLNotification: Failed to initialize cache:", err);
        }
    }

    static async subscribe(userId) {
        this.userCache.add(userId);
        return db.run("INSERT INTO lol_notification (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING", userId);
    }

    static async unsubscribe(userId) {
        this.userCache.delete(userId);
        return db.run("DELETE FROM lol_notification WHERE user_id = ?", userId);
    }

    static async subscribed(userId) {
        if (this.userCache.has(userId)) return true;
        if (!this.isLoaded) {
            const row = await db.get("SELECT 1 FROM lol_notification WHERE user_id = ?", userId);
            if (row) this.userCache.add(userId);
            return !!row;
        }
        return false;
    }

    static async getAll() {
        if (this.isLoaded) {
            return Array.from(this.userCache).map(user_id => ({ user_id }));
        }
        const rows = await db.all("SELECT * FROM lol_notification");
        this.userCache.clear();
        for (const u of rows) {
            this.userCache.add(u.user_id);
        }
        this.isLoaded = true;
        return rows;
    }

    static async setSettings(guildId, channelId) {
        this.channelCache.set(guildId, channelId);
        return db.run(`
            INSERT INTO lol_notification_channel (guild_id, channel_id) VALUES (?, ?)
            ON CONFLICT (guild_id) DO UPDATE SET channel_id = EXCLUDED.channel_id
        `, guildId, channelId);
    }

    static async removeSettings(guildId) {
        this.channelCache.delete(guildId);
        return db.run("DELETE FROM lol_notification_channel WHERE guild_id = ?", guildId);
    }

    static async getSettings(guildId) {
        if (this.channelCache.has(guildId)) {
            return { guild_id: guildId, channel_id: this.channelCache.get(guildId) };
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM lol_notification_channel WHERE guild_id = ?", guildId);
            if (row) this.channelCache.set(row.guild_id, row.channel_id);
            return row;
        }
        return null;
    }

    static async enable(guildId, channelId) {
        this.channelCache.set(guildId, channelId);
        return db.run(`
            INSERT INTO lol_notification_channel (guild_id, channel_id) VALUES (?, ?)
            ON CONFLICT (guild_id) DO UPDATE SET channel_id = EXCLUDED.channel_id
        `, guildId, channelId);
    }

    static async disable(guildId) {
        return this.removeSettings(guildId);
    }

    static async isEnabled(guildId) {
        if (this.channelCache.has(guildId)) return true;
        if (!this.isLoaded) {
            return !!await this.getSettings(guildId);
        }
        return false;
    }

    static async isEnabledSync(guildId) {
        return this.channelCache.has(guildId);
    }
}

module.exports = LoLNotification;