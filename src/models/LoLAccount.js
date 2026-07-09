const db = require("./Database");

class LoLAccount {
    static async register(discordUserId, riotIdName, riotIdTag, puuid) {
        const stmt = db.prepare(
            "INSERT OR REPLACE INTO lol_accounts (discord_user_id, riot_id_name, riot_id_tag, puuid) VALUES (?, ?, ?, ?)"
        );
        await stmt.run(discordUserId, riotIdName, riotIdTag, puuid);
    }

    static async unregister(discordUserId) {
        const stmt = db.prepare("DELETE FROM lol_accounts WHERE discord_user_id = ?");
        await stmt.run(discordUserId);
    }

    static async get(discordUserId) {
        const stmt = db.prepare("SELECT * FROM lol_accounts WHERE discord_user_id = ?");
        return await stmt.get(discordUserId);
    }

    static async getAll() {
        const stmt = db.prepare("SELECT * FROM lol_accounts");
        return await stmt.all();
    }
}

module.exports = LoLAccount;
