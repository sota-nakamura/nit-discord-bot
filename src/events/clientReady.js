const { Events, ActivityType, EmbedBuilder } = require("discord.js");
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
                const lolRoleId = "1469718241600475259"
                const lolVoiceChannelIds = new Set();
                const lolPlayerList = [];
                members.forEach(member => {
                    if (!member.presence || !member.roles.cache.has(lolRoleId)) return;
                    const playingLoL = member.presence.activities.some(activity => activity.applicationId === "401518684763586560");
                    if (playingLoL && member.voice?.channelId) {
                        lolVoiceChannelIds.add(member.voice.channelId);
                    }
                });

                let LoLPlayerCount = 0;
                members.forEach(member => {
                    const isPlayingLoL = member.presence?.activities.some(activity => activity.applicationId === "401518684763586560");
                    const isInLoLVoice = member.voice?.channelId && lolVoiceChannelIds.has(member.voice.channelId);
                    const isOffline = !member.presence;

                    if (isPlayingLoL || (isInLoLVoice && isOffline && member.roles.cache.has(lolRoleId))) {
                        LoLPlayerCount++;
                        lolPlayerList.push(`<@${member.id}>`);
                    }
                });

                const lolPlayerEmbed = new EmbedBuilder()
                    .setTitle(LoLPlayerCount > 5 ? "けっこうLoLやってますね" : "あんまLoLやってないっすね")
                    .setColor(0x0099ff)
                    .setDescription(`現在 ${LoLPlayerCount}人がlolやってます`)
                    .addFields({
                        name: "プレイヤー一覧",
                        value: lolPlayerList.length > 0 ? "\n - " + lolPlayerList.join("\n - ") : "現在プレイ中の人はいません",
                    })
                    .setFooter({
                        text: `${guild.name} | 現在の人数: ${guild.memberCount}人`,
                        iconURL: guild.iconURL(),
                    })
                    .setTimestamp();

                guild.channels.cache.get("1506250458753273969").send({ embeds: [lolPlayerEmbed] });
                guild.channels.cache.get(process.env.LOL_CHANNEL_ID).setName(`lolプレイヤー数: ${LoLPlayerCount}`);
            }
        });
    },
};
