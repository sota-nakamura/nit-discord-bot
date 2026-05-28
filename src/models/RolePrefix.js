const db = require("./Database");

class RolePrefix {
    static async get(roleId) {
        return db.prepare("SELECT * FROM role_prefix WHERE role_id = ?").get(roleId);
    }

    static async set(roleId, prefix) {
        const existing = await this.get(roleId);
        if (existing) {
            await db.prepare("UPDATE role_prefix SET prefix = ? WHERE role_id = ?").run(prefix, roleId);
        } else {
            await db.prepare("INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)").run(roleId, prefix);
        }
    }

    static async remove(roleId) {
        return await db.prepare("DELETE FROM role_prefix WHERE role_id = ?").run(roleId);
    }

    static async getAll() {
        return await db.prepare("SELECT * FROM role_prefix").all();
    }

    static async restore(prefixes) {
        db.prepare("DELETE FROM role_prefix").run();
        const insert = db.prepare("INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)");
        for (const p of prefixes) {
            insert.run(p.role_id, p.prefix);
        }
    }
}

module.exports = RolePrefix;
