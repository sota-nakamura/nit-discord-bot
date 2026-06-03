const { MessageFlags } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");

module.exports = {
    customId: "channelPrefModal_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = TemporaryVC.get(channelId);
        const creatorId = row ? row.creator_id : null;

        if (interaction.user.id !== creatorId) {
            return interaction.reply({ content: "作成者のみが設定を変更できます。", flags: MessageFlags.Ephemeral });
        }

        try {
            const channel = await interaction.guild.channels.fetch(channelId);
            const newName = interaction.fields.getTextInputValue("channelNameInput") || `${interaction.user.username}のVC`;
            const newBitrateInput = interaction.fields.getTextInputValue("channelBitrateInput");
            const newMemberLimitInput = interaction.fields.getTextInputValue("channelMemberLimitInput");
            const notifyLog = interaction.fields.getCheckbox("notifyLogCheckbox") ? 1 : 0;
            const savePreference = interaction.fields.getCheckbox("savePreferenceCheckbox");

            let bitrateBps = channel.bitrate;
            if (newBitrateInput) {
                const parsedBitrate = parseInt(newBitrateInput, 10);
                if (!isNaN(parsedBitrate)) {
                    if (parsedBitrate >= 8 && parsedBitrate <= 384) {
                        bitrateBps = parsedBitrate * 1000;
                    } else if (parsedBitrate >= 8000 && parsedBitrate <= 384000) {
                        bitrateBps = parsedBitrate;
                    }
                }
            }

            let userLimit = channel.userLimit;
            if (newMemberLimitInput) {
                const parsedLimit = parseInt(newMemberLimitInput, 10);
                if (!isNaN(parsedLimit) && parsedLimit >= 0 && parsedLimit <= 99) {
                    userLimit = parsedLimit;
                }
            }

            await channel.edit({
                name: newName,
                bitrate: bitrateBps,
                userLimit: userLimit
            });

            if (savePreference) {
                await TemporaryVC.save(interaction.user.id, newName, bitrateBps, userLimit, notifyLog);
            }
            await interaction.reply({ content: `チャンネル設定を変更しました。`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error("チャンネル設定の変更に失敗しました:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "チャンネル設定の変更中にエラーが発生しました。", flags: MessageFlags.Ephemeral });
            }
        }
    }
};
