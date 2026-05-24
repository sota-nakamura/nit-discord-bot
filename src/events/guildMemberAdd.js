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
    onlyProduction: true,
    async execute(member) {
        console.log(`[INFO] ${member.user.tag}がサーバーに参加しました`);
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

        let welComeMsg = "{user} さん、{server} へようこそ！";
        welComeMsg = welComeMsg.replaceAll("{user}", member.user.tag);
        welComeMsg = welComeMsg.replaceAll("{server}", member.guild.name);

        const joinEmbed = new EmbedBuilder()
            .setTitle(`**${member.guild.name}へようこそ！**`)
            .setDescription(welComeMsg)
            .setColor(0x0099ff)
            .setFooter({
                text: `${member.guild.name} | 現在の人数: ${member.guild.memberCount}人`,
                iconURL: member.guild.iconURL(),
            })
            .setImage("attachment://profile-image.png")
            .setTimestamp();

        await member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID).send({
            content: `${member.user}`,
            embeds: [joinEmbed],
            files: [attachment]
        });
    },
};
