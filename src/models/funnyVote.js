const db = require("./Database");

class FunnyVote {
    static async get(userId) {
        return db.get("SELECT * FROM funny_vote WHERE user_id = ?", userId);
    }
    static async getAll() {
        return db.all("SELECT * FROM funny_vote");
    }
    static async delete(userId) {
        return db.run("DELETE FROM funny_vote WHERE user_id = ?", userId);
    }
    static async incrementFunnyCount(userId) {
        if (await this.get(userId)) {
            return db.run("UPDATE funny_vote SET funny_count = funny_count + 1 WHERE user_id = ?", userId);
        } else {
            return db.run("INSERT INTO funny_vote (user_id, funny_count, not_funny_count) VALUES (?, ?, ?)", userId, 1, 0);
        }
    }
    static async incrementNotFunnyCount(userId) {
        if (await this.get(userId)) {
            return db.run("UPDATE funny_vote SET not_funny_count = not_funny_count + 1 WHERE user_id = ?", userId);
        } else {
            return db.run("INSERT INTO funny_vote (user_id, funny_count, not_funny_count) VALUES (?, ?, ?)", userId, 0, 1);
        }
    }
    static async resetNotFunnyCount(userId) {
        return db.run("UPDATE funny_vote SET not_funny_count = 0 WHERE user_id = ?", userId);
    }
}

module.exports = FunnyVote;