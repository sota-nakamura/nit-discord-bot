const { MessageFlags } = require("discord.js")
const LoLNotification = require("../../models/LoLNotification");
module.exports = {
    customId: "lolConfigModal",
    async execute(interaction) {
        const toggle = interaction.fields.getCheckbox("lolNotification_toggle");
        if (toggle) {
            await LoLNotification.enable(interaction.guildId, interaction.channelId);
        } else {
            await LoLNotification.disable(interaction.guildId);
        }
        await interaction.reply({
            content: `LoL通知機能を${toggle ? "有効化" : "無効化"}しました。`,
            flags: MessageFlags.Ephemeral
        });
    }
}