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
        }
    }
}