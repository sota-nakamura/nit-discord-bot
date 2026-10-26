const db = require("./Database");

class ReishoDic {
    static cache = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM reisho_dic");
            this.cache.clear();
            for (const r of rows) {
                this.cache.set(`${r.type}:${r.content}`, r);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] ReishoDic: Failed to initialize cache:", err);
        }
    }

    static async getAll(type = null) {
        if (this.isLoaded) {
            const all = Array.from(this.cache.values());
            if (type !== null) {
                const typeStr = type ? "単語" : "フレーズ";
                return all.filter(r => r.type === typeStr);
            }
            return all;
        }
        if (type !== null) {
            return await db.all("SELECT * FROM reisho_dic WHERE type = ?", type ? "単語" : "フレーズ");
        } else {
            return await db.all("SELECT * FROM reisho_dic");
        }
    }

    static async get(content, type) {
        const typeStr = type ? "単語" : "フレーズ";
        const key = `${typeStr}:${content}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM reisho_dic WHERE type = ? AND content = ?", typeStr, content);
            if (row) this.cache.set(key, row);
            return row;
        }
        return null;
    }

    static async save(content, type) {
        if (!content || typeof type !== 'number') {
            throw new Error("Content and type are required");
        }
        const typeStr = type ? "単語" : "フレーズ";
        const key = `${typeStr}:${content}`;
        if (this.cache.has(key)) {
            return "既に登録されています";
        }
        if (!this.isLoaded) {
            const exists = await db.get("SELECT * FROM reisho_dic WHERE type = ? AND content = ?", typeStr, content);
            if (exists) {
                this.cache.set(key, exists);
                return "既に登録されています";
            }
        }
        const res = await db.run("INSERT INTO reisho_dic (type, content) VALUES (?, ?)", typeStr, content);
        this.cache.set(key, { type: typeStr, content });
        return res;
    }

    static async delete(content, type) {
        const typeStr = type ? "単語" : "フレーズ";
        this.cache.delete(`${typeStr}:${content}`);
        return await db.run("DELETE FROM reisho_dic WHERE type = ? AND content = ?", typeStr, content);
    }
}

module.exports = ReishoDic;