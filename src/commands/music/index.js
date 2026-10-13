const { SlashCommandBuilder } = require("discord.js");
const executePlay = require("./play");
const executeStop = require("./stop");
const executePause = require("./pause");
const executeSkip = require("./skip");
const executeQueue = require("./queue");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("music")
        .setDescription("VCで音楽を再生")
        .addSubcommand(subcommand =>
            subcommand
                .setName("play")
                .setDescription("音楽を再生")
                .addStringOption(option =>
                    option
                        .setName("query")
                        .setDescription("音楽のURL")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("stop")
                .setDescription("音楽を停止")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("pause")
                .setDescription("音楽を一時停止 / 再開")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("skip")
                .setDescription("音楽をスキップ")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("queue")
                .setDescription("キューを表示")
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "play") {
            executePlay(interaction);
        } else if (subcommand === "stop") {
            executeStop(interaction);
        } else if (subcommand === "pause") {
            executePause(interaction);
        } else if (subcommand === "skip") {
            executeSkip(interaction);
        } else if (subcommand === "queue") {
            executeQueue(interaction);
        }
    }
};