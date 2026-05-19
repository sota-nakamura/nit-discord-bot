const { Events, ActivityType } = require("discord.js");
const { start15MinScheduler } = require("../utils/scheduler");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.user.setPresence({
            status: "online",
            activities: [{ name: "実は世界進出を狙っている", type: ActivityType.Custom }]
        });

        start15MinScheduler({
            name: "LoLプレイヤーカウント",
            process: async () => {
                const guild = client.guilds.cache.first();
                const members = await guild.members.fetch()
                let LoLPlayerCount = 0;
                members.forEach(member => {
                    if (!member.presence) return;
                    const activities = member.presence.activities;
                    if (activities.find(activity => activity.applicationId === "401518684763586560")) {
                        LoLPlayerCount++;
                    }
                });
                guild.channels.cache.get("1506250458753273969").send(`現在 ${LoLPlayerCount}人がLeague of Legendsをプレイしています。\n ${LoLPlayerCount <= 5 ? "少ないね" : "結構いるじゃん"}`);
                guild.channels.cache.get(process.env.LOL_CHANNEL_ID).setName(`lolプレイヤー数: ${LoLPlayerCount}`);
            }
        });
    },
};
