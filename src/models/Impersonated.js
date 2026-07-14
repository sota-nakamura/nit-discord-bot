const db = require("./Database");

class impersonated {
    static async insert(messageId, userId) {
        const stmt = db.prepare("INSERT INTO impersonated_messages (message_id, user_id) VALUES (?, ?)");
        stmt.run(messageId, userId);
    }
    static async delete(messageId) {
        const stmt = db.prepare("DELETE FROM impersonated_messages WHERE message_id = ? ");
        stmt.run(messageId);
    }
    static async get(messageId) {
        const stmt = db.prepare("SELECT * FROM impersonated_messages WHERE message_id = ? ");
        return stmt.get(messageId);
    }
}

module.exports = impersonated;