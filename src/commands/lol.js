const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require("discord.js");
const LoLAccount = require("../models/LoLAccount");
const { getPuuid, getActiveGame, getChampionData } = require("../utils/riotApi");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lol")
        .setDescription("League of Legends 関連のコマンド")
        .addSubcommand(subcommand =>
            subcommand
                .setName("register")
                .setDescription("Riot IDを連携します。")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Riot ID の名前部分")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("tag")
                        .setDescription("Riot ID のタグ部分")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unregister")
                .setDescription("Riot IDの連携を解除します。")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("現在の試合状況を取得します。")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("状況を確認したいユーザー（省略した場合は自分）")
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "register") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const name = interaction.options.getString("name");
            const tag = interaction.options.getString("tag").replace("#", "");

            try {
                // Call Riot API to fetch puuid
                const puuid = await getPuuid(name, tag);
                if (!puuid) {
                    return await interaction.editReply({
                        content: `Riot ID **${name}#${tag}** が見つかりませんでした。入力内容を確認してください。`
                    });
                }

                await LoLAccount.register(interaction.user.id, name, tag, puuid);

                const embed = new EmbedBuilder()
                    .setTitle("Riot ID 連携完了")
                    .setDescription(`**${interaction.user.username}** に Riot ID を連携しました。`)
                    .addFields(
                        { name: "Riot ID", value: `${name}#${tag}`, inline: true },
                        { name: "PUUID", value: `\`${puuid.substring(0, 8)}...\``, inline: true }
                    )
                    .setColor(0x00ff00)
                    .setTimestamp();
                console.log(`[INFO] ${interaction.user.username}が登録完了しました。Riot ID: ${name}#${tag} PUUID: ${puuid.substring(0, 8)}...`)
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Error registering Riot ID:", error);
                await interaction.editReply({
                    content: "Riot ID の登録中にエラーが発生しました。入力情報が正しいか、または Riot API Key の設定を確認してください。"
                });
            }
        }

        else if (subcommand === "unregister") {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });
            const user = interaction.user;
            const account = await LoLAccount.get(user.id);
            if (!account) {
                return interaction.editReply({
                    content: "そのユーザーにはlolアカウントが登録されていません。"
                });
            }
            if (account.length == 1) {
                await LoLAccount.unregister(account[0].puuid);
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
                await interaction.editReply({
                    content: `LoLアカウントを選択するメニューをDMに送信しました。ご確認ください。`
                });
                await interaction.user.send({
                    content: `**${user.username}** のlolアカウントを選択してください。`,
                    components: [accountSelect]
                });
                // use collector
                const collector = interaction.user.createMessageComponentCollector({
                    time: 60000
                });
                collector.on("collect", async i => {
                    const puuid = account.find(acc => acc.id === i.values[0]).puuid;
                    await LoLAccount.unregister(puuid);
                    await i.update({
                        content: `**${user.username}** のlolアカウントを削除しました。`,
                        components: []
                    });
                });
                collector.on("end", async collected => {
                    if (collected.size === 0) {
                        await interaction.user.send({
                            content: `**${user.username}** のlolアカウントの登録解除はキャンセルされました。`
                        });
                    }
                });
            }
            console.log(`[INFO] ${user.username}がRiot IDの登録を解除しました。`);
        }

        else if (subcommand === "status") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const targetUser = interaction.options.getUser("user") || interaction.user;

            const account = await LoLAccount.get(targetUser.id);
            if (!account) {
                return await interaction.editReply({
                    content: `${targetUser.username} は Riot ID を連携していません。先に \`/lol register\` で登録してください。`
                });
            }

            try {
                const game = await getActiveGame(account.puuid);
                if (!game) {
                    return await interaction.editReply({
                        content: `${targetUser.username} (${account.riot_id_name}#${account.riot_id_tag}) は現在ゲーム中ではありません。`
                    });
                }

                const champData = await getChampionData(game.championId);

                const embed = new EmbedBuilder()
                    .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
                    .setTitle(`${targetUser.displayName}は現在試合中です。`)
                    .setDescription(`**${account.riot_id_name}#${account.riot_id_tag}** は現在試合中です！`)
                    .setColor(0x0099ff)
                    .addFields(
                        { name: "ゲームモード", value: game.gameMode || "不明", inline: true },
                        { name: "使用チャンピオン", value: champData.name, inline: true }
                    )
                    .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${game.version}/img/champion/${champData.image.full}`)
                    .setTimestamp();

                if (game.startTime > 0) {
                    const startUnix = Math.floor(game.startTime / 1000);
                    embed.addFields({ name: "開始時間", value: `<t:${startUnix}:R>`, inline: true });
                }

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Error fetching status:", error);
                await interaction.editReply({
                    content: "試合情報の取得中にエラーが発生しました。"
                });
            }
        }
    }
};
