const db = require("./Database");

class LoLAccount {
    static register(discordUserId, riotIdName, riotIdTag, puuid) {
        const stmt = db.prepare(
            "INSERT OR REPLACE INTO lol_accounts (discord_user_id, riot_id_name, riot_id_tag, puuid) VALUES (?, ?, ?, ?)"
        );
        stmt.run(discordUserId, riotIdName, riotIdTag, puuid);
    }

    static unregister(discordUserId) {
        const stmt = db.prepare("DELETE FROM lol_accounts WHERE discord_user_id = ?");
        stmt.run(discordUserId);
    }

    static get(discordUserId) {
        const stmt = db.prepare("SELECT * FROM lol_accounts WHERE discord_user_id = ?");
        return stmt.get(discordUserId);
    }

    static getAll() {
        const stmt = db.prepare("SELECT * FROM lol_accounts");
        return stmt.all();
    }
}

module.exports = LoLAccount;
