const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, MessageFlags, CheckboxBuilder } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");

module.exports = {
    customId: "channelPref_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = TemporaryVC.get(channelId);
        const creatorId = row ? row.creator_id : null;

        if (interaction.user.id !== creatorId) {
            return interaction.reply({ content: "作成者のみがチャンネル設定を変更できます。", flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId("channelPrefModal_" + channelId)
            .setTitle("チャンネルの設定を変更");

        const channelNameInput = new TextInputBuilder()
            .setCustomId("channelNameInput")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("例: 作業、雑談、LoLなど")
            .setValue(row.name || `${interaction.user.username}のVC`)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100);

        const channelNameLabel = new LabelBuilder()
            .setLabel("チャンネル名を入力")
            .setDescription("このVCのチャンネル名を設定できます(空にするとデフォルト)")
            .setTextInputComponent(channelNameInput);

        const channelBitrateInput = new TextInputBuilder()
            .setCustomId("channelBitrateInput")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("8000 ~ ")
            .setRequired(true)

        const channelBitrateLabel = new LabelBuilder()
            .setLabel("チャンネルの音質を設定")
            .setDescription("64 ~ 96で数字のみを入力してください。(単位はkbps)")
            .setTextInputComponent(channelBitrateInput);

        const channelMemberLimitInput = new TextInputBuilder()
            .setCustomId("channelMemberLimitInput")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("1 ~ 99")
            .setRequired(true)

        const channelMemberLimitLabel = new LabelBuilder()
            .setLabel("チャンネルの最大人数を設定")
            .setDescription("1 ~ 99で数字のみを入力してください。0で無制限)")
            .setTextInputComponent(channelMemberLimitInput);

        const savePreferenceCheckbox = new CheckboxBuilder()
            .setCustomId("savePreferenceCheckbox")
            .setDefault(true);
        const savePreferenceLabel = new LabelBuilder()
            .setLabel("設定を保存")
            .setDescription("このVCの設定を保存します")
            .setCheckboxComponent(savePreferenceCheckbox);
        modal.addLabelComponents(channelNameLabel, channelBitrateLabel, channelMemberLimitLabel, savePreferenceLabel);

        await interaction.showModal(modal);
    }
};
