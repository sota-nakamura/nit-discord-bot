const db = require("./Database");

class TemporaryVC {
    static async create(channelId, creatorId) {
        return db.run("INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?)", channelId, creatorId);
    }

    static async exists(channelId) {
        return !!await db.get("SELECT 1 FROM temporary_vcs WHERE channel_id = ?", channelId);
    }

    static async save(userId, name, bitrate, memberLimit, notifyLog = 0, readMessage = 0) {
        const existing = !!await db.get("SELECT 1 FROM vc_prefs WHERE user_id = ?", userId);
        if (existing) {
            return db.run("UPDATE vc_prefs SET name = ?, bitrate = ?, member_limit = ?, notify_log = ?, read_message = ? WHERE user_id = ?", name, bitrate, memberLimit, notifyLog, readMessage, userId);
        } else {
            return db.run("INSERT INTO vc_prefs (user_id, name, bitrate, member_limit, notify_log, read_message) VALUES (?, ?, ?, ?, ?, ?)", userId, name, bitrate, memberLimit, notifyLog, readMessage);
        }
    }

    static async getPrefs(userId) {
        return db.get("SELECT * from vc_prefs WHERE user_id = ?", userId);
    }

    static async get(channelId) {
        return db.get("SELECT * FROM temporary_vcs WHERE channel_id = ?", channelId);
    }

    static async delete(channelId) {
        return db.run("DELETE FROM temporary_vcs WHERE channel_id = ?", channelId);
    }
}

module.exports = TemporaryVC;
