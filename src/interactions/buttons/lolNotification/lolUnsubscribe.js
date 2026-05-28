const { MessageFlags } = require("discord.js");
const LoLNotification = require("../../../models/LoLNotification");

module.exports = {
    customId: "lolUnsubscribe",
    async execute(interaction) {
        const userExists = await LoLNotification.subscribed(interaction.user.id);
        if (!userExists) {
            return interaction.reply({ content: "通知を登録していません。", flags: MessageFlags.Ephemeral });
        }
        await LoLNotification.unsubscribe(interaction.user.id);
        await interaction.reply({ content: "LoLプレイヤー数の通知を解除しました。", flags: MessageFlags.Ephemeral });
    }
};
