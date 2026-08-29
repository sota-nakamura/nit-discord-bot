const db = require("./Database");

class RolePrefix {
    static async get(roleId) {
        return db.get("SELECT * FROM role_prefix WHERE role_id = ?", roleId);
    }

    static async set(roleId, prefix) {
        const existing = await this.get(roleId);
        if (existing) {
            await db.run("UPDATE role_prefix SET prefix = ? WHERE role_id = ?", prefix, roleId);
        } else {
            await db.run("INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)", roleId, prefix);
        }
    }

    static async remove(roleId) {
        return db.run("DELETE FROM role_prefix WHERE role_id = ?", roleId);
    }

    static async getAll() {
        return db.all("SELECT * FROM role_prefix");
    }

    static async restore(prefixes) {
        db.run("DELETE FROM role_prefix");
        for (const p of prefixes) {
            db.run("INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)", p.role_id, p.prefix);
        }
    }
}

module.exports = RolePrefix;
