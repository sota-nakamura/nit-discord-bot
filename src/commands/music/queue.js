const { EmbedBuilder } = require("discord.js");
const { getQueue } = require("../../utils/musicPlayer");

async function executeQueue(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || (!queue.current && queue.songs.length === 0)) {
        return interaction.reply({ content: "現在再生キューは空です。", flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`再生キュー (${queue.songs.length + (queue.current ? 1 : 0)} 曲)`)
        .setTimestamp();

    if (queue.current) {
        embed.addFields({
            name: "現在再生中",
            value: `**[${queue.current.info.title}](${queue.current.info.url})** (${queue.current.info.durationString})`,
        });
    }

    if (queue.songs.length > 0) {
        const list = queue.songs.slice(0, 10).map((song, i) => {
            return `${i + 1}. **[${song.info.title}](${song.info.url})** (${song.info.durationString}) - <@${song.requestedBy.id}>`;
        }).join("\n");

        const remaining = queue.songs.length > 10 ? `\n...他 ${queue.songs.length - 10} 曲` : "";
        embed.addFields({ name: "待機リスト", value: list + remaining });
    }

    const queueSelect = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("music_queue_select")
                .setPlaceholder("情報を表示する曲を選択")
                .addOptions(
                    ...queue.songs.map((song, i) => {
                        return {
                            label: song.info.title,
                            value: i.toString(),
                            emoji: "🎵",
                        };
                    })
                )
        );

    const response = await interaction.reply({
        embeds: [embed],
        components: [queueSelect],
        withResponse: true
    });

    const collector = response.resource.message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 600000
    });

    collector.on("collect", async (i) => {
        if (i.customId === "music_queue_select") {
            const index = parseInt(i.values[0]);
            const song = queue.songs[index];
            if (song) {
                const songEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`#${index + 1} - ${song.info.title}`)
                    .setURL(song.info.url)
                    .addFields(
                        { name: "再生時間", value: song.info.durationString, inline: true },
                        { name: "リクエスト", value: `<@${song.requestedBy.id}>`, inline: true }
                    );
                await i.reply({ embeds: [songEmbed], ephemeral: true });
            }
        }
    });
}

module.exports = executeQueue;
