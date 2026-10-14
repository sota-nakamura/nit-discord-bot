const { EmbedBuilder } = require("discord.js");

function createErrorEmbed(description, error = null) {
    const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("エラーが発生しました")
        .setDescription(description);
    if (error) embed.addFields({ name: "エラー", value: error });
    return embed;
}

function createInfoEmbed(description) {
    return new EmbedBuilder()
        .setColor("Blue")
        .setDescription(description);
}

module.exports = { createErrorEmbed, createInfoEmbed };