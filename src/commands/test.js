const {
    Events,
    EmbedBuilder,
    AttachmentBuilder,
    SlashCommandBuilder,
    MessageFlags,
} = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const path = require('path');
const { execPath, title } = require("process");
const db = require("../models/Database");
const LoLAccount = require("../models/LoLAccount");
const { getActiveGame, getChampionData, getLatestMatchStats, rAPI } = require("../utils/riotApi");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("test command.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("join")
                .setDescription("test the join message")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("activity")
                .setDescription("ユーザーのアクティビティを取得")
                .addUserOption(options =>
                    options
                        .setName("user")
                        .setDescription("アクティビティを取得するユーザーを選択")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("notfunny")
                .setDescription("test the notfunny status")
        ),
    async execute(interaction) {
        if (interaction.user.username !== "satoimo_satosi") {
            return interaction.reply({
                content: "u cant use this command lil bro",
                flags: [MessageFlags.Ephemeral]
            })
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "join") {
            interaction.reply({
                content: "なんもないっすね",
                flags: [MessageFlags.Ephemeral]
            });
            /*
            await interaction.deferReply({
                flags: [MessageFlags.Ephemeral]
            });

            const canvas = Canvas.createCanvas(700, 250);
            const context = canvas.getContext('2d');

            context.fillStyle = "#0099ff";
            context.fillRect(0, 0, canvas.width, canvas.height);

            const avatarSize = 100;
            const avatarX = canvas.width / 2;
            const avatarY = 90;

            const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
            const avatar = await Canvas.loadImage(avatarUrl);

            context.beginPath();
            context.arc(avatarX, avatarY, (avatarSize / 2) + 4, 0, Math.PI * 2, true);
            context.fillStyle = "#ffffff";
            context.fill();
            context.closePath();

            context.save();
            context.beginPath();
            context.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, avatarX - (avatarSize / 2), avatarY - (avatarSize / 2), avatarSize, avatarSize);
            context.restore();

            context.font = "bold 28px sans-serif";
            context.fillStyle = "#ffffff";
            context.textAlign = "center";
            context.fillText(interaction.user.username, canvas.width / 2, 195);

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
            const joinEmbed = new EmbedBuilder()
                .setTitle(`**${interaction.guild.name}へようこそ！**`)
                .setDescription(`**${interaction.user.tag}** さんがサーバーに参加しました！\n\n`)
                .setColor(0x0099ff)
                .setFooter({
                    text: `${interaction.guild.name} | 現在の人数: ${interaction.guild.memberCount}人`,
                    iconURL: interaction.guild.iconURL(),
                })
                .setImage("attachment://profile-image.png")
                .setTimestamp();

            await interaction.editReply({
                embeds: [joinEmbed],
                files: [attachment],
                flags: [MessageFlags.Ephemeral]
            });
            */
        } else if (subcommand === "activity") {
            await interaction.deferReply();
            const target = interaction.options.getUser("user");

            // 1. Check if they have a linked Riot Account first
            const account = LoLAccount.get(target.id);
            if (account) {
                try {
                    let game = await getActiveGame(account.puuid);
                    let title = `**${account.riot_id_name}#${account.riot_id_tag}**は現在試合中です!`
                    let status = "試合中"
                    if (!game) {
                        game = await getLatestMatchStats(account.puuid);
                        title = `**${account.riot_id_name}#${account.riot_id_tag}**の最新の試合結果`
                        status = game.win ? "勝利" : "敗北"
                    }
                    const champData = await getChampionData(game.championId);
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
                        .setTitle(title)
                        .setURL(`https://www.deeplol.gg/summoner/jp/${account.riot_id_name}-${account.riot_id_tag}/matches/${game.matchId}`)
                        .setDescription("タイトルをクリックしてDeepLOLの試合分析を確認できます！")
                        .setColor(game.win ? "Green" : "Orange")
                        .addFields(
                            { name: "ステータス", value: status, inline: true },
                            { name: "チャンピオン", value: champData.name, inline: true },
                            { name: "ゲームモード", value: game.gameMode || "不明", inline: true },
                            { name: "KDA", value: game.kda }
                        )
                        .setTimestamp()
                        .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${game.version}/img/champion/${champData.image.full}`);

                    if (game.startTime > 0) {
                        const startUnix = Math.floor(game.startTime / 1000);
                        embed.addFields({ name: "経過時間", value: `<t:${startUnix}:R>`, inline: true });
                    }

                    return await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error("Error fetching live game from Riot API in test command:", error);
                }
            }
        } else if (subcommand === "notfunny") {
            await db.prepare("INSERT INTO funny_vote (user_id, not_funny_count) VALUES (?, 10)").run(interaction.user.id);
            interaction.reply({
                content: "the process was successfully finished.",
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
