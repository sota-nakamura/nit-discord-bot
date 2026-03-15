const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('embed').setDescription('Embed test'),
    async execute(interaction) {
        const { ContainerBuilder, UserSelectMenuBuilder, ButtonStyle, MessageFlags, ButtonBuilder, SectionBuilder, ActionRowBuilder, SeparatorBuilder, TextDisplayBuilder } = require('discord.js');

        const exampleContainer = new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        '## 一時的なVCを生成しました \n - 一時的なVCはすべてのユーザーが退出すると削除されます。\n - 下のドロップダウンから設定や権限を変更できます。',
                    ),
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .setComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId('exampleSelect')
                            .setPlaceholder('Select users'),
                    ),
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent('### 設定をロードする')
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId('VCPrefConfirm')
                            .setEmoji("9175359b37e71ac6")
                            .setLabel('ロード')
                            .setStyle(ButtonStyle.Primary)
                    )
            );
        const response = await interaction.reply({
            components: [exampleContainer],
            flags: MessageFlags.IsComponentsV2,
            withResponse: true
        });

        const collectorFilter = (i) => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter });
        } catch {
            await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        }
    },
};