const { getQueue } = require("../../utils/musicPlayer");
const { MessageFlags } = require("discord.js");

module.exports = {
    customId: "music_skip",
    async execute(interaction) {
        const queue = getQueue(interaction.guild.id);
        if (!queue || !queue.current) {
            return interaction.reply({ content: "現在再生中の曲はありません。", flags: MessageFlags.Ephemeral });
        }

        const skipped = queue.skip();
        if (skipped) {
            await interaction.reply({ content: `⏭️ **${skipped.info.title}** をスキップしました。`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: "スキップに失敗しました。", flags: MessageFlags.Ephemeral });
        }
    },
};
