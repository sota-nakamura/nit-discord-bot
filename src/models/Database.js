const Database = require('better-sqlite3');
const path = require('node:path');

const db = new Database('database.db');

// Initialize tables
db.prepare('CREATE TABLE IF NOT EXISTS role_prefix (role_id TEXT, prefix TEXT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS temporary_vcs (channel_id TEXT PRIMARY KEY, creator_id TEXT)').run();

module.exports = db;