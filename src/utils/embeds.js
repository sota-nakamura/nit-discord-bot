const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createVCConfigContainer(channelId) {
    return new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    '## :tools: 一時的なVCを生成しました \n - 一時的なVCはすべてのユーザーが退出すると削除されます。\n - 作成者のみが下のボタンからチャンネル名を変更できます。',
                ),
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('### チャンネル名の変更')
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setCustomId(`channelName_${channelId}`)
                        .setLabel('設定')
                        .setStyle(ButtonStyle.Primary)
                )
        );
}

module.exports = {
    createVCConfigContainer
};
