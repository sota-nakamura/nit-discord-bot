const { SlashCommandBuilder, ChannelType, MessageFlags } = require("discord.js");
const Netatweet = require("../models/Netatweet");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("netatweet")
        .setDescription("ネタツイ評価機能")
        .addSubcommand(subcommand =>
            subcommand
                .setName("setup")
                .setDescription("機能をセットアップします")
                .addChannelOption(option =>
                    option
                        .setName("display_channel")
                        .setDescription("評価の集まったネタツイを表示するチャンネル")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName("netatweet_channel")
                        .setDescription("ネタツイが投稿されるチャンネル")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("reaction_count")
                        .setDescription("評価に必要なリアクション数")
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("disable")
                .setDescription("機能を無効化します")
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "setup") {
            const displayChannel = interaction.options.getChannel("display_channel");
            const netatweetChannel = interaction.options.getChannel("netatweet_channel");
            const reactionCount = interaction.options.getInteger("reaction_count");
            if (Netatweet.isEnabled(interaction.guild.id)) {
                await interaction.reply({
                    content: "すでにセットアップされています。",
                    flags: [MessageFlags.Ephemeral]
                });
                return;
            }
            await Netatweet.enable(interaction.guild.id, displayChannel.id, netatweetChannel.id, reactionCount);
            await interaction.reply({
                content: "ネタツイ評価機能のセットアップが完了しました",
                flags: [MessageFlags.Ephemeral]
            });
        } else if (subcommand === "disable") {
            await Netatweet.disable(interaction.guild.id);
            await interaction.reply({
                content: "ネタツイ評価機能を無効化しました",
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
}