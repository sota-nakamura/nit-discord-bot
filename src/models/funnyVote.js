const db = require("./Database");

class FunnyVote {
    static async get(userId) {
        return db.prepare("SELECT * FROM funny_vote WHERE user_id = ?").get(userId);
    }
    static async getAll() {
        return db.prepare("SELECT * FROM funny_vote").all();
    }
    static async delete(userId) {
        db.prepare("DELETE FROM funny_vote WHERE user_id = ?").run(userId);
    }
    static async incrementFunnyCount(userId) {
        if (await this.get(userId)) {
            db.prepare("UPDATE funny_vote SET funny_count = funny_count + 1 WHERE user_id = ?").run(userId);
        } else {
            db.prepare("INSERT INTO funny_vote (user_id, funny_count, not_funny_count) VALUES (?, ?, ?)").run(userId, 1, 0);
        }
    }
    static async incrementNotFunnyCount(userId) {
        if (await this.get(userId)) {
            db.prepare("UPDATE funny_vote SET not_funny_count = not_funny_count + 1 WHERE user_id = ?").run(userId);
        } else {
            db.prepare("INSERT INTO funny_vote (user_id, funny_count, not_funny_count) VALUES (?, ?, ?)").run(userId, 0, 1);
        }
    }
    static async resetNotFunnyCount(userId) {
        db.prepare("UPDATE funny_vote SET not_funny_count = 0 WHERE user_id = ?").run(userId);
    }

}