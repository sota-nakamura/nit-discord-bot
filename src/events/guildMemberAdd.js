const {
    Events,
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const path = require('path');

Canvas.GlobalFonts.registerFromPath(path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansJP-Bold.ttf'), 'Noto Sans JP');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        console.log(`${member.user.tag}がサーバーに参加しました`);
        console.log(member);
        const canvas = Canvas.createCanvas(700, 250);
        const context = canvas.getContext('2d');

        context.fillStyle = "#0099ff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const avatarSize = 100;
        const avatarX = canvas.width / 2;
        const avatarY = 90;

        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
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

        context.font = "bold 28px 'Noto Sans JP', sans-serif";
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.fillText(member.user.displayName, canvas.width / 2, 195);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
        const joinEmbed = new EmbedBuilder()
            .setTitle(`**${member.guild.name}へようこそ！**`)
            .setDescription(`**${member.user.tag}** さんがサーバーに参加しました！\n\n`)
            .setColor(0x0099ff)
            .setFooter({
                text: `${member.guild.name} | 現在の人数: ${member.guild.memberCount}人`,
                iconURL: guild => guild ? guild.iconURL() : null, // 安全対策
            })
            .setImage("attachment://profile-image.png")
            .setTimestamp();

        if (joinEmbed.data.footer) {
            joinEmbed.setFooter({
                text: `${member.guild.name} | 現在の人数: ${member.guild.memberCount}人`,
                iconURL: member.guild.iconURL(),
            });
        }

        await member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID).send({
            embeds: [joinEmbed],
            files: [attachment]
        });
    },
};
