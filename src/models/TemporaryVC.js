const db = require('./Database');

class TemporaryVC {
    static create(channelId, creatorId) {
        return db.prepare('INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?)').run(channelId, creatorId);
    }

    static get(channelId) {
        return db.prepare('SELECT creator_id FROM temporary_vcs WHERE channel_id = ?').get(channelId);
    }

    static exists(channelId) {
        return !!db.prepare('SELECT 1 FROM temporary_vcs WHERE channel_id = ?').get(channelId);
    }

    static delete(channelId) {
        return db.prepare('DELETE FROM temporary_vcs WHERE channel_id = ?').run(channelId);
    }
}

module.exports = TemporaryVC;
