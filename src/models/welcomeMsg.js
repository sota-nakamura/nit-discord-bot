const db = require("./Database");

class WelcomeMsg {
    static async getMsg(guildId) {
        return db.get("SELECT * FROM welcome_msg WHERE guild_id = ?", guildId);
    }
    static async setMsg(guildId, message) {
        const existing = await this.getMsg(guildId);
        if (existing) {
            return db.run("UPDATE welcome_msg SET message = ? WHERE guild_id = ?", message, guildId);
        } else {
            return db.run("INSERT INTO welcome_msg (guild_id, message) VALUES (?, ?)", guildId, message);
        }
    }
    static async exists(guildId) {
        return !!await db.get("SELECT 1 FROM welcome_msg WHERE guild_id = ?", guildId);
    }
    static async remove(guildId) {
        return db.run("DELETE FROM welcome_msg WHERE guild_id = ?", guildId);
    }
}

module.exports = WelcomeMsg;