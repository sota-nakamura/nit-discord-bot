const db = require("./Database");

class LoLAccount {
    static cacheByDiscord = new Map();
    static cacheByPuuid = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM lol_accounts");
            this.cacheByDiscord.clear();
            this.cacheByPuuid.clear();
            for (const r of rows) {
                this.cacheByDiscord.set(r.discord_user_id, r);
                this.cacheByPuuid.set(r.puuid, r);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] LoLAccount: Failed to initialize cache:", err);
        }
    }

    static async register(discordUserId, riotIdName, riotIdTag, puuid) {
        const obj = { discord_user_id: discordUserId, riot_id_name: riotIdName, riot_id_tag: riotIdTag, puuid };
        this.cacheByDiscord.set(discordUserId, obj);
        this.cacheByPuuid.set(puuid, obj);
        return db.run(`
            INSERT INTO lol_accounts (discord_user_id, riot_id_name, riot_id_tag, puuid)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (discord_user_id) DO UPDATE SET
                riot_id_name = EXCLUDED.riot_id_name,
                riot_id_tag = EXCLUDED.riot_id_tag,
                puuid = EXCLUDED.puuid
        `, discordUserId, riotIdName, riotIdTag, puuid);
    }

    static async unregister(puuid) {
        const existing = this.cacheByPuuid.get(puuid);
        if (existing) {
            this.cacheByDiscord.delete(existing.discord_user_id);
            this.cacheByPuuid.delete(puuid);
        }
        return db.run("DELETE FROM lol_accounts WHERE puuid = ?", puuid);
    }

    static async get(discordUserId) {
        if (this.cacheByDiscord.has(discordUserId)) {
            return this.cacheByDiscord.get(discordUserId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM lol_accounts WHERE discord_user_id = ?", discordUserId);
            if (row) {
                this.cacheByDiscord.set(row.discord_user_id, row);
                this.cacheByPuuid.set(row.puuid, row);
            }
            return row;
        }
        return null;
    }

    static async getByPUUID(puuid) {
        if (this.cacheByPuuid.has(puuid)) {
            return this.cacheByPuuid.get(puuid);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM lol_accounts WHERE puuid = ?", puuid);
            if (row) {
                this.cacheByDiscord.set(row.discord_user_id, row);
                this.cacheByPuuid.set(row.puuid, row);
            }
            return row;
        }
        return null;
    }

    static async getAll() {
        if (this.isLoaded) {
            return Array.from(this.cacheByDiscord.values());
        }
        const rows = await db.all("SELECT * FROM lol_accounts");
        this.cacheByDiscord.clear();
        this.cacheByPuuid.clear();
        for (const r of rows) {
            this.cacheByDiscord.set(r.discord_user_id, r);
            this.cacheByPuuid.set(r.puuid, r);
        }
        this.isLoaded = true;
        return rows;
    }
}

module.exports = LoLAccount;
