const Database = require("better-sqlite3");
const path = require("node:path");

const db = new Database("database.db");

// Initialize tables
db.prepare("DROP TABLE IF EXISTS vc_prefs").run();
db.prepare("CREATE TABLE IF NOT EXISTS role_prefix (role_id TEXT, prefix TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS temporary_vcs (channel_id TEXT PRIMARY KEY, creator_id TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS vc_prefs (user_id TEXT PRIMARY KEY, name TEXT, bitrate INTEGER, limit INTEGER)").run();
db.prepare("CREATE TABLE IF NOT EXISTS lol_notification (user_id TEXT PRIMARY KEY)").run();
db.prepare("CREATE TABLE IF NOT EXISTS welcome_msg (guild_id TEXT PRIMARY KEY, message TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS lol_notification_channel (guild_id TEXT PRIMARY KEY, channel_id TEXT)").run();
db.prepare("CREATE TABLE IF NOT EXISTS funny_vote (user_id TEXT PRIMARY KEY, funny_count INTEGER DEFAULT 0, not_funny_count INTEGER DEFAULT 0)").run();

module.exports = db;