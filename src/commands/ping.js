const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { execSync } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
    async execute(interaction) {
        function githash() {
            return execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
        }
        const githashValue = githash();
        const embed = new EmbedBuilder()
            .setTitle(`Pong!`)
            .setColor(0x0099ff)
            .setDescription(`Bot ${interaction.client.user.username} is now live!`)
            .addFields({ name: "Git Commit", value: githashValue })
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    },
};
