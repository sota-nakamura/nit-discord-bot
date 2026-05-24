const db = require("./Database");

class WelcomeMsg {
    static getMsg(guildId) {
        return db.prepare("SELECT * FROM welcome_msg WHERE guild_id = ?").get(guildId);
    }
    static setMsg(guildId, message) {
        const existing = this.getMsg(guildId);
        if (existing) {
            return db.prepare("UPDATE welcome_msg SET message = ? WHERE guild_id = ?").run(message, guildId);
        } else {
            return db.prepare("INSERT INTO welcome_msg (guild_id, message) VALUES (?, ?)").run(guildId, message);
        }
    }
    static exists(guildId) {
        return !!db.prepare("SELECT 1 FROM welcome_msg WHERE guild_id = ?").get(guildId);
    }
    static remove(guildId) {
        return db.prepare("DELETE FROM welcome_msg WHERE guild_id = ?").run(guildId);
    }
}

module.exports = WelcomeMsg;