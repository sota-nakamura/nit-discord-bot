const {
    Events,
    EmbedBuilder,
    AttachmentBuilder,
    SlashCommandBuilder,
    MessageFlags,
    Client
} = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const path = require('path');
const { execPath } = require("process");

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
                .setDescription("test the activity message")
                .addUserOption(option =>
                    option
                        .setName("member")
                        .setDescription("the member to check activity")
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
        if (subcommand === "join") {
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
        } else if (subcommand === "activity") {
            const optionMember = interaction.options.getMember("member");
            const presence = optionMember.presence;

            if (!presence) {
                return interaction.reply({
                    content: `**${optionMember.user.tag}** のステータス（Presence）を取得できませんでした。オフラインか、Botのインテント設定が不足しています。`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const activities = presence.activities;
            console.log(activities);

            const activityNames = activities.map(a => `**${a.name}**`).join(", ");
            await interaction.reply({
                content: `**${optionMember.user.username}** の現在のアクティビティ:\n${activityNames || "なし"}`,
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};

