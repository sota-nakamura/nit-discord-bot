const {
    Events,
    EmbedBuilder
} = require("discord.js");
const generateWelcomeImage = require('../utils/canvas/generateWelcomeImage');

module.exports = {
    name: Events.GuildMemberAdd,
    onlyProduction: true,
    async execute(member) {
        console.log(`[INFO] ${member.user.tag}がサーバーに参加しました`);
        console.log(member);

        const attachment = await generateWelcomeImage(member);

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
