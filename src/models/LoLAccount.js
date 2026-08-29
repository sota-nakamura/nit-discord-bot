const db = require("./Database");

class LoLAccount {
    static async register(discordUserId, riotIdName, riotIdTag, puuid) {
        return db.run(
            "INSERT INTO lol_accounts (discord_user_id, riot_id_name, riot_id_tag, puuid) VALUES (?, ?, ?, ?)",
            discordUserId, riotIdName, riotIdTag, puuid
        );
    }

    static async unregister(puuid) {
        return db.run("DELETE FROM lol_accounts WHERE puuid = ?", puuid);
    }

    static async get(discordUserId) {
        return db.get("SELECT * FROM lol_accounts WHERE discord_user_id = ?", discordUserId);
    }

    static async getByPUUID(puuid) {
        return db.get("SELECT * FROM lol_accounts WHERE puuid = ?", puuid);
    }

    static async getAll() {
        return db.all("SELECT * FROM lol_accounts");
    }
}

module.exports = LoLAccount;
