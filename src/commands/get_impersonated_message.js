const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require("discord.js");
const Impersonated = require("../models/Impersonated");
module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName("なりすましメッセージの確認")
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const message = interaction.targetMessage;
        const fetchedData = await Impersonated.get(message.id);
        if (!fetchedData) {
            return await interaction.editReply({
                content: "対象のメッセージはなりすましメッセージではありません。",
                flags: MessageFlags.Ephemeral
            });
        }
        const user = interaction.client.users.cache.get(fetchedData.user_id);
        await interaction.editReply({
            content: `このメッセージは${user.username}によって送信されました。`
        })
    }
}