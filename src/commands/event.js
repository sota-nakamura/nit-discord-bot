const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder,
    ChannelSelectMenuBuilder,
    ChannelType
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("event")
        .setDescription("イベント関連のコマンド"),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId("eventCreateModal")
            .setTitle("イベント作成");

        const nameInput = new TextInputBuilder()
            .setCustomId("name")
            .setPlaceholder("イベント名を入力")
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(50)
            .setRequired(true);
        const nameInputLabel = new LabelBuilder()
            .setLabel("イベント名")
            .setDescription("イベント名を入力してください。")
            .setTextInputComponent(nameInput);

        const descriptionInput = new TextInputBuilder()
            .setCustomId("description")
            .setPlaceholder("イベント説明を入力")
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(1)
            .setMaxLength(1000)
            .setRequired(true);
        const descriptionInputLabel = new LabelBuilder()
            .setLabel("イベント詳細")
            .setDescription("イベント詳細を入力してください。例: プレイするゲーム、内容など")
            .setTextInputComponent(descriptionInput);

        const voiceChannelSelect = new ChannelSelectMenuBuilder()
            .addChannelTypes(ChannelType.GuildVoice)
            .setCustomId("voiceChannel")
            .setPlaceholder("ボイスチャンネルを選択")
            .setMinValues(1)
            .setMaxValues(1)
            .setRequired(true);
        const voiceChannelSelectLabel = new LabelBuilder()
            .setLabel("ボイスチャンネル")
            .setDescription("イベントを開催するボイスチャンネルを選択してください。")
            .setChannelSelectMenuComponent(voiceChannelSelect);

        const timeInput = new TextInputBuilder()
            .setCustomId("time")
            .setPlaceholder("2026-01-01 00:00 の形式で入力")
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(50)
            .setRequired(true);
        const timeInputLabel = new LabelBuilder()
            .setLabel("イベント開始時間")
            .setDescription("イベントを開始する時間を入力してください。")
            .setTextInputComponent(timeInput);

        modal.addLabelComponents(nameInputLabel, descriptionInputLabel, voiceChannelSelectLabel, timeInputLabel);

        interaction.showModal(modal);
    }
}