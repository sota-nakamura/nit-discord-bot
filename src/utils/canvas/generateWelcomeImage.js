const Canvas = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');

async function generateWelcomeImage(member) {
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

    return attachment;
}

module.exports = { generateWelcomeImage };
