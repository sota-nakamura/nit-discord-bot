const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("曲のURLまたは検索クエリ")
                .setRequired(true)
        )
    ,
    async execute(interaction) {
        const query = interaction.options.getString("query");
        await interaction.reply(`Playing ${query}`);
    }
};