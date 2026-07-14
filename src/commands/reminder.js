const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, LabelBuilder } = require("discord.js");
const Reminder = require("../models/Reminder");
const { v4: uuidv4 } = require("uuid");
const { createScheduledTask } = require("../utils/scheduler");
const dayjs = require("dayjs")
const chrono = require("chrono-node");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("reminder")
        .setDescription("リマインダーを設定します。")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("リマインダーを追加します。")
                .addStringOption(option =>
                    option
                        .setName("time")
                        .setDescription("リマインダーの時刻")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("message")
                        .setDescription("リマインダーの内容")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("自分のリマインダーの一覧を表示します。")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("自分のリマインダーを削除します。")
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "add") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const timeString = interaction.options.getString("time");
            const parsedDate = await chrono.ja.parseDate(timeString);
            if (!parsedDate) {
                await interaction.editReply({
                    content: "無効な時刻が入力されました。",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            const time = parsedDate.getTime();
            const message = interaction.options.getString("message");
            const reminder_id = uuidv4();
            try {
                await Reminder.create(reminder_id, interaction.user.id, time, message);
                createScheduledTask({
                    name: "reminder",
                    time: time,
                    process: async () => {
                        const user = await interaction.client.users.fetch(interaction.user.id);
                        const ReminderEmbed = new EmbedBuilder()
                            .setTitle("リマインダー")
                            .setDescription(message)
                            .setColor("#0099ff")
                            .setTimestamp();
                        await user.send({
                            embeds: [ReminderEmbed]
                        });
                        await Reminder.delete(reminder_id);
                    }
                });
                await interaction.editReply({
                    content: `リマインダーを設定しました。\n時刻: ${time}\n内容: ${message}`,
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error(error);
                await interaction.editReply({
                    content: "リマインダーの設定に失敗しました。",
                    flags: MessageFlags.Ephemeral
                });
            }
        } else if (subcommand === "list") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const reminders = await Reminder.getAllByUser(interaction.user.id);
            if (reminders.length === 0) {
                return await interaction.editReply({
                    content: "あなたはまだリマインダーを設定していません。",
                    flags: MessageFlags.Ephemeral
                });
            }
            const ReminderEmbed = new EmbedBuilder()
                .setTitle("リマインダー一覧")
                .setDescription(reminders.map(reminder => `${reminder.message} (実行時刻: ${dayjs(reminder.time).format("YYYY/MM/DD HH:mm")})`).join("\n"))
                .setColor("#0099ff")
                .setTimestamp();
            await interaction.editReply({
                embeds: [ReminderEmbed],
                flags: MessageFlags.Ephemeral
            });
        } else if (subcommand === "delete") {
            const reminders = await Reminder.getAllByUser(interaction.user.id);
            if (reminders.length === 0) {
                return await interaction.reply({
                    content: "あなたはまだリマインダーを設定していません。",
                    flags: MessageFlags.Ephemeral
                });
            }
            const modal = new ModalBuilder()
                .setCustomId("delete_reminder_modal")
                .setTitle("リマインダーの削除");
            const reminderSelect = new StringSelectMenuBuilder()
                .setCustomId("delete_reminder_select")
                .setPlaceholder("削除するリマインダーを選択してください")
                .addOptions(
                    reminders.map(reminder => {
                        return {
                            label: reminder.message,
                            value: reminder.reminder_id
                        };
                    })
                )
                .setRequired(true);
            const reminderSelectLabel = new LabelBuilder()
                .setLabel("リマインダーを選択")
                .setDescription("削除するリマインダーを選択してください")
                .setStringSelectMenuComponent(reminderSelect)
            modal.addLabelComponents(reminderSelectLabel);
            await interaction.showModal(modal);
        }
    }
}