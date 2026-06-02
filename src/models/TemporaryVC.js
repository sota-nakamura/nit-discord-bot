const db = require("./Database");

class TemporaryVC {
    static create(channelId, creatorId) {
        return db.prepare("INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?)").run(channelId, creatorId);
    }

    static exists(channelId) {
        return !!db.prepare("SELECT 1 FROM temporary_vcs WHERE channel_id = ?").get(channelId);
    }

    static save(userId, name, bitrate, memberLimit) {
        const existing = !!db.prepare("SELECT 1 FROM vc_prefs WHERE user_id = ?").get(userId);
        if (existing) {
            return db.prepare("UPDATE vc_prefs SET name = ?, bitrate = ?, member_limit = ? WHERE user_id = ?").run(name, bitrate, memberLimit, userId);
        } else {
            return db.prepare("INSERT INTO vc_prefs (user_id, name, bitrate, member_limit) VALUES (?, ?, ?, ?)").run(userId, name, bitrate, memberLimit);
        }
    }

    static get(channelId) {
        return db.prepare("SELECT * FROM temporary_vcs WHERE channel_id = ?").get(channelId);
    }

    static delete(channelId) {
        return db.prepare("DELETE FROM temporary_vcs WHERE channel_id = ?").run(channelId);
    }
}

module.exports = TemporaryVC;
