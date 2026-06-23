const db = require("./Database");

class EventConfig {
    static save(guildId, channelId) {
        const stmt = db.prepare("INSERT OR REPLACE INTO event_config (guild_id, event_notification_channel) VALUES (?, ?)");
        stmt.run(guildId, channelId);
    }
    static get(guildId) {
        const stmt = db.prepare("SELECT * FROM event_config WHERE guild_id = ?");
        return stmt.get(guildId);
    }
}

module.exports = EventConfig;