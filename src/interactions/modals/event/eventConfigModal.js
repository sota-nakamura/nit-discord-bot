const { MessageFlags } = require("discord.js");
const EventConfig = require("./../../../models/EventConfig");

module.exports = {
    customId: "eventCreateConfigModal",
    async execute(interaction) {
        const eventNotificationChannel = interaction.fields.getSelectedChannels("eventNotificationChannel").first();
        await EventConfig.save(interaction.guild.id, eventNotificationChannel.id);

        await interaction.reply({
            content: "イベント作成通知チャンネルを設定しました。",
            flags: MessageFlags.Ephemeral
        });
    }
}