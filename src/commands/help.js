const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides information about the bot.'),
    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setTitle('Help')
            .setDescription('This command was run by ' + interaction.user.username);
        await interaction.reply({ embeds: [helpEmbed] });
    },
};
