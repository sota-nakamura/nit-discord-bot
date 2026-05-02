const db = require('./Database');

class RolePrefix {
    static get(roleId) {
        return db.prepare('SELECT * FROM role_prefix WHERE role_id = ?').get(roleId);
    }

    static set(roleId, prefix) {
        const existing = this.get(roleId);
        if (existing) {
            db.prepare('UPDATE role_prefix SET prefix = ? WHERE role_id = ?').run(prefix, roleId);
        } else {
            db.prepare('INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)').run(roleId, prefix);
        }
    }

    static remove(roleId) {
        return db.prepare('DELETE FROM role_prefix WHERE role_id = ?').run(roleId);
    }

    static getAll() {
        return db.prepare('SELECT * FROM role_prefix').all();
    }
}

module.exports = RolePrefix;
