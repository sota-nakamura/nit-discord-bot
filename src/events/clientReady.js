const {
    Events,
    ActivityType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { start15MinScheduler } = require("../utils/scheduler");
const LoLNotification = require("../models/LoLNotification");
const TemporaryVC = require("../models/TemporaryVC");
const { joinVoiceChannel, createAudioPlayer, VoiceConnectionStatus, entersState } = require("@discordjs/voice");
const { getAvailableBot } = require("../utils/botpool");
const { cleanupPlayer, audioPlayers } = require("../utils/tts");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        client.user.setPresence({
            status: "online",
            activities: [{ name: "情報統合思念体様〜♥", type: ActivityType.Custom }]
        });
        // reconnect vc if temp vc remains
        const botPool = client.botPool;
        const tempVCs = await TemporaryVC.getAll();
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        for (const vc of tempVCs) {
            // Find the channel across all guilds (DB has no guild_id column)
            const channel = guild.channels.cache.get(vc.channel_id);
            if (!channel) {
                // Channel no longer exists — clean up stale DB entry
                await TemporaryVC.delete(vc.channel_id);
                continue;
            }

            const humanMembers = channel.members.filter(m => !m.user.bot).size;
            if (humanMembers === 0) {
                // No human members left — delete the VC and DB record
                try {
                    await channel.delete();
                } catch (e) {
                    console.error("[ERROR] 起動時のVC削除に失敗:", e);
                }
                await TemporaryVC.delete(vc.channel_id);
                continue;
            }

            // Reconnect a bot from the pool
            const bot = getAvailableBot(channel.guild.id, botPool);
            if (!bot) {
                console.log(`[WARN] 再接続に利用可能なBotがありません: ${channel.name}`);
                continue;
            }

            const botGuild = bot.client.guilds.cache.get(channel.guild.id);
            if (!botGuild) {
                console.error(`[ERROR] Bot ${bot.index} がギルド ${channel.guild.id} に参加していません`);
                continue;
            }

            const connection = joinVoiceChannel({
                channelId: vc.channel_id,
                guildId: channel.guild.id,
                adapterCreator: botGuild.voiceAdapterCreator,
                selfDeaf: true,
                group: bot.client.user.id,
            });
            const player = createAudioPlayer();
            connection.subscribe(player);
            audioPlayers.set(vc.channel_id, player);
            player.on("error", (error) => console.error("[ERROR] TTS playback:", error));

            // auto-reconnect on disconnect (mirrors voiceStateUpdate.js)
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                } catch (e) {
                    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        try {
                            connection.rejoin();
                        } catch (err) {
                            console.error(`[ERROR] Bot ${bot.index} VC再接続に失敗:`, err);
                            connection.destroy();
                            cleanupPlayer(vc.channel_id);
                        }
                    }
                }
            });

            console.log(`[INFO] Bot ${bot.index} が ${channel.name} に再接続しました`);
        }

        start15MinScheduler({
            name: "LoLプレイヤーカウント",
            onlyProduction: true,
            process: async () => {
                const guildId = process.env.GUILD_ID;
                const guild = client.guilds.cache.get(guildId);
                if (!guild) return;

                const enabled = await LoLNotification.isEnabled(guildId);
                if (!enabled) return;
                const members = await guild.members.fetch();
                const lolRoleId = "1469718241600475259";
                const lolVoiceChannelIds = new Set();
                const lolPlayerList = [];
                members.forEach(member => {
                    if (!member.presence || !member.roles.cache.has(lolRoleId)) return;
                    const playingLoL = member.presence.activities.some(activity => activity.applicationId === ("401518684763586560" || "1402418696126992445"));
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
                const lolNotificationEmbed = new EmbedBuilder()
                    .setTitle("LoLをプレイしましょう！")
                    .setColor(0x0099ff)
                    .setDescription("LoLプレイしましょうね～～～～～～～～～")
                    .setTimestamp();

                const lolNotificationButton = new ButtonBuilder()
                    .setCustomId("lolNotification")
                    .setLabel("通知登録")
                    .setStyle(ButtonStyle.Primary);
                const lolUnsubscribeButton = new ButtonBuilder()
                    .setCustomId("lolUnsubscribe")
                    .setLabel("通知解除")
                    .setStyle(ButtonStyle.Danger);
                const subscriberList = await LoLNotification.getAll();
                for (const subscriber of subscriberList) {
                    const member = await guild.members.fetch(subscriber.user_id).catch(() => null);
                    if (member) {
                        const isPlayingLoL = member.presence?.activities.some(activity => activity.applicationId === "401518684763586560");
                        if (!isPlayingLoL) {
                            await member.send({ embeds: [lolNotificationEmbed], components: [new ActionRowBuilder().addComponents(lolUnsubscribeButton)] });
                        }
                    }
                }

                guild.channels.cache.get("1506250458753273969").send({ embeds: [lolPlayerEmbed], components: [new ActionRowBuilder().addComponents(lolNotificationButton)] });
                guild.channels.cache.get(process.env.LOL_CHANNEL_ID).setName(`lolプレイヤー数: ${LoLPlayerCount}`);
            }
        });
    },
};
