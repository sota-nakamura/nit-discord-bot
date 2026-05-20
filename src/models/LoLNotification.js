const db = require("./Database");

class LoLNotification {
    static async subscribe(userId) {
        await db.prepare("INSERT INTO lol_notification (user_id) VALUES (?) ").run(userId);
    }
    static async unsubscribe(userId) {
        await db.prepare("DELETE FROM lol_notification WHERE user_id = ? ").run(userId);
    }
    static async getAll() {
        return await db.prepare("SELECT * FROM lol_notification").all();
    }
    static async exists(userId) {
        return await db.prepare("SELECT * FROM lol_notification WHERE user_id = ? ").get(userId);
    }
}

module.exports = LoLNotification;