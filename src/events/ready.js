const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.user.setPresence({
            status: "online",
            activities: [{ name: "実は世界進出を狙っている", type: ActivityType.Custom }]
        });
    },
};
