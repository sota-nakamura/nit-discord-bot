const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Impersonated = require("../models/Impersonated");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("impersonate")
        .setDescription("他人になりすましてメッセージを送信できます。")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("対象のユーザー")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("なりすまして送信するメッセージを入力")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const targetUser = interaction.options.getUser("user");
        const targetMember = interaction.guild.members.cache.get(targetUser.id);
        const content = interaction.options.getString("message");
        const channel = interaction.channel;
        const webhook = await channel.createWebhook({
            name: targetMember.nickname ? targetMember.displayName : targetUser.displayName,
            avatar: targetUser.displayAvatarURL()
        })
        const reply = await webhook.send({
            content: content
        });
        await reply.react("👀");
        await Impersonated.insert(reply.id, interaction.user.id);
        await webhook.delete();
        await interaction.editReply({
            content: "メッセージを送信しました。",
            flags: MessageFlags.Ephemeral
        });
    }
}