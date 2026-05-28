const { MessageFlags } = require("discord.js");
const LoLNotification = require("../../../models/LoLNotification");

module.exports = {
    customId: "lolNotification",
    async execute(interaction) {
        const userExists = await LoLNotification.subscribed(interaction.user.id);
        if (userExists) {
            return interaction.reply({ content: "すでに通知を登録しています。", flags: MessageFlags.Ephemeral });
        }
        await LoLNotification.subscribe(interaction.user.id);
        await interaction.reply({ content: "LoLの通知を登録しました。", flags: MessageFlags.Ephemeral });
    }
};
