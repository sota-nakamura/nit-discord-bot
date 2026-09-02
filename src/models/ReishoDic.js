const db = require("./Database");

class ReishoDic {
    static async getAll(type = null) {
        if (type) {
            return await db.all("SELECT * FROM reisho_dic WHERE type = ?", type ? "単語" : "フレーズ");
        } else {
            return await db.all("SELECT * FROM reisho_dic");
        }
    }
    static async get(content, type) {
        return await db.get("SELECT * FROM reisho_dic WHERE type = ? AND content = ?", type ? "単語" : "フレーズ", content);
    }
    static async save(content, type) {
        if (!content || typeof type !== 'number') {
            throw new Error("Content and type are required");
        }
        const exists = await db.get("SELECT * FROM reisho_dic WHERE type = ? AND content = ?", type ? "単語" : "フレーズ", content);
        if (exists) {
            return "既に登録されています";
        }
        return await db.run("INSERT INTO reisho_dic (type, content) VALUES (?, ?)", type ? "単語" : "フレーズ", content);
    }
    static async delete(content, type) {
        return await db.run("DELETE FROM reisho_dic WHERE type = ? AND content = ?", type ? "単語" : "フレーズ", content);
    }
}

module.exports = ReishoDic;