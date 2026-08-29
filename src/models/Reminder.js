const db = require("./Database");

class Reminder {
    static async create(reminderId, userId, time, message) {
        await db.run("INSERT INTO reminder (reminder_id, user_id, time, message) VALUES (?, ?, ?, ?) ", reminderId, userId, time, message);
    }
    static async delete(reminderId) {
        await db.run("DELETE FROM reminder WHERE reminder_id = ? ", reminderId);
    }
    static async get(reminderId) {
        return db.get("SELECT * FROM reminder WHERE reminder_id = ? ", reminderId);
    }
    static async getAllByUser(user_id) {
        return db.all("SELECT * FROM reminder WHERE user_id = ? ", user_id);
    }
    static async getActive() {
        return db.all("SELECT * FROM reminder WHERE time > ? ", Date.now());
    }
}

module.exports = Reminder;