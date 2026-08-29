const db = require("./Database");

class impersonated {
    static async insert(messageId, userId) {
        return db.run("INSERT INTO impersonated_messages (message_id, user_id) VALUES (?, ?)", messageId, userId);
    }
    static async delete(messageId) {
        return db.run("DELETE FROM impersonated_messages WHERE message_id = ? ", messageId);
    }
    static async get(messageId) {
        return db.get("SELECT * FROM impersonated_messages WHERE message_id = ? ", messageId);
    }
}

module.exports = impersonated;