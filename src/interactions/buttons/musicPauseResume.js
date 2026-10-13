const { MessageFlags } = require("discord.js");
const { getQueue } = require("../../utils/musicPlayer");

module.exports = {
    customId: "music_pause_resume",
    async execute(interaction) {
        const queue = getQueue(interaction.guild.id);
        if (!queue || !queue.current) {
            return interaction.reply({ content: "現在再生中の曲はありません。", flags: MessageFlags.Ephemeral });
        }

        if (queue.paused) {
            queue.resume();
            await interaction.reply({ content: "▶️ 音楽再生を再開しました。", flags: MessageFlags.Ephemeral });
        } else {
            queue.pause();
            await interaction.reply({ content: "⏸️ 音楽再生を一時停止しました。", flags: MessageFlags.Ephemeral });
        }
    },
};
