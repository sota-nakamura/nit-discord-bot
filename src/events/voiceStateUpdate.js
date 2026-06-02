const { Events, ChannelType, PermissionFlagsBits, MessageFlags } = require("discord.js");
const TemporaryVC = require("../models/TemporaryVC");
const { createVCConfigContainer } = require("../utils/components");

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Create temporary VC
        if (newState.channelId === process.env.TEMPVC_CHANNEL_ID && oldState.channelId !== newState.channelId && newState.channel.members.size === 1) {
            try {
                const savedName = await TemporaryVC.getSavedChannelName(newState.member.user.id);
                const newChannelName = savedName?.name || `${newState.member.user.displayName}のVC`;
                const newChannel = await newState.guild.channels.create({
                    name: newChannelName,
                    type: ChannelType.GuildVoice,
                    parent: newState.channel.parent,
                    permissionOverwrites: [
                        {
                            id: newState.member.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                        },
                    ],
                });

                // Record to database
                TemporaryVC.create(newChannel.id, newState.member.user.id);

                // move user to temporary VC
                await newState.member.voice.setChannel(newChannel.id);

                // create VC control panel
                const channelConfigContainer = createVCConfigContainer(newChannel.id, newState.member.user.id);

                await newChannel.send({
                    components: [channelConfigContainer],
                    flags: MessageFlags.IsComponentsV2,
                });
            } catch (error) {
                console.error("VC作成またはメッセージ送信に失敗しました:", error);
            }
        }

        // Delete temporary VC if empty
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            let oldChannel = oldState.channel;
            if (!oldChannel) {
                try {
                    oldChannel = await oldState.guild.channels.fetch(oldState.channelId);
                } catch (e) {
                    // Channel might already be deleted
                }
            }

            if (oldChannel && oldChannel.members.size === 0) {
                if (oldState.channelId === "1499398070230712410") return;

                try {
                    if (TemporaryVC.exists(oldState.channelId)) {
                        await oldChannel.delete();
                        TemporaryVC.delete(oldState.channelId);
                    }
                } catch (error) {
                    console.error("VCの削除に失敗しました:", error);
                }
            }
        }
    },
};
