const {
    Events,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");
const TemporaryVC = require("../models/TemporaryVC");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand() || interaction.isUserContextMenuCommand() || interaction.isContextMenuCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                let errorMsg = "エラーが発生しました。";
                if (error.name === "GatewayRateLimitError") {
                    errorMsg = `エラー: コマンドの使用間隔が短すぎます。\n${Math.floor(error.data.retry_after)}秒待ってから再試行してください。`;
                } else if (error.code === 50013) {
                    errorMsg = "エラー: この操作を行う権限がありません。";
                }
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: errorMsg, flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
                    }
                } catch (e) {
                    console.error("Failed to send error reply:", e);
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith("channelName_")) {
                const channelId = interaction.customId.split("_")[1];
                const row = TemporaryVC.get(channelId);
                const creatorId = row ? row.creator_id : null;

                if (interaction.user.id !== creatorId) {
                    return interaction.reply({ content: "作成者のみがチャンネル設定を変更できます。", flags: MessageFlags.Ephemeral });
                }

                const modal = new ModalBuilder()
                    .setCustomId("channelNameModal_" + channelId)
                    .setTitle("チャンネル名を設定してください");

                const channelNameInput = new TextInputBuilder()
                    .setCustomId("channelNameInput")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("新しいチャンネル名を入力")
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(channelNameInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith("channelNameModal_")) {
                const channelId = interaction.customId.split("_")[1];
                const row = TemporaryVC.get(channelId);
                const creatorId = row ? row.creator_id : null;

                if (interaction.user.id !== creatorId) {
                    return interaction.reply({ content: "作成者のみが名前を変更できます。", flags: MessageFlags.Ephemeral });
                }

                try {
                    const channel = await interaction.guild.channels.fetch(channelId);
                    if (channel) {
                        const newName = interaction.fields.getTextInputValue("channelNameInput");
                        await channel.setName(newName);
                        await TemporaryVC.saveName(interaction.user.id, newName);
                        await interaction.reply({ content: `チャンネル名を **${newName}** に変更しました。`, flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: "チャンネルが見つかりませんでした。", flags: MessageFlags.Ephemeral });
                    }
                } catch (error) {
                    console.error("チャンネルの取得または名前の変更に失敗しました:", error);
                    if (!interaction.replied) {
                        await interaction.reply({ content: "チャンネル名の変更中にエラーが発生しました。", flags: MessageFlags.Ephemeral });
                    }
                }
            }
        }
    },
};
