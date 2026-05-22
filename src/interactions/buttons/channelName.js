const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, MessageFlags } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");

module.exports = {
    customId: "channelName_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = TemporaryVC.get(channelId);
        const creatorId = row ? row.creator_id : null;

        if (interaction.user.id !== creatorId) {
            return interaction.reply({ content: "作成者のみがチャンネル設定を変更できます。", flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId("channelNameModal_" + channelId)
            .setTitle("チャンネル名を設定してください");

        const channelNameInput = new TextInputBuilder()
            .setCustomId("channelNameInput")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("例: 作業、雑談、LoLなど")
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100);

        const channelNameLabel = new LabelBuilder()
            .setLabel("チャンネル名を入力")
            .setDescription("このVCのチャンネル名を設定できます")
            .setTextInputComponent(channelNameInput);

        modal.addLabelComponents(channelNameLabel);

        await interaction.showModal(modal);
    }
};
