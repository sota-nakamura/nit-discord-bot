const db = require("./Database");

class Reminder {
    static cache = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM reminder");
            this.cache.clear();
            for (const r of rows) {
                this.cache.set(r.reminder_id, r);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] Reminder: Failed to initialize cache:", err);
        }
    }

    static async create(reminderId, userId, time, message) {
        const obj = { reminder_id: reminderId, user_id: userId, time: Number(time), message };
        this.cache.set(reminderId, obj);
        return db.run(
            "INSERT INTO reminder (reminder_id, user_id, time, message) VALUES (?, ?, ?, ?) ON CONFLICT (reminder_id) DO NOTHING",
            reminderId, userId, time, message
        );
    }

    static async delete(reminderId) {
        this.cache.delete(reminderId);
        return db.run("DELETE FROM reminder WHERE reminder_id = ?", reminderId);
    }

    static async get(reminderId) {
        if (this.cache.has(reminderId)) {
            return this.cache.get(reminderId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM reminder WHERE reminder_id = ?", reminderId);
            if (row) this.cache.set(row.reminder_id, row);
            return row;
        }
        return null;
    }

    static async getAllByUser(user_id) {
        if (this.isLoaded) {
            return Array.from(this.cache.values()).filter(r => r.user_id === user_id);
        }
        return db.all("SELECT * FROM reminder WHERE user_id = ?", user_id);
    }

    static async getActive() {
        const now = Date.now();
        if (this.isLoaded) {
            return Array.from(this.cache.values()).filter(r => Number(r.time) > now);
        }
        return db.all("SELECT * FROM reminder WHERE time > ?", now);
    }
}

module.exports = Reminder;