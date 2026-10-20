const db = require("./Database");

class WelcomeMsg {
    static cache = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM welcome_msg");
            this.cache.clear();
            for (const r of rows) {
                this.cache.set(r.guild_id, r);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] WelcomeMsg: Failed to initialize cache:", err);
        }
    }

    static async getMsg(guildId) {
        if (this.cache.has(guildId)) {
            return this.cache.get(guildId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM welcome_msg WHERE guild_id = ?", guildId);
            if (row) this.cache.set(row.guild_id, row);
            return row;
        }
        return null;
    }

    static async setMsg(guildId, message) {
        this.cache.set(guildId, { guild_id: guildId, message });
        return db.run(`
            INSERT INTO welcome_msg (guild_id, message) VALUES (?, ?)
            ON CONFLICT (guild_id) DO UPDATE SET message = EXCLUDED.message
        `, guildId, message);
    }

    static async exists(guildId) {
        if (this.cache.has(guildId)) return true;
        if (!this.isLoaded) {
            return !!await db.get("SELECT 1 FROM welcome_msg WHERE guild_id = ?", guildId);
        }
        return false;
    }

    static async remove(guildId) {
        this.cache.delete(guildId);
        return db.run("DELETE FROM welcome_msg WHERE guild_id = ?", guildId);
    }
}

module.exports = WelcomeMsg;