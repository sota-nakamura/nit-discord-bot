const db = require("./Database");

class LoLAccount {
    static cacheByDiscord = new Map();
    static cacheByPuuid = new Map();
    static isLoaded = false;

    static _setCache(obj) {
        this.cacheByPuuid.set(obj.puuid, obj);

        const list = this.cacheByDiscord.get(obj.discord_user_id) || [];
        const idx = list.findIndex(a => a.puuid === obj.puuid);
        if (idx !== -1) {
            list[idx] = obj;
        } else {
            list.push(obj);
        }
        this.cacheByDiscord.set(obj.discord_user_id, list);
    }

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM lol_accounts");
            this.cacheByDiscord.clear();
            this.cacheByPuuid.clear();
            for (const r of rows) {
                this._setCache(r);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] LoLAccount: Failed to initialize cache:", err);
        }
    }

    static async register(discordUserId, riotIdName, riotIdTag, puuid) {
        const existing = await this.getByPUUID(puuid);
        if (existing && existing.discord_user_id !== discordUserId) {
            return false;
        }
        const obj = { discord_user_id: discordUserId, riot_id_name: riotIdName, riot_id_tag: riotIdTag, puuid };
        this._setCache(obj);
        return db.run(`
            INSERT INTO lol_accounts (discord_user_id, riot_id_name, riot_id_tag, puuid)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (puuid) DO UPDATE SET
                riot_id_name = EXCLUDED.riot_id_name,
                riot_id_tag = EXCLUDED.riot_id_tag
            WHERE lol_accounts.discord_user_id = EXCLUDED.discord_user_id
        `, discordUserId, riotIdName, riotIdTag, puuid);
    }

    static async unregister(puuid) {
        const existing = this.cacheByPuuid.get(puuid);
        if (existing) {
            const list = this.cacheByDiscord.get(existing.discord_user_id);
            if (list) {
                const filtered = list.filter(a => a.puuid !== puuid);
                if (filtered.length > 0) {
                    this.cacheByDiscord.set(existing.discord_user_id, filtered);
                } else {
                    this.cacheByDiscord.delete(existing.discord_user_id);
                }
            }
            this.cacheByPuuid.delete(puuid);
        }
        return db.run("DELETE FROM lol_accounts WHERE puuid = ?", puuid);
    }

    static async get(discordUserId) {
        if (this.cacheByDiscord.has(discordUserId)) {
            return this.cacheByDiscord.get(discordUserId);
        }
        if (!this.isLoaded) {
            const rows = await db.all("SELECT * FROM lol_accounts WHERE discord_user_id = ?", discordUserId);
            for (const r of rows) {
                this._setCache(r);
            }
            return rows;
        }
        return [];
    }

    static async getByPUUID(puuid) {
        if (this.cacheByPuuid.has(puuid)) {
            return this.cacheByPuuid.get(puuid);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM lol_accounts WHERE puuid = ?", puuid);
            if (row) {
                this._setCache(row);
            }
            return row;
        }
        return null;
    }

    static async getAll() {
        if (this.isLoaded) {
            return Array.from(this.cacheByPuuid.values());
        }
        const rows = await db.all("SELECT * FROM lol_accounts");
        this.cacheByDiscord.clear();
        this.cacheByPuuid.clear();
        for (const r of rows) {
            this._setCache(r);
        }
        this.isLoaded = true;
        return rows;
    }
}

module.exports = LoLAccount;
