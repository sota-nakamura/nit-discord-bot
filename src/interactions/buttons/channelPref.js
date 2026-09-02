const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, MessageFlags, CheckboxBuilder, StringSelectMenuBuilder } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");

module.exports = {
    customId: "channelPref_",
    async execute(interaction) {
        const channelId = interaction.customId.split("_")[1];
        const row = await TemporaryVC.get(channelId);
        const creatorId = row ? row.creator_id : null;

        if (interaction.user.id !== creatorId && interaction.user.id !== process.env.BOT_OWNER_ID) {
            return interaction.reply({ content: "作成者のみがチャンネル設定を変更できます。", flags: MessageFlags.Ephemeral });
        }

        const prefs = creatorId ? await TemporaryVC.getPrefs(creatorId) : null;
        const currentName = prefs?.name || interaction.channel.name;
        const currentBitrate = prefs?.bitrate ? (prefs.bitrate / 1000) : interaction.channel.bitrate / 1000;
        const currentLimit = prefs?.member_limit !== undefined ? prefs.member_limit : (interaction.channel.userLimit || 0);

        const modal = new ModalBuilder()
            .setCustomId("channelPrefModal_" + channelId)
            .setTitle("チャンネルの設定を変更");

        const channelNameInput = new TextInputBuilder()
            .setCustomId("channelNameInput")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("例: 作業、雑談、LoLなど")
            .setValue(currentName)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100);

        const channelNameLabel = new LabelBuilder()
            .setLabel("チャンネル名を入力")
            .setDescription("このVCのチャンネル名を設定できます(空にするとデフォルト)")
            .setTextInputComponent(channelNameInput);

        const channelMemberLimitInput = new TextInputBuilder()
            .setCustomId("channelMemberLimitInput")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("1 ~ 99")
            .setValue(currentLimit.toString())
            .setRequired(true);

        const channelMemberLimitLabel = new LabelBuilder()
            .setLabel("チャンネルの最大人数を設定")
            .setDescription("1 ~ 99で数字のみを入力してください。(0で無制限)")
            .setTextInputComponent(channelMemberLimitInput);

        const notifyLogCheckbox = new CheckboxBuilder()
            .setCustomId("notifyLogCheckbox")
            .setDefault(prefs?.notify_log === 1);
        const notifyLogLabel = new LabelBuilder()
            .setLabel("参加/退出通知の有効化")
            .setDescription("このVCの参加/退出通知を有効にします")
            .setCheckboxComponent(notifyLogCheckbox);

        const readMessageCheckbox = new CheckboxBuilder()
            .setCustomId("readMessageCheckbox")
            .setDefault(prefs?.read_message === 1);
        const readMessageLabel = new LabelBuilder()
            .setLabel("メッセージ読み上げの有効化")
            .setDescription("このVCのメッセージ読み上げを有効にします")
            .setCheckboxComponent(readMessageCheckbox);
        const voiceTypeSelect = new StringSelectMenuBuilder()
            .setCustomId("voiceTypeSelect")
            .setPlaceholder("読み上げボイスを選択")
            .setRequired(true)
            .addOptions(
                {
                    label: "女性1",
                    value: "f1",
                    default: prefs?.voice_type === "f1"
                },
                {
                    label: "女性2",
                    value: "f2",
                    default: prefs?.voice_type === "f2"
                },
                {
                    label: "男性1",
                    value: "m1",
                    default: prefs?.voice_type === "m1"
                },
                {
                    label: "男性2",
                    value: "m2",
                    default: prefs?.voice_type === "m2"
                },
                {
                    label: "中性",
                    value: "imd1",
                    default: prefs?.voice_type === "imd1"
                },
                {
                    label: "機械1",
                    value: "jgr",
                    default: prefs?.voice_type === "jgr"
                },
                {
                    label: "機械2",
                    value: "dvd",
                    default: prefs?.voice_type === "dvd"
                },
                {
                    label: "ロボット",
                    value: "r1",
                    default: prefs?.voice_type === "r1"
                }
            );
        const voiceTypeLabel = new LabelBuilder()
            .setLabel("読み上げボイスの選択")
            .setDescription("このVCの読み上げボイスを選択します")
            .setStringSelectMenuComponent(voiceTypeSelect);


        modal.addLabelComponents(channelNameLabel, channelMemberLimitLabel, notifyLogLabel, readMessageLabel, voiceTypeLabel);

        await interaction.showModal(modal);
    }
};
