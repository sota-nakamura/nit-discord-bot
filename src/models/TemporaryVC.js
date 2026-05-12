const db = require('./Database');

class TemporaryVC {
    static create(channelId, creatorId) {
        return db.prepare('INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?)').run(channelId, creatorId);
    }

    static exists(channelId) {
        return !!db.prepare('SELECT 1 FROM temporary_vcs WHERE channel_id = ?').get(channelId);
    }

    static saveName(userId, name) {
        const existing = !!db.prepare('SELECT 1 FROM vc_prefs WHERE user_id = ?').get(userId);
        if (existing) {
            return db.prepare('UPDATE vc_prefs SET name = ? WHERE user_id = ?').run(name, userId);
        } else {
            return db.prepare('INSERT INTO vc_prefs (user_id, name) VALUES (?, ?)').run(userId, name);
        }
    }

    static getName(userId) {
        return db.prepare('SELECT name FROM vc_prefs WHERE user_id = ?').get(userId);
    }

    static delete(channelId) {
        return db.prepare('DELETE FROM temporary_vcs WHERE channel_id = ?').run(channelId);
    }
}

module.exports = TemporaryVC;
