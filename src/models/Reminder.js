const db = require("./Database");

class Reminder {
    static async create(reminderId, userId, time, message) {
        await db.prepare("INSERT INTO reminder (reminder_id, user_id, time, message) VALUES (?, ?, ?, ?) ").run(reminderId, userId, time, message);
    }
    static async delete(reminderId) {
        await db.prepare("DELETE FROM reminder WHERE reminder_id = ? ").run(reminderId);
    }
    static async get(reminderId) {
        return await db.prepare("SELECT * FROM reminder WHERE reminder_id = ? ").get(reminderId);
    }
    static async getAllByUser(user_id) {
        return await db.prepare("SELECT * FROM reminder WHERE user_id = ? ").all(user_id);
    }
    static async getActive() {
        return await db.prepare("SELECT * FROM reminder WHERE time > ? ").run(Date.now());
    }
}

module.exports = Reminder;