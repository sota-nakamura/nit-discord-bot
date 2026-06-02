const { MessageFlags } = require("discord.js");
const welcomeMsg = require("./../../models/welcomeMsg");

module.exports = {
    customId: "welcomeMsg",
    async execute(interaction) {
        const value = interaction.fields.getTextInputValue("welcomeMsg_text");
        const toggle = interaction.fields.getCheckbox("welcomeMsg_toggle");
        if (toggle) {
            await welcomeMsg.setMsg(interaction.guild.id, value);
            await interaction.reply({
                content: "ようこそメッセージを保存しました",
                flags: MessageFlags.Ephemeral
            });
        } else {
            await welcomeMsg.remove(interaction.guild.id);
            await interaction.reply({
                content: "ようこそメッセージを無効化しました",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}