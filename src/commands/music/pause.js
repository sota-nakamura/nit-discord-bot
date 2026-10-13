const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getQueue } = require("../../utils/musicPlayer");
const { createErrorEmbed, createInfoEmbed } = require("../../utils/embed");
async function executePause(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.current) {
        return interaction.reply({ embeds: [createErrorEmbed("現在再生中の曲はありません。")] });
    }
    if (queue.paused) {
        queue.resume();
        await interaction.reply({ embeds: [createInfoEmbed("▶️ 音楽再生を再開しました。")] });
    } else {
        queue.pause();
        await interaction.reply({ embeds: [createInfoEmbed("⏸️ 音楽再生を一時停止しました。")] });
    }
}

module.exports = executePause;