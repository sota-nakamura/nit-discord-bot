const { MessageFlags } = require("discord.js")

module.exports = {
    customId: "lolConfigModal",
    async execute(interaction) {
        const toggle = interaction.fields.getCheckbox("lolNotification_toggle");

        await interaction.reply({
            content: "通知設定を保存しました",
            flags: MessageFlags.Ephemeral
        });
    }
}