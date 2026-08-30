const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { executeLol } = require("./lol");
const { executeAddLolAcc } = require("./addlolacc");
const { executeRemoveLolAcc } = require("./removelolacc");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("manage")
        .setDescription("管理コマンド")
        .addSubcommand(subcommand =>
            subcommand
                .setName("lol")
                .setDescription("lolアカウントの確認")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("対象のユーザー(入力しないと全員表示)")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("addlolacc")
                .setDescription("lolアカウントの追加")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Riot アカウントの名前部分")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("tag")
                        .setDescription("Riot アカウントのタグ部分")
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("対象のDiscordユーザー")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("removelolacc")
                .setDescription("lolアカウントの削除")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("対象のDiscordユーザー")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (interaction.user.id !== process.env.BOT_OWNER_ID) {
            return interaction.reply({
                content: "u cant use this command lil bro",
                flags: [MessageFlags.Ephemeral]
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "lol") {
            await executeLol(interaction);
        } else if (subcommand === "addlolacc") {
            await executeAddLolAcc(interaction);
        } else if (subcommand === "removelolacc") {
            await executeRemoveLolAcc(interaction);
        }
    }
};
