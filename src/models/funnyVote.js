const db = require("./Database");

class FunnyVote {
    static cache = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM funny_vote");
            this.cache.clear();
            for (const r of rows) {
                this.cache.set(r.user_id, r);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] FunnyVote: Failed to initialize cache:", err);
        }
    }

    static async get(userId) {
        if (this.cache.has(userId)) {
            return this.cache.get(userId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM funny_vote WHERE user_id = ?", userId);
            if (row) this.cache.set(row.user_id, row);
            return row;
        }
        return null;
    }

    static async getAll() {
        if (this.isLoaded) {
            return Array.from(this.cache.values());
        }
        const rows = await db.all("SELECT * FROM funny_vote");
        this.cache.clear();
        for (const r of rows) {
            this.cache.set(r.user_id, r);
        }
        this.isLoaded = true;
        return rows;
    }

    static async delete(userId) {
        this.cache.delete(userId);
        return db.run("DELETE FROM funny_vote WHERE user_id = ?", userId);
    }

    static async incrementFunnyCount(userId) {
        const current = this.cache.get(userId) || { user_id: userId, funny_count: 0, not_funny_count: 0 };
        this.cache.set(userId, {
            ...current,
            funny_count: (current.funny_count || 0) + 1
        });
        return db.run(`
            INSERT INTO funny_vote (user_id, funny_count, not_funny_count) VALUES (?, 1, 0)
            ON CONFLICT (user_id) DO UPDATE SET funny_count = funny_vote.funny_count + 1
        `, userId);
    }

    static async incrementNotFunnyCount(userId) {
        const current = this.cache.get(userId) || { user_id: userId, funny_count: 0, not_funny_count: 0 };
        this.cache.set(userId, {
            ...current,
            not_funny_count: (current.not_funny_count || 0) + 1
        });
        return db.run(`
            INSERT INTO funny_vote (user_id, funny_count, not_funny_count) VALUES (?, 0, 1)
            ON CONFLICT (user_id) DO UPDATE SET not_funny_count = funny_vote.not_funny_count + 1
        `, userId);
    }

    static async resetNotFunnyCount(userId) {
        const current = this.cache.get(userId);
        if (current) {
            current.not_funny_count = 0;
            this.cache.set(userId, current);
        }
        return db.run("UPDATE funny_vote SET not_funny_count = 0 WHERE user_id = ?", userId);
    }
}

module.exports = FunnyVote;