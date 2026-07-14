const Database = require("better-sqlite3");
const path = require("node:path");

const db = new Database("db/database.db");

// Initialize tables
db.prepare("CREATE TABLE IF NOT EXISTS role_prefix (role_id TEXT, prefix TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS temporary_vcs (channel_id TEXT PRIMARY KEY, creator_id TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS vc_prefs (user_id TEXT PRIMARY KEY, name TEXT, bitrate INTEGER, member_limit INTEGER, notify_log INTEGER DEFAULT 0, read_message INTEGER DEFAULT 0)").run();
db.prepare("CREATE TABLE IF NOT EXISTS netatweet (guild_id TEXT PRIMARY KEY, display_channel_id TEXT, netatweet_channel_id TEXT, reaction_count INTEGER)").run();
try {
    const info = db.prepare("PRAGMA table_info(netatweet_list)").all();
    const userIdPK = info.find(col => col.name === "user_id" && col.pk === 1);
    if (userIdPK) {
        db.prepare("DROP TABLE netatweet_list").run();
    }
} catch (e) {
    // Ignore
}
db.prepare("CREATE TABLE IF NOT EXISTS netatweet_list (message_id TEXT PRIMARY KEY, user_id TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS lol_notification (user_id TEXT PRIMARY KEY)").run();
db.prepare("CREATE TABLE IF NOT EXISTS welcome_msg (guild_id TEXT PRIMARY KEY, message TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS lol_notification_channel (guild_id TEXT PRIMARY KEY, channel_id TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS funny_vote (user_id TEXT PRIMARY KEY, funny_count INTEGER DEFAULT 0, not_funny_count INTEGER DEFAULT 0)").run();
db.prepare("CREATE TABLE IF NOT EXISTS event_config (guild_id TEXT PRIMARY KEY, event_notification_channel TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS lol_accounts (discord_user_id TEXT PRIMARY KEY, riot_id_name TEXT, riot_id_tag TEXT, puuid TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS reminder (reminder_id UUID PRIMARY KEY, user_id TEXT, time INTEGER, message TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS impersonated_messages (message_id TEXT PRIMARY KEY, user_id TEXT)").run();

module.exports = db;