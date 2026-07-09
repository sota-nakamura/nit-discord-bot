const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const LoLAccount = require("../models/LoLAccount");

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
        if (interaction.user.username !== "satoimo_satosi") {
            return interaction.reply({
                content: "u cant use this command lil bro",
                flags: [MessageFlags.Ephemeral]
            })
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "lol") {
            const target = interaction.options.getUser("user");
            let embed;
            if (!target) {
                // get all accounts
                const accounts = await LoLAccount.getAll();
                embed = new EmbedBuilder()
                    .setTitle("Riot ID一覧")
                    .setDescription("現在登録されているRiot IDの一覧です。")
                    .setColor(0x0099ff)
                    .addFields(
                        accounts.map(account => ({
                            name: `user: ${interaction.client.users.cache.get(account.discord_user_id).displayName}`,
                            value: `${account.riot_id_name}#${account.riot_id_tag}`
                        }))
                    );
            } else {
                // get specific account
                const account = await LoLAccount.get(target.id);
                embed = new EmbedBuilder()
                    .setTitle("Riot ID")
                    .setDescription("現在登録されているRiot IDの一覧です。")
                    .setColor(0x0099ff)
                    .addFields(
                        {
                            name: `user: ${interaction.client.users.cache.get(account.discord_user_id).displayName}`,
                            value: `${account.riot_id_name}#${account.riot_id_tag}`
                        }
                    );
            }
            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } else if (subcommand === "addlolacc") {
            const name = interaction.options.getString("name");
            const tag = interaction.options.getString("tag");
            const user = interaction.options.getUser("user");
            const account = await LoLAccount.get(user.id);
            if (account) {
                return interaction.reply({
                    content: "そのユーザーはすでにlolアカウントが登録されています。",
                    flags: MessageFlags.Ephemeral
                });
            }
            await LoLAccount.register(user.id, name, tag);
            await interaction.reply({
                content: `**${user.username}** のlolアカウントに **${name}#${tag}** を追加しました`,
                flags: MessageFlags.Ephemeral
            });
        } else if (subcommand === "removelolacc") {
            const user = interaction.options.getUser("user");
            const account = await LoLAccount.get(user.id);
            if (!account) {
                return interaction.reply({
                    content: "そのユーザーにはlolアカウントが登録されていません。",
                    flags: MessageFlags.Ephemeral
                });
            }
            await LoLAccount.unregister(user.id);
            await interaction.reply({
                content: `**${user.username}** のlolアカウントを削除しました。`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}