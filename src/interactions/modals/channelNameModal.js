const { MessageFlags } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");

module.exports = {
    customId: "channelNameModal_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = TemporaryVC.get(channelId);
        const creatorId = row ? row.creator_id : null;

        if (interaction.user.id !== creatorId) {
            return interaction.reply({ content: "作成者のみが名前を変更できます。", flags: MessageFlags.Ephemeral });
        }

        try {
            const channel = await interaction.guild.channels.fetch(channelId);
            if (channel) {
                const newName = interaction.fields.getTextInputValue("channelNameInput");
                await channel.setName(newName);
                await TemporaryVC.saveName(interaction.user.id, newName);
                await interaction.reply({ content: `チャンネル名を **${newName}** に変更しました。`, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: "チャンネルが見つかりませんでした。", flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error("チャンネルの取得または名前の変更に失敗しました:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "チャンネル名の変更中にエラーが発生しました。", flags: MessageFlags.Ephemeral });
            }
        }
    }
};
