const { getQueue } = require("../../utils/musicPlayer");
const { createErrorEmbed, createInfoEmbed } = require("../../utils/embed");

async function executeSkip(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.current) {
        return interaction.reply({ embeds: [createErrorEmbed("現在再生中の曲はありません")] });
    }

    const skipped = queue.skip();
    if (skipped) {
        await interaction.reply({ embeds: [createInfoEmbed(`**${skipped.info.title}** をスキップしました`)] });
    } else {
        await interaction.reply({ embeds: [createErrorEmbed("スキップに失敗しました")] });
    }
}

module.exports = executeSkip;
