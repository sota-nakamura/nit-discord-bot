require("dotenv").config();
const { Pool } = require("pg");

// PostgreSQL / Supabase 接続設定
const connectionString = process.env.DATABASE_URL;

const poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
    console.error("[ERROR] Unexpected error on idle PostgreSQL client:", err);
});

// テーブル初期化
async function initTables() {
    if (!process.env.DATABASE_URL && !process.env.PGHOST) {
        console.warn("[WARN] DATABASE_URL or PGHOST is not defined in .env. Skipping table initialization.");
        return;
    }

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS role_prefix (
                role_id TEXT,
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
                discord_user_id TEXT,
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
        `);
        console.log("[INFO] PostgreSQL tables initialized successfully.");
    } catch (err) {
        console.error("[ERROR] Failed to initialize PostgreSQL tables:", err.message);
    }
}

// 接続設定があれば自動初期化
if (process.env.DATABASE_URL || process.env.PGHOST) {
    initTables();
}

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
    pool,
    initTables,

    /**
     * クエリを実行 (INSERT / UPDATE / DELETE など)
     * @param {string} sql 
     * @param  {...any} params 
     */
    async run(sql, ...params) {
        try {
            const pgSql = convertPlaceholders(sql);
            const res = await pool.query(pgSql, params);
            return {
                changes: res.rowCount,
                rowCount: res.rowCount,
                rows: res.rows
            };
        } catch (err) {
            console.error(`[ERROR] Run failed: "${sql}" | Params:`, params, err);
            throw err;
        }
    },

    /**
     * 1行のみ取得
     * @param {string} sql 
     * @param  {...any} params 
     */
    async get(sql, ...params) {
        try {
            const pgSql = convertPlaceholders(sql);
            const res = await pool.query(pgSql, params);
            return res.rows[0] || null;
        } catch (err) {
            console.error(`[ERROR] Get failed: "${sql}" | Params:`, params, err);
            throw err;
        }
    },

    /**
     * 複数行を取得
     * @param {string} sql 
     * @param  {...any} params 
     */
    async all(sql, ...params) {
        try {
            const pgSql = convertPlaceholders(sql);
            const res = await pool.query(pgSql, params);
            return res.rows;
        } catch (err) {
            console.error(`[ERROR] All failed: "${sql}" | Params:`, params, err);
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