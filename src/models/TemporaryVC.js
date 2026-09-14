const db = require("./Database");

class TemporaryVC {
    static async createVC(channelId, creatorId) {
        return db.run("INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?)", channelId, creatorId);
    }

    static async existsVC(channelId) {
        return !!await db.get("SELECT 1 FROM temporary_vcs WHERE channel_id = ?", channelId);
    }

    static async savePrefs(userId, name, memberLimit, notifyLog = 0, readMessage = 0, voiceType = "f1") {
        const existing = !!await db.get("SELECT 1 FROM vc_prefs WHERE user_id = ?", userId);
        if (existing) {
            return db.run("UPDATE vc_prefs SET name = ?, member_limit = ?, notify_log = ?, read_message = ?, voice_type = ? WHERE user_id = ?", name, memberLimit, notifyLog, readMessage, voiceType, userId);
        } else {
            return db.run("INSERT INTO vc_prefs (user_id, name, member_limit, notify_log, read_message, voice_type) VALUES (?, ?, ?, ?, ?, ?)", userId, name, memberLimit, notifyLog, readMessage, voiceType);
        }
    }

    static async getPrefs(userId) {
        return db.get("SELECT * from vc_prefs WHERE user_id = ?", userId);
    }

    static async getVC(channelId) {
        return db.get("SELECT * FROM temporary_vcs WHERE channel_id = ?", channelId);
    }

    static async getAllVC() {
        return db.all("SELECT * FROM temporary_vcs");
    }

    static async deleteVC(channelId) {
        return db.run("DELETE FROM temporary_vcs WHERE channel_id = ?", channelId);
    }
}

module.exports = TemporaryVC;
