const db = require("./Database");

class RolePrefix {
    static cache = new Map();
    static isLoaded = false;

    static async initCache() {
        try {
            const rows = await db.all("SELECT * FROM role_prefix");
            this.cache.clear();
            for (const r of rows) {
                this.cache.set(r.role_id, r.prefix);
            }
            this.isLoaded = true;
        } catch (err) {
            console.error("[ERROR] RolePrefix: Failed to initialize cache:", err);
        }
    }

    static async get(roleId) {
        if (this.cache.has(roleId)) {
            return { role_id: roleId, prefix: this.cache.get(roleId) };
        }
        if (!this.isLoaded) {
            const row = await db.get("SELECT * FROM role_prefix WHERE role_id = ?", roleId);
            if (row) this.cache.set(row.role_id, row.prefix);
            return row;
        }
        return null;
    }

    static async set(roleId, prefix) {
        this.cache.set(roleId, prefix);
        return db.run(`
            INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)
            ON CONFLICT (role_id) DO UPDATE SET prefix = EXCLUDED.prefix
        `, roleId, prefix);
    }

    static async remove(roleId) {
        this.cache.delete(roleId);
        return db.run("DELETE FROM role_prefix WHERE role_id = ?", roleId);
    }

    static async getAll() {
        if (this.isLoaded) {
            return Array.from(this.cache.entries()).map(([role_id, prefix]) => ({ role_id, prefix }));
        }
        const rows = await db.all("SELECT * FROM role_prefix");
        this.cache.clear();
        for (const r of rows) {
            this.cache.set(r.role_id, r.prefix);
        }
        this.isLoaded = true;
        return rows;
    }

    static async restore(prefixes) {
        this.cache.clear();
        await db.run("DELETE FROM role_prefix");
        for (const p of prefixes) {
            this.cache.set(p.role_id, p.prefix);
            await db.run("INSERT INTO role_prefix (role_id, prefix) VALUES (?, ?)", p.role_id, p.prefix);
        }
    }
}

module.exports = RolePrefix;
