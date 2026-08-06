const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { execSync } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
    async execute(interaction) {
        function githash() {
            return execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
        }
        function commitMessage() {
            return execSync('git log -1 --format="%B"').toString().trim();
        }
        const githashValue = githash();
        const commitMessageValue = commitMessage();
        const embed = new EmbedBuilder()
            .setTitle(`Pong!`)
            .setColor(0x0099ff)
            .setDescription(`Bot ${interaction.client.user.username} is now live!`)
            .addFields({
                name: "Git Commit",
                value: `[${githashValue}] ${commitMessageValue}
                [see on gitlab](https://gitlab.com/satoimo_satosi/nit-discord-bot/commit/${githashValue})`
            })
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    },
};
