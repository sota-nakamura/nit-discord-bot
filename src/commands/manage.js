const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ModalBuilder,
    ContainerBuilder,
    StringSelectMenuBuilder,
} = require("discord.js");
const LoLAccount = require("../models/LoLAccount");
const { getPuuid } = require("../utils/riotApi");

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
            await interaction.deferReply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            })
            const name = interaction.options.getString("name");
            const tag = interaction.options.getString("tag");
            const user = interaction.options.getUser("user");
            const puuid = await getPuuid(name, tag);
            if (!puuid) {
                return interaction.editReply({
                    content: "Riot ID が見つかりませんでした。"
                });
            }
            await LoLAccount.register(user.id, name, tag, puuid);
            const embed = new EmbedBuilder()
                .setTitle("Riot ID 連携完了")
                .setDescription(`**${user.username}** に Riot ID を連携しました。`)
                .addFields(
                    { name: "Riot ID", value: `${name}#${tag}`, inline: true },
                    { name: "PUUID", value: `\`${puuid.substring(0, 8)}...\``, inline: true }
                )
                .setColor(0x00ff00)
                .setTimestamp();
            console.log(`[INFO] ${user.username}が登録完了しました。Riot ID: ${name}#${tag} PUUID: ${puuid.substring(0, 8)}...`)
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === "removelolacc") {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });
            const user = interaction.options.getUser("user");
            const account = await LoLAccount.get(user.id);
            if (!account) {
                return interaction.editReply({
                    content: "そのユーザーにはlolアカウントが登録されていません。"
                });
            }
            if (account.length == 1) {
                await LoLAccount.unregister(user.id);
                await interaction.editReply({
                    content: `**${user.username}** のlolアカウントを削除しました。`
                });
            } else {
                const accountSelect = new ContainerBuilder()
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`remove-lol-acc-${user.id}`)
                                .setPlaceholder("削除するアカウントを選択してください")
                                .addOptions(
                                    ...account.map(acc => ({
                                        label: `${acc.riot_id_name}#${acc.riot_id_tag}`,
                                        value: acc.id
                                    }))
                                )
                        )
                    )
            }
            console.log(`[INFO] ${user.username}がRiot IDの登録を解除しました。`)
        }
    }
}