const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

function createVCConfigContainer(channelId, userId, preference) {
    return new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## :tools: 一時的なVCを生成しました \n <@${userId}> さん、ようこそ! \n - 一時的なVCはすべてのユーザーが退出すると削除されます。\n - 作成者のみが下のボタンからチャンネル名を変更できます。`,
                ),
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `### 現在のチャンネル設定\n` +
                `**チャンネル名**: ${preference.name}\n` +
                `**最大参加人数**: ${preference.member_limit === 0 ? "制限なし" : preference.member_limit + "人"}\n` +
                `**読み上げ設定**: ${preference.read_message === 1 ? "オン" : "オフ"}\n` +
                `**参加・退出通知設定**: ${preference.notify_log === 1 ? "オン" : "オフ"}\n` +
                `**読み上げボイス**: ${preference.voice_type}`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent("### チャンネル設定の変更")
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setLabel("設定")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${process.env.DASHBOARD_URL}/settings/vc?channelId=${channelId}`)
                )
        );
}

module.exports = createVCConfigContainer;