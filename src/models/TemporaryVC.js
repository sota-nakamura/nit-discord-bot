const db = require("./Database");

class TemporaryVC {
    static cacheVC = new Map();
    static cachePrefs = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const [vcs, prefs] = await Promise.all([
                db.all("SELECT * FROM temporary_vcs"),
                db.all("SELECT * FROM vc_prefs")
            ]);
            this.cacheVC.clear();
            for (const v of vcs) {
                this.cacheVC.set(v.channel_id, v);
            }
            this.cachePrefs.clear();
            for (const p of prefs) {
                this.cachePrefs.set(p.user_id, p);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] TemporaryVC: Failed to initialize cache:", err);
        }
    }

    static async createVC(channelId, creatorId) {
        const row = { channel_id: channelId, creator_id: creatorId };
        this.cacheVC.set(channelId, row);
        return db.run(
            "INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?) ON CONFLICT (channel_id) DO NOTHING",
            channelId, creatorId
        );
    }

    static async existsVC(channelId) {
        if (this.cacheVC.has(channelId)) return true;
        if (!this.isLoaded) {
            return !!await db.get("SELECT 1 FROM temporary_vcs WHERE channel_id = ?", channelId);
        }
        return false;
    }

    static async savePrefs(userId, name, memberLimit = 0, notifyLog = 0, readMessage = 0, voiceType = "f1") {
        const prefObj = {
            user_id: userId,
            name,
            member_limit: memberLimit,
            notify_log: notifyLog,
            read_message: readMessage,
            voice_type: voiceType
        };
        this.cachePrefs.set(userId, prefObj);
        return db.run(`
            INSERT INTO vc_prefs (user_id, name, member_limit, notify_log, read_message, voice_type)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                member_limit = EXCLUDED.member_limit,
                notify_log = EXCLUDED.notify_log,
                read_message = EXCLUDED.read_message,
                voice_type = EXCLUDED.voice_type
        `, userId, name, memberLimit, notifyLog, readMessage, voiceType);
    }

    static async getPrefs(userId) {
        if (this.cachePrefs.has(userId)) {
            return this.cachePrefs.get(userId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM vc_prefs WHERE user_id = ?", userId);
            if (row) this.cachePrefs.set(row.user_id, row);
            return row;
        }
        return null;
    }

    static async getVC(channelId) {
        if (this.cacheVC.has(channelId)) {
            return this.cacheVC.get(channelId);
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM temporary_vcs WHERE channel_id = ?", channelId);
            if (row) this.cacheVC.set(row.channel_id, row);
            return row;
        }
        return null;
    }

    static async getAllVC() {
        if (this.isLoaded) {
            return Array.from(this.cacheVC.values());
        }
        const rows = await db.all("SELECT * FROM temporary_vcs");
        this.cacheVC.clear();
        for (const v of rows) {
            this.cacheVC.set(v.channel_id, v);
        }
        this.isLoaded = true;
        return rows;
    }

    static async deleteVC(channelId) {
        this.cacheVC.delete(channelId);
        return db.run("DELETE FROM temporary_vcs WHERE channel_id = ?", channelId);
    }
}

module.exports = TemporaryVC;
