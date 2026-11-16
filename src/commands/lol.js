const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");
const LoLAccount = require("../models/LoLAccount");
const { getPuuid, getActiveGame, getChampionData, getLatestMatchStats, getDeepLoLAIScore, getQueueName } = require("../utils/riotApi");
const { createLoLActiveGameEmbed, createLoLMatchResultEmbed } = require("../utils/embed");

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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("lastgame")
                .setDescription("最新の試合結果を取得します。")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("試合結果を確認したいユーザー（省略した場合は自分）")
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "register") {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });
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

                const registered = await LoLAccount.register(interaction.user.id, name, tag, puuid);
                if (!registered) {
                    return await interaction.editReply({
                        content: `Riot ID **${name}#${tag}** は既に別のDiscordアカウントに連携されています。`
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle("Riot ID 連携完了")
                    .setDescription(`**${interaction.user.username}** に Riot ID を連携しました。`)
                    .addFields(
                        { name: "Riot ID", value: `${name}#${tag}`, inline: true },
                        { name: "PUUID", value: `\`${puuid.substring(0, 8)}...\``, inline: true }
                    )
                    .setColor(0x00ff00)
                    .setTimestamp();
                console.log(`[INFO] ${interaction.user.username}が登録完了しました。Riot ID: ${name}#${tag} PUUID: ${puuid.substring(0, 8)}...`);
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
            const accountList = await LoLAccount.get(user.id);
            if (!accountList || accountList.length === 0) {
                return await interaction.editReply({
                    content: "そのユーザーにはlolアカウントが登録されていません。"
                });
            }

            let account = accountList[0];
            if (accountList.length > 1) {
                const accountSelect = new StringSelectMenuBuilder()
                    .setCustomId(`remove-lol-acc-${user.id}`)
                    .setPlaceholder("削除するアカウントを選択してください")
                    .addOptions(
                        accountList.map(acc => ({
                            label: `${acc.riot_id_name}#${acc.riot_id_tag}`,
                            value: acc.puuid
                        }))
                    );
                const accountSelectRow = new ActionRowBuilder()
                    .addComponents(accountSelect);
                const response = await interaction.editReply({
                    content: "Riot IDが複数登録されています。削除するアカウントを選択してください。",
                    components: [accountSelectRow]
                });

                try {
                    const selectInteraction = await response.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id,
                        time: 60_000
                    });
                    await selectInteraction.deferUpdate();
                    account = accountList.find(acc => acc.puuid === selectInteraction.values[0]);
                } catch {
                    return await interaction.editReply({
                        content: `**${user.username}** のlolアカウントの登録解除はキャンセルされました。`,
                        components: []
                    });
                }
            }

            await LoLAccount.unregister(account.puuid);
            await interaction.editReply({
                content: `**${user.username}** のlolアカウント（**${account.riot_id_name}#${account.riot_id_tag}**）を削除しました。`,
                components: []
            });
            console.log(`[INFO] ${user.username}がRiot IDの登録を解除しました。`);
        }

        else if (subcommand === "status") {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });
            const targetUser = interaction.options.getUser("user") || interaction.user;

            const accountList = await LoLAccount.get(targetUser.id);
            if (!accountList || accountList.length === 0) {
                return await interaction.editReply({
                    content: `${targetUser.username} は Riot ID を連携していません。先に \`/lol register\` で登録してください。`
                });
            }

            let account = accountList[0];
            if (accountList.length > 1) {
                const RiotIDSelect = new StringSelectMenuBuilder()
                    .setCustomId("lol_account_select")
                    .setPlaceholder("Riot IDを選択してください")
                    .addOptions(
                        accountList.map(acc => ({
                            label: `${acc.riot_id_name}#${acc.riot_id_tag}`,
                            value: acc.puuid
                        }))
                    );
                const RiotIDSelectRow = new ActionRowBuilder()
                    .addComponents(RiotIDSelect);
                const response = await interaction.editReply({
                    content: "Riot IDが複数登録されています。状況を確認するアカウントを選択してください。",
                    components: [RiotIDSelectRow]
                });

                try {
                    const selectInteraction = await response.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id,
                        time: 60_000
                    });
                    await selectInteraction.deferUpdate();
                    account = accountList.find(acc => acc.puuid === selectInteraction.values[0]);
                } catch(e) {
                    if(e) {
                        console.error(e);
                    }
                    return await interaction.editReply({
                        content: "タイムアウトしたため、処理をキャンセルしました。",
                        components: []
                    });
                }
            }

            try {
                const game = await getActiveGame(account.puuid);
                if (!game) {
                    return await interaction.editReply({
                        content: `${targetUser.username} (${account.riot_id_name}#${account.riot_id_tag}) は現在ゲーム中ではありません。`,
                        components: []
                    });
                }

                const champData = await getChampionData(game.championId);
                const gameMode = getQueueName(game.gameQueueConfigId, game.gameMode);

                const embed = createLoLActiveGameEmbed({
                    account,
                    user: targetUser,
                    title: `${targetUser.displayName}は現在試合中です。`,
                    description: `**${account.riot_id_name}#${account.riot_id_tag}** は現在試合中です！`,
                    champData,
                    gameMode,
                    startTime: game.startTime,
                    version: game.version
                });

                await interaction.editReply({ content: null, embeds: [embed], components: [] });
            } catch (error) {
                console.error("Error fetching status:", error);
                await interaction.editReply({
                    content: "試合情報の取得中にエラーが発生しました。",
                    components: []
                });
            }
        }

        else if (subcommand === "lastgame") {
            await interaction.deferReply();
            const target = interaction.options.getUser("user") || interaction.user;

            const accountList = await LoLAccount.get(target.id);
            if (!accountList || accountList.length === 0) {
                return await interaction.editReply(`**${target.username}**のRiotアカウントは登録されていません。`);
            }

            let account = Array.isArray(accountList) ? accountList[0] : accountList;
            if (Array.isArray(accountList) && accountList.length > 1) {
                const RiotIDSelect = new StringSelectMenuBuilder()
                    .setCustomId("lol_lastgame_account_select")
                    .setPlaceholder("Riot IDを選択してください")
                    .addOptions(
                        accountList.map(acc => ({
                            label: `${acc.riot_id_name}#${acc.riot_id_tag}`,
                            value: acc.puuid
                        }))
                    );
                const RiotIDSelectRow = new ActionRowBuilder().addComponents(RiotIDSelect);
                const response = await interaction.editReply({
                    content: "Riot IDが複数登録されています。結果を確認するアカウントを選択してください。",
                    components: [RiotIDSelectRow]
                });

                try {
                    const selectInteraction = await response.awaitMessageComponent({
                        filter: i => i.user.id === interaction.user.id,
                        time: 60_000
                    });
                    await selectInteraction.deferUpdate();
                    account = accountList.find(acc => acc.puuid === selectInteraction.values[0]);
                } catch {
                    return await interaction.editReply({
                        content: "タイムアウトしたため、処理をキャンセルしました。",
                        components: []
                    });
                }
            }

            try {
                const activeGame = await getActiveGame(account.puuid);
                if (activeGame) {
                    const champData = await getChampionData(activeGame.championId);
                    const gameMode = getQueueName(activeGame.gameQueueConfigId, activeGame.gameMode);
                    const embed = createLoLActiveGameEmbed({
                        account,
                        user: target,
                        title: `**${account.riot_id_name}#${account.riot_id_tag}**は現在試合中です!`,
                        description: `**${account.riot_id_name}#${account.riot_id_tag}** は現在試合中です！`,
                        champData,
                        gameMode,
                        startTime: activeGame.startTime,
                        version: activeGame.version
                    });
                    return await interaction.editReply({ content: null, embeds: [embed], components: [] });
                }

                const game = await getLatestMatchStats(account.puuid);
                if (!game) {
                    return await interaction.editReply({
                        content: `**${account.riot_id_name}#${account.riot_id_tag}** の最近の試合履歴が見つかりませんでした。`,
                        components: []
                    });
                }

                const champData = await getChampionData(game.championId);
                const aiScore = await getDeepLoLAIScore(game.matchId, account, game.championId);

                const embed = createLoLMatchResultEmbed({
                    account,
                    user: target,
                    title: `**${account.riot_id_name}#${account.riot_id_tag}**の最新の試合結果`,
                    matchId: game.matchId,
                    winStatus: game.win,
                    gameMode: game.gameMode,
                    champData,
                    kda: game.kda,
                    aiScore,
                    gameDuration: game.gameDuration,
                    killParticipation: game.killParticipation,
                    version: game.version
                });

                return await interaction.editReply({ content: null, embeds: [embed], components: [] });
            } catch (error) {
                console.error("Error fetching lastgame from Riot API:", error);
                return await interaction.editReply({
                    content: "試合情報の取得中にエラーが発生しました。",
                    components: []
                });
            }
        }
    }
};
