const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    CheckboxBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const welcomeMsg = require("../../models/welcomeMsg");
const LoLNotification = require("../../models/LoLNotification");

class ServerConfig {
    static createServerConfigContainer() {
        return new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## :tools: サーバーの設定
                    - 各機能の有効化/無効化
                    - 各機能の詳細設定
                    などが行なえます。
                    `,
                    ),
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("serverConfig")
                            .setPlaceholder("設定したい機能を選択")
                            .addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("ウェルカムメッセージ機能の設定")
                                    .setValue("welcomeMsg"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("LoL通知機能の設定")
                                    .setValue("lolNotification")
                            )
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("cancel")
                            .setLabel("キャンセル")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId("submit")
                            .setLabel("確定")
                            .setStyle(ButtonStyle.Primary)
                    )
            );
    }
    static async createWelcomeMsgConfigModal(guildId) {
        const toggleFeatureCheckbox = new CheckboxBuilder()
            .setCustomId("welcomeMsg_toggle")
            .setDefault(await welcomeMsg.exists(guildId));
        const toggleFeatureLabel = new LabelBuilder()
            .setLabel("ウェルカムメッセージ機能の有効化")
            .setCheckboxComponent(toggleFeatureCheckbox);

        const textInput = new TextInputBuilder()
            .setCustomId("welcomeMsg_text")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMinLength(0)
            .setMaxLength(1000)
            .setValue((await welcomeMsg.getMsg(guildId)) || "{user} さん、ようこそ {server} へ！");

        const textInputLabel = new LabelBuilder()
            .setLabel("ウェルカムメッセージの内容")
            .setDescription("メンバーが参加したときに送信されるメッセージを設定します。\n 使える置換文字列: {user}: ユーザー名\n {server}: サーバー名")
            .setTextInputComponent(textInput);

        const welcomeMsgModal = new ModalBuilder()
            .setCustomId("welcomeMsgConfigModal")
            .setTitle("ウェルカムメッセージの設定");

        welcomeMsgModal.addLabelComponents(toggleFeatureLabel, textInputLabel);
        return welcomeMsgModal;
    }
    static async createLoLConfigModal(guildId) {
        const toggleFeatureCheckbox = new CheckboxBuilder()
            .setCustomId("lolNotification_toggle")
            .setDefault(await LoLNotification.isEnabled(guildId));
        const toggleFeatureLabel = new LabelBuilder()
            .setLabel("LoL通知機能の有効化")
            .setCheckboxComponent(toggleFeatureCheckbox);

        const lolNotificationModal = new ModalBuilder()
            .setCustomId("lolConfigModal")
            .setTitle("LoL通知の設定");

        lolNotificationModal.addLabelComponents(toggleFeatureLabel);
        return lolNotificationModal;
    }
}

module.exports = ServerConfig;