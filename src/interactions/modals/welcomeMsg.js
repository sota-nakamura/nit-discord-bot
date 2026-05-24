const { MessageFlags } = require("discord.js");
const welcomeMsg = require("./../../models/welcomeMsg");

module.exports = {
    customId: "welcomeMsg",
    async execute(interaction) {
        const value = interaction.fields.getTextInputValue("welcomeMsg_text");
        const result = await welcomeMsg.setMsg(interaction.guild.id, value);
        await interaction.reply({
            content: "ようこそメッセージを保存しました",
            flags: MessageFlags.Ephemeral
        });
    }
}