const { MessageFlags } = require("discord.js");
const TemporaryVC = require("../../../models/TemporaryVC");
const { updateVCConfig } = require("../../../utils/components/tempvc");

module.exports = {
    customId: "channelPrefModal_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = await TemporaryVC.getVC(channelId);
        const creatorId = row ? row.creator_id : interaction.user.id;

        if (interaction.user.id !== process.env.BOT_OWNER_ID && interaction.user.id !== creatorId) {
            return interaction.reply({ content: "作成者のみが設定を変更できます。", flags: MessageFlags.Ephemeral });
        }

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const channel = interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId);
            const newName = interaction.fields.getTextInputValue("channelNameInput") || `${interaction.user.username}のVC`;
            const newMemberLimitInput = interaction.fields.getTextInputValue("channelMemberLimitInput");
            const notifyLog = interaction.fields.getCheckbox("notifyLogCheckbox") ? 1 : 0;
            const readMessage = interaction.fields.getCheckbox("readMessageCheckbox") ? 1 : 0;
            const voiceType = interaction.fields.getStringSelectValues("voiceTypeSelect");

            let userLimit = channel ? channel.userLimit : 0;
            if (newMemberLimitInput) {
                const parsedLimit = parseInt(newMemberLimitInput, 10);
                if (!isNaN(parsedLimit) && parsedLimit >= 0 && parsedLimit <= 99) {
                    userLimit = parsedLimit;
                }
            }

            await updateVCConfig(interaction.client, channelId, creatorId, {
                name: newName,
                member_limit: userLimit,
                notify_log: notifyLog,
                read_message: readMessage,
                voice_type: voiceType
            });

            await interaction.editReply({ content: "チャンネル設定を変更しました。" });
        } catch (error) {
            console.error("チャンネル設定の変更に失敗しました:", error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "チャンネル設定の変更中にエラーが発生しました。" });
            } else {
                await interaction.reply({ content: "チャンネル設定の変更中にエラーが発生しました。", flags: MessageFlags.Ephemeral });
            }
        }
    }
};
