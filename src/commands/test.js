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
            /*
            interaction.reply({
                content: "なんもないっすね",
                flags: [MessageFlags.Ephemeral]
            });
            */
            await interaction.deferReply();
            const guild = interaction.guild;
            const members = await guild.members.fetch()
            const lolRoleId = "1469718241600475259"
            const lolVoiceChannelIds = new Set();
            const lolPlayerList = [];
            members.forEach(member => {
                if (!member.presence || !member.roles.cache.has(lolRoleId)) return;
                const playingLoL = member.presence.activities.some(activity => activity.applicationId === "401518684763586560");
                if (playingLoL && member.voice?.channelId) {
                    lolVoiceChannelIds.add(member.voice.channelId);
                }
            });

            let lolPlayerCount = 0;
            members.forEach(member => {
                const isPlayingLoL = member.presence?.activities.some(activity => activity.applicationId === ("401518684763586560" || "1402418696126992445"));
                const isInLoLVoice = member.voice?.channelId && lolVoiceChannelIds.has(member.voice.channelId);
                const isOffline = !member.presence;

                if (isPlayingLoL || (isInLoLVoice && isOffline && member.roles.cache.has(lolRoleId))) {
                    lolPlayerCount++;
                    lolPlayerList.push(`<@${member.id}>`);
                }
            });
            const lolPlayerEmbed = new EmbedBuilder()
                .setTitle(lolPlayerCount > 5 ? "けっこうLoLやってますね" : "あんまLoLやってないっすね")
                .setColor(0x0099ff)
                .setDescription(`現在 ${lolPlayerCount}人がlolやってます`)
                .addFields({
                    name: "プレイヤー一覧",
                    value: lolPlayerList.length > 0 ? "\n - " + lolPlayerList.join("\n - ") : "現在プレイ中の人はいません",
                })
                .setFooter({
                    text: `${interaction.guild.name} | 現在の人数: ${interaction.guild.memberCount}人`,
                    iconURL: interaction.guild.iconURL(),
                })
                .setTimestamp();
            await interaction.editReply({
                embeds: [lolPlayerEmbed],
            });
        }
    }
};
