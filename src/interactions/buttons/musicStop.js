const { getQueue } = require("../../utils/musicPlayer");
const { MessageFlags } = require("discord.js");

module.exports = {
    customId: "music_stop",
    async execute(interaction) {
        const queue = getQueue(interaction.guild.id);
        if (!queue || (!queue.current && queue.songs.length === 0)) {
            return interaction.reply({ content: "現在再生中または待機中の曲はありません。", flags: MessageFlags.Ephemeral });
        }

        queue.stop();
        await interaction.reply({ content: "⏹️ 音楽再生を停止し、キューをクリアしました。", flags: MessageFlags.Ephemeral });
    },
};
