const { MessageFlags } = require("discord.js");
const Reminder = require("../../../models/Reminder");

module.exports = {
    customId: "delete_reminder_modal",
    async execute(interaction) {
        const reminderId = interaction.fields.getStringSelectValues("delete_reminder_select");
        const reminder = await Reminder.get(reminderId);
        if (!reminder) {
            await interaction.reply({
                content: "リマインダーが見つかりません。",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await Reminder.delete(reminderId);
        await interaction.reply({
            content: `リマインダー「${reminder.message}」を削除しました。`,
            flags: MessageFlags.Ephemeral
        });
    }
};