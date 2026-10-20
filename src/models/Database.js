require("dotenv").config();
const path = require("path");
const fs = require("fs");

const isSqlite = process.env.DB_TYPE === "sqlite" || (!process.env.DB_TYPE && !process.env.DATABASE_URL && !process.env.PGHOST);

let pool = null;
let sqliteDb = null;

if (isSqlite) {
    const Database = require("better-sqlite3");
    const dbDir = path.join(__dirname, "../../db");
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, "database.db");
    sqliteDb = new Database(dbPath);
    // パフォーマンスと並行性向上のため WAL モードを有効化
    sqliteDb.pragma("journal_mode = WAL");
    console.log(`[INFO] Database: SQLite enabled (Path: ${dbPath})`);
} else {
    const { Pool } = require("pg");
    const connectionString = process.env.DATABASE_URL;
    const poolConfig = {
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    };
    pool = new Pool(poolConfig);
    pool.on("error", (err) => {
        console.error("[ERROR] Unexpected error on idle PostgreSQL client:", err);
    });
    console.log("[INFO] Database: PostgreSQL (Supabase) enabled");
}

// SQLite テーブル初期化
function initSqliteTables() {
    try {
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS role_prefix (
                role_id TEXT PRIMARY KEY,
                prefix TEXT
            );
            CREATE TABLE IF NOT EXISTS temporary_vcs (
                channel_id TEXT PRIMARY KEY,
                creator_id TEXT
            );
            CREATE TABLE IF NOT EXISTS vc_prefs (
                user_id TEXT PRIMARY KEY,
                name TEXT,
                member_limit INTEGER,
                notify_log INTEGER DEFAULT 0,
                read_message INTEGER DEFAULT 0,
                voice_type TEXT DEFAULT 'f1'
            );
            CREATE TABLE IF NOT EXISTS netatweet (
                guild_id TEXT PRIMARY KEY,
                display_channel_id TEXT,
                netatweet_channel_id TEXT,
                reaction_count INTEGER
            );
            CREATE TABLE IF NOT EXISTS netatweet_list (
                message_id TEXT PRIMARY KEY,
                user_id TEXT
            );
            CREATE TABLE IF NOT EXISTS lol_notification (
                user_id TEXT PRIMARY KEY
            );
            CREATE TABLE IF NOT EXISTS welcome_msg (
                guild_id TEXT PRIMARY KEY,
                message TEXT
            );
            CREATE TABLE IF NOT EXISTS lol_notification_channel (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT
            );
            CREATE TABLE IF NOT EXISTS funny_vote (
                user_id TEXT PRIMARY KEY,
                funny_count INTEGER DEFAULT 0,
                not_funny_count INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS lol_accounts (
                discord_user_id TEXT PRIMARY KEY,
                riot_id_name TEXT,
                riot_id_tag TEXT,
                puuid TEXT
            );
            CREATE TABLE IF NOT EXISTS reminder (
                reminder_id TEXT PRIMARY KEY,
                user_id TEXT,
                time INTEGER,
                message TEXT
            );
            CREATE TABLE IF NOT EXISTS impersonated_messages (
                message_id TEXT PRIMARY KEY,
                user_id TEXT
            );
            CREATE TABLE IF NOT EXISTS reisho_dic (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                type TEXT NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_role_prefix_role_id ON role_prefix(role_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_lol_accounts_discord_user_id ON lol_accounts(discord_user_id);
            CREATE INDEX IF NOT EXISTS idx_lol_accounts_puuid ON lol_accounts(puuid);
            CREATE INDEX IF NOT EXISTS idx_reisho_dic_type_content ON reisho_dic(type, content);
            CREATE INDEX IF NOT EXISTS idx_reminder_time ON reminder(time);
            CREATE INDEX IF NOT EXISTS idx_reminder_user_id ON reminder(user_id);
            CREATE INDEX IF NOT EXISTS idx_netatweet_list_user_id ON netatweet_list(user_id);
        `);
        console.log("[INFO] SQLite tables initialized successfully.");
    } catch (err) {
        console.error("[ERROR] Failed to initialize SQLite tables:", err);
    }
}

// PostgreSQL テーブル初期化
async function initPostgresTables() {
    if (!process.env.DATABASE_URL && !process.env.PGHOST) {
        console.warn("[WARN] DATABASE_URL or PGHOST is not defined in .env. Skipping table initialization.");
        return;
    }

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS role_prefix (
                role_id TEXT PRIMARY KEY,
                prefix TEXT
            );
            CREATE TABLE IF NOT EXISTS temporary_vcs (
                channel_id TEXT PRIMARY KEY,
                creator_id TEXT
            );
            CREATE TABLE IF NOT EXISTS vc_prefs (
                user_id TEXT PRIMARY KEY,
                name TEXT,
                member_limit INTEGER,
                notify_log INTEGER DEFAULT 0,
                read_message INTEGER DEFAULT 0,
                voice_type TEXT DEFAULT 'f1'
            );
            CREATE TABLE IF NOT EXISTS netatweet (
                guild_id TEXT PRIMARY KEY,
                display_channel_id TEXT,
                netatweet_channel_id TEXT,
                reaction_count INTEGER
            );
            CREATE TABLE IF NOT EXISTS netatweet_list (
                message_id TEXT PRIMARY KEY,
                user_id TEXT
            );
            CREATE TABLE IF NOT EXISTS lol_notification (
                user_id TEXT PRIMARY KEY
            );
            CREATE TABLE IF NOT EXISTS welcome_msg (
                guild_id TEXT PRIMARY KEY,
                message TEXT
            );
            CREATE TABLE IF NOT EXISTS lol_notification_channel (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT
            );
            CREATE TABLE IF NOT EXISTS funny_vote (
                user_id TEXT PRIMARY KEY,
                funny_count INTEGER DEFAULT 0,
                not_funny_count INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS lol_accounts (
                discord_user_id TEXT PRIMARY KEY,
                riot_id_name TEXT,
                riot_id_tag TEXT,
                puuid TEXT
            );
            CREATE TABLE IF NOT EXISTS reminder (
                reminder_id TEXT PRIMARY KEY,
                user_id TEXT,
                time BIGINT,
                message TEXT
            );
            CREATE TABLE IF NOT EXISTS impersonated_messages (
                message_id TEXT PRIMARY KEY,
                user_id TEXT
            );
            CREATE TABLE IF NOT EXISTS reisho_dic (
                id BIGSERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                type TEXT NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_role_prefix_role_id ON role_prefix(role_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_lol_accounts_discord_user_id ON lol_accounts(discord_user_id);
            CREATE INDEX IF NOT EXISTS idx_lol_accounts_puuid ON lol_accounts(puuid);
            CREATE INDEX IF NOT EXISTS idx_reisho_dic_type_content ON reisho_dic(type, content);
            CREATE INDEX IF NOT EXISTS idx_reminder_time ON reminder(time);
            CREATE INDEX IF NOT EXISTS idx_reminder_user_id ON reminder(user_id);
            CREATE INDEX IF NOT EXISTS idx_netatweet_list_user_id ON netatweet_list(user_id);
        `);
        console.log("[INFO] PostgreSQL tables initialized successfully.");
    } catch (err) {
        console.error("[ERROR] Failed to initialize PostgreSQL tables:", err);
    }
}

async function initTables() {
    if (isSqlite) {
        initSqliteTables();
    } else {
        await initPostgresTables();
    }
}

// 接続設定があれば自動初期化
initTables();

/**
 * SQLite の '?' プレースホルダーを PostgreSQL の '$1, $2, ...' に変換
 * @param {string} sql 
 * @returns {string}
 */
function convertPlaceholders(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
}

const db = {
    isSqlite,
    pool,
    sqliteDb,
    initTables,

    /**
     * クエリを実行 (INSERT / UPDATE / DELETE など)
     * @param {string} sql 
     * @param  {...any} params 
     */
    async run(sql, ...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        if (isSqlite) {
            try {
                const info = sqliteDb.prepare(sql).run(...flatParams);
                return {
                    changes: info.changes,
                    rowCount: info.changes,
                    lastInsertRowid: info.lastInsertRowid
                };
            } catch (err) {
                console.error(`[ERROR] SQLite Run failed: "${sql}" | Params:`, flatParams, err);
                throw err;
            }
        }

        try {
            const pgSql = convertPlaceholders(sql);
            const res = await pool.query(pgSql, flatParams);
            return {
                changes: res.rowCount,
                rowCount: res.rowCount,
                rows: res.rows
            };
        } catch (err) {
            console.error(`[ERROR] PostgreSQL Run failed: "${sql}" | Params:`, flatParams, err);
            throw err;
        }
    },

    /**
     * 1行のみ取得
     * @param {string} sql 
     * @param  {...any} params 
     */
    async get(sql, ...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        if (isSqlite) {
            try {
                const row = sqliteDb.prepare(sql).get(...flatParams);
                return row || null;
            } catch (err) {
                console.error(`[ERROR] SQLite Get failed: "${sql}" | Params:`, flatParams, err);
                throw err;
            }
        }

        try {
            const pgSql = convertPlaceholders(sql);
            const res = await pool.query(pgSql, flatParams);
            return res.rows[0] || null;
        } catch (err) {
            console.error(`[ERROR] PostgreSQL Get failed: "${sql}" | Params:`, flatParams, err);
            throw err;
        }
    },

    /**
     * 複数行を取得
     * @param {string} sql 
     * @param  {...any} params 
     */
    async all(sql, ...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        if (isSqlite) {
            try {
                return sqliteDb.prepare(sql).all(...flatParams);
            } catch (err) {
                console.error(`[ERROR] SQLite All failed: "${sql}" | Params:`, flatParams, err);
                throw err;
            }
        }

        try {
            const pgSql = convertPlaceholders(sql);
            const res = await pool.query(pgSql, flatParams);
            return res.rows;
        } catch (err) {
            console.error(`[ERROR] PostgreSQL All failed: "${sql}" | Params:`, flatParams, err);
            throw err;
        }
    },

    /**
     * better-sqlite3 互換用ヘルパー
     * @param {string} sql 
     */
    prepare(sql) {
        return {
            run: (...params) => db.run(sql, ...params),
            get: (...params) => db.get(sql, ...params),
            all: (...params) => db.all(sql, ...params)
        };
    }
};

module.exports = db;