const { EmbedBuilder } = require("discord.js");
const { getQueue } = require("../../utils/musicPlayer");

async function executeQueue(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || (!queue.current && queue.songs.length === 0)) {
        return interaction.reply({ content: "現在再生キューは空です。", ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`🎶 再生キュー (${queue.songs.length + (queue.current ? 1 : 0)} 曲)`)
        .setFooter({ text: "NIT Discord Bot • Music Player" })
        .setTimestamp();

    if (queue.current) {
        embed.addFields({
            name: "▶️ 再生中",
            value: `**[${queue.current.info.title}](${queue.current.info.url})** (${queue.current.info.durationString})\nリクエスト: <@${queue.current.requestedBy.id}>`,
        });
    }

    if (queue.songs.length > 0) {
        const list = queue.songs.slice(0, 10).map((song, i) => {
            return `${i + 1}. **[${song.info.title}](${song.info.url})** (${song.info.durationString}) - <@${song.requestedBy.id}>`;
        }).join("\n");

        const remaining = queue.songs.length > 10 ? `\n...他 ${queue.songs.length - 10} 曲` : "";
        embed.addFields({ name: "📋 待機リスト", value: list + remaining });
    }

    await interaction.reply({ embeds: [embed] });
}

module.exports = executeQueue;
