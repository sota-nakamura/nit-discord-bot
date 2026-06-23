const { MessageFlags } = require("discord.js");
const dayjs = require("dayjs");
const EventConfig = require("./../../../models/EventConfig");

module.exports = {
    customId: "eventCreateModal",
    async execute(interaction) {
        const dateStr = interaction.fields.getTextInputValue("time");

        if (dayjs(dateStr).isBefore(dayjs())) {
            await interaction.reply({
                content: "イベント開始時刻は現在時刻よりも後の時刻にしてください。",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await interaction.guild.scheduledEvents.create({
                name: interaction.fields.getTextInputValue("name"),
                description: interaction.fields.getTextInputValue("description"),
                scheduledStartTime: dayjs(dateStr).toISOString(),
                privacyLevel: 2,
                entityType: 2,
                channel: interaction.fields.getSelectedChannels("voiceChannel").first()
            });

            const config = EventConfig.get(interaction.guildId);
            const eventNotificationChannelId = config ? config.event_notification_channel : null;
            if (eventNotificationChannelId) {
                const eventNotificationChannel = await interaction.guild.channels.fetch(eventNotificationChannelId).catch(() => null);
                if (eventNotificationChannel) {
                    await eventNotificationChannel.send({
                        content: `イベント **${interaction.fields.getTextInputValue("name")}** が作成されました。`
                    });
                }
            }

            await interaction.editReply({
                content: "イベントを作成しました。"
            });
        } catch (error) {
            console.error("Error creating event:", error);
            await interaction.editReply({
                content: "イベントの作成中にエラーが発生しました。"
            });
        }
    }
}