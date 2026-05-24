const {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
    ComponentType
} = require("discord.js");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName("面白いの面白くないの投票")
        .setType(ApplicationCommandType.User),
    async execute(interaction) {
        const voteEmbed = new EmbedBuilder()
            .setTitle("面白いの面白くないの投票")
            .setDescription(`${interaction.targetUser} は面白い？面白くない？\n⏱️ 60秒後に投票が締め切られます！`)
            .setColor(0x0099ff);
        const voteButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("vote_funny")
                    .setLabel("面白い")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("vote_not_funny")
                    .setLabel("面白くない")
                    .setStyle(ButtonStyle.Danger)
            );
        const memberVoiceChannel = interaction.member.voice.channel;
        const targetUserVoiceChannel = interaction.guild.members.cache.get(interaction.targetUser.id).voice.channel;

        const mentions = memberVoiceChannel.members
            .filter(member => member.id !== interaction.client.user.id)
            .map(member => `<@${member.id}>`)
            .join(' ');

        if (memberVoiceChannel !== targetUserVoiceChannel) {
            await interaction.reply({ content: "同じボイスチャンネルに入ってください", flags: MessageFlags.Ephemeral });
            return;
        }
        const response = await interaction.reply({
            content: mentions || undefined,
            embeds: [voteEmbed],
            components: [voteButtons],
            withResponse: true
        });
        const collector = response.resource.message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        let voteFunnyCount = 0;
        let voteNotFunnyCount = 0;
        const userVotes = new Map();

        collector.on("collect", async (i) => {
            if (i.customId === "vote_funny") {
                if (userVotes.has(i.user.id)) {
                    await i.reply({ content: "既に投票済みです", flags: MessageFlags.Ephemeral });
                    return;
                }
                userVotes.set(i.user.id, "funny");
                voteFunnyCount++;
                await i.reply({ content: "「面白い」に投票しました。", flags: MessageFlags.Ephemeral });

            } else if (i.customId === "vote_not_funny") {
                if (userVotes.has(i.user.id)) {
                    await i.reply({ content: "既に投票済みです", flags: MessageFlags.Ephemeral });
                    return;
                }
                userVotes.set(i.user.id, "not_funny");
                voteNotFunnyCount++;
                await i.reply({ content: "「面白くない」に投票しました。", flags: MessageFlags.Ephemeral });
            }
        });

        collector.on("end", async () => {
            const totalVotes = voteFunnyCount + voteNotFunnyCount;
            const BAR_LENGTH = 15;
            const funnyBlocks = totalVotes === 0 ? 0 : Math.round((voteFunnyCount / totalVotes) * BAR_LENGTH);
            const voteBar = "=".repeat(funnyBlocks) + "-".repeat(BAR_LENGTH - funnyBlocks);
            const resultEmbed = new EmbedBuilder()
                .setTitle("投票結果")
                .setDescription(`${interaction.targetUser} は面白い？面白くない？`)
                .addFields({
                    name: "結果",
                    value: `面白い ${voteBar} 面白くない \n**結果:** <@${interaction.targetUser.id}> は${voteFunnyCount > voteNotFunnyCount ? "面白い" : voteNotFunnyCount > voteFunnyCount ? "面白くないゴミ" : "どっちでもない無個性の凡"}w`,
                })
                .setColor(0x0099ff);

            // ボタンを無効化
            const disabledButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("vote_funny")
                        .setLabel("面白い")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("vote_not_funny")
                        .setLabel("面白くない")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

            await interaction.followUp({
                content: mentions || undefined,
                embeds: [resultEmbed],
                components: [disabledButtons]
            });
        });
    }
};