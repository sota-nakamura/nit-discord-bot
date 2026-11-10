const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    inlineCode
} = require("discord.js");

const ttsList = require("../../../config/ttsList.json");

function createVCConfigContainer(channelId, userId, preference) {
    return new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## :tools: 一時的なVCを生成しました \n 一時的なVCはすべてのユーザーが退出すると削除されます。`,
                ),
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                "### 現在のチャンネル設定\n" +
                `**チャンネル名**: ${inlineCode(preference.name || "未設定")}\n` +
                `**最大参加人数**: ${inlineCode(preference.member_limit === 0 ? "制限なし" : preference.member_limit + "人")}\n` +
                `**読み上げ設定**: ${inlineCode(preference.read_message === 1 ? "オン" : "オフ")}\n` +
                `**参加・退出通知設定**: ${inlineCode(preference.notify_log === 1 ? "オン" : "オフ")}\n` +
                `**読み上げボイス**: ${inlineCode(ttsList.find(t => t.value === preference.voice_type).label || "未設定")}`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("ブラウザで設定")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${process.env.DASHBOARD_URL}/settings/vc?channelId=${channelId}`),
                    new ButtonBuilder()
                        .setLabel("Discord上で設定")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId(`channelPref_${channelId}`)
                )
        );
}

module.exports = createVCConfigContainer;