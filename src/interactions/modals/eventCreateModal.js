const dayjs = require("dayjs");
const { MessageFlags } = require("discord.js");

module.exports = {
    customId: "eventCreateModal",
    async execute(interaction) {
        const dateStr = interaction.fields.getTextInputValue("time");
        console.log(interaction.fields.getSelectedChannels("voiceChannel").first())

        await interaction.guild.scheduledEvents.create({
            name: interaction.fields.getTextInputValue("name"),
            description: interaction.fields.getTextInputValue("description"),
            scheduledStartTime: dayjs(dateStr).toISOString(),
            privacyLevel: 2,
            entityType: 2,
            channel: interaction.fields.getSelectedChannels("voiceChannel").first()
        })

        await interaction.reply({
            content: "イベントを作成しました。",
            flags: MessageFlags.Ephemeral
        });
    }
};