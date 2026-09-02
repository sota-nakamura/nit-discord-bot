const { MessageFlags } = require("discord.js");
const TemporaryVC = require("../../../models/TemporaryVC");

module.exports = {
    customId: "channelPrefModal_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = await TemporaryVC.get(channelId);
        const creatorId = row ? row.creator_id : null;

        if (interaction.user.id !== (creatorId && process.env.BOT_OWNER_ID)) {
            return interaction.reply({ content: "作成者のみが設定を変更できます。", flags: MessageFlags.Ephemeral });
        }

        try {
            const channel = await interaction.guild.channels.fetch(channelId);
            const newName = interaction.fields.getTextInputValue("channelNameInput") || `${interaction.user.username}のVC`;
            const newMemberLimitInput = interaction.fields.getTextInputValue("channelMemberLimitInput");
            const notifyLog = interaction.fields.getCheckbox("notifyLogCheckbox") ? 1 : 0;
            const readMessage = interaction.fields.getCheckbox("readMessageCheckbox") ? 1 : 0;
            const voiceType = interaction.fields.getStringSelectValues("voiceTypeSelect");

            let userLimit = channel.userLimit;
            if (newMemberLimitInput) {
                const parsedLimit = parseInt(newMemberLimitInput, 10);
                if (!isNaN(parsedLimit) && parsedLimit >= 0 && parsedLimit <= 99) {
                    userLimit = parsedLimit;
                }
            }

            await channel.edit({
                name: newName,
                userLimit: userLimit
            });

            const selectedVoiceType = voiceType || "f1";

            await TemporaryVC.save(interaction.user.id, newName, userLimit, notifyLog, readMessage, selectedVoiceType);
            await interaction.reply({ content: `チャンネル設定を変更しました。`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error("チャンネル設定の変更に失敗しました:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "チャンネル設定の変更中にエラーが発生しました。", flags: MessageFlags.Ephemeral });
            }
        }
    }
};
