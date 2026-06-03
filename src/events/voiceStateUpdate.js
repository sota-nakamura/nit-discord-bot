const { Events, ChannelType, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, VoiceConnectionStatus, entersState } = require("@discordjs/voice");
const TemporaryVC = require("../models/TemporaryVC");
const { createVCConfigContainer } = require("../utils/components");
const { playTTS, cleanupPlayer, audioPlayers } = require("../utils/tts");
const { getAvailableBot, getBotForChannel } = require("../utils/botpool");

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const botPool = newState.client.botPool || oldState.client.botPool;

        // Create temporary VC
        if (newState.channelId === process.env.TEMPVC_CHANNEL_ID && oldState.channelId !== newState.channelId && newState.channel.members.size === 1) {
            try {
                const saved = TemporaryVC.getPrefs(newState.member.user.id);
                const newChannelName = saved?.name || `${newState.member.user.displayName}のVC`;
                const newChannelBitrate = saved?.bitrate || 64000;
                const newChannelMemberLimit = saved?.member_limit || 0;

                const newChannel = await newState.guild.channels.create({
                    name: newChannelName,
                    type: ChannelType.GuildVoice,
                    parent: newState.channel.parent,
                    bitrate: newChannelBitrate,
                    userLimit: newChannelMemberLimit,
                    permissionOverwrites: [
                        {
                            id: newState.member.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                        },
                    ],
                });

                // record to database
                TemporaryVC.create(newChannel.id, newState.member.user.id);

                // move user to temporary VC
                await newState.member.voice.setChannel(newChannel.id);

                // create VC control panel
                const channelConfigContainer = createVCConfigContainer(newChannel.id, newState.member.user.id);

                await newChannel.send({
                    components: [channelConfigContainer],
                    flags: MessageFlags.IsComponentsV2,
                });

                // bot joins the VC and stays permanently
                const bot = getAvailableBot(newState.guild.id, botPool);
                if (bot) {
                    const botGuild = bot.client.guilds.cache.get(newState.guild.id);
                    if (botGuild) {
                        const connection = joinVoiceChannel({
                            channelId: newChannel.id,
                            guildId: newState.guild.id,
                            adapterCreator: botGuild.voiceAdapterCreator,
                            selfDeaf: true,
                            group: bot.client.user.id
                        });
                        const player = createAudioPlayer();
                        connection.subscribe(player);
                        audioPlayers.set(newChannel.id, player);
                        player.on("error", (error) => console.error("[ERROR] TTS playback:", error));

                        // auto-reconnect on disconnect
                        connection.on(VoiceConnectionStatus.Disconnected, async () => {
                            try {
                                await Promise.race([
                                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                                ]);
                            } catch (e) {
                                // could not auto-reconnect, rejoin manually
                                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                                    try {
                                        connection.rejoin();
                                    } catch (err) {
                                        console.error(`[ERROR] Bot ${bot.index} VC再接続に失敗:`, err);
                                        connection.destroy();
                                        cleanupPlayer(newChannel.id);
                                    }
                                }
                            }
                        });
                    } else {
                        console.error(`[ERROR] Bot ${bot.index} is not in the guild ${newState.guild.id}`);
                    }
                } else {
                    console.log("No available bot found in the pool for voice notifications.");
                }
            } catch (error) {
                console.error("[ERROR] VC作成またはメッセージ送信に失敗しました:", error);
            }
        }

        // notify member join
        if (newState.channelId && oldState.channelId !== newState.channelId && !newState.member.user.bot) {
            if (newState.channelId !== process.env.TEMPVC_CHANNEL_ID) {
                const joinedVC = TemporaryVC.get(newState.channelId);
                if (joinedVC) {
                    const prefs = TemporaryVC.getPrefs(joinedVC.creator_id);
                    if (prefs?.notify_log === 1) {
                        const bot = getBotForChannel(newState.guild.id, newState.channelId, botPool);
                        if (bot) {
                            const connection = getVoiceConnection(newState.guild.id, bot.client.user.id);
                            if (connection) {
                                await playTTS(connection, newState.channelId, `${newState.member.nickname || newState.member.user.displayName}さんが参加しました`);
                            }
                        }
                    }
                }
            }
        }

        // handle member exit & VC deletion (skip if bot)
        if (oldState.channelId && oldState.channelId !== newState.channelId && !oldState.member.user.bot) {
            let oldChannel = oldState.channel;
            const createdVC = TemporaryVC.get(oldState.channelId);

            if (!oldChannel) {
                try {
                    oldChannel = await oldState.guild.channels.fetch(oldState.channelId);
                } catch (e) {
                    // Channel might already be deleted
                }
            }

            if (oldChannel) {
                const humanMembers = oldChannel.members.filter(m => !m.user.bot).size;

                if (humanMembers === 0) {
                    if (oldState.channelId === process.env.TEMPVC_CHANNEL_ID) return;

                    try {
                        if (TemporaryVC.exists(oldState.channelId)) {
                            const bot = getBotForChannel(oldState.guild.id, oldState.channelId, botPool);
                            if (bot) {
                                const connection = getVoiceConnection(oldState.guild.id, bot.client.user.id);
                                if (connection) {
                                    connection.destroy();
                                }
                            }
                            cleanupPlayer(oldState.channelId);

                            await oldChannel.delete();
                            TemporaryVC.delete(oldState.channelId);
                        }
                    } catch (error) {
                        console.error("[ERROR] VCの削除に失敗しました:", error);
                    }
                } else if (createdVC && !oldState.member.user.bot) {
                    // Notify member exit (channel still has human members)
                    const prefs = TemporaryVC.getPrefs(createdVC.creator_id);
                    if (prefs?.notify_log === 1) {
                        const bot = getBotForChannel(oldState.guild.id, oldState.channelId, botPool);
                        if (bot) {
                            const connection = getVoiceConnection(oldState.guild.id, bot.client.user.id);
                            if (connection) {
                                await playTTS(connection, oldState.channelId, `${oldState.member.nickname || oldState.member.user.displayName}さんが退出しました`);
                            }
                        }
                    }
                }
            }
        }
    },
};
