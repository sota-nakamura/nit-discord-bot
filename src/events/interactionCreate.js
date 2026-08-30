const { Events, MessageFlags } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (process.env.NODE_ENV !== "production" && interaction.user.id !== process.env.BOT_OWNER_ID) {
                return interaction.reply({
                    content: "こちらはテスト用のBotのコマンドです。一般ユーザーの操作は制限されています。",
                    flags: MessageFlags.Ephemeral
                });
            }
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
                            await interaction.followUp({ content: errorMsg });
                        } else {
                            await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
                        }
                    } catch (e) {
                        console.error("Failed to send error reply:", e);
                    }
                }
            } else if (interaction.isButton()) {
                const customId = interaction.customId;
                let button = interaction.client.buttons.get(customId);
                if (!button) {
                    button = interaction.client.buttons.find((btn, key) => customId.startsWith(key));
                }
                if (button) {
                    await button.execute(interaction);
                }
            } else if (interaction.isModalSubmit()) {
                const customId = interaction.customId;
                let modal = interaction.client.modals.get(customId);
                if (!modal) {
                    modal = interaction.client.modals.find((mdl, key) => customId.startsWith(key));
                }

                if (modal) {
                    await modal.execute(interaction);
                }
            }
        } catch (error) {
            console.error("Error handling interaction:", error);
            let errorMsg = "エラーが発生しました。";
            if (error.name === "GatewayRateLimitError") {
                errorMsg = `エラー: コマンドの使用間隔が短すぎます。\n${Math.floor(error.data.retry_after)}秒待ってから再試行してください。`;
            } else if (error.code === 50013) {
                errorMsg = "エラー: この操作を行う権限がありません。";
            }
            try {
                if (typeof interaction.reply === "function") {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: errorMsg, flags: MessageFlags.Ephemeral }).catch(() => null);
                    } else {
                        await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral }).catch(() => null);
                    }
                }
            } catch (e) {
                console.error("Failed to send interaction fallback error reply:", e);
            }
        }
    },
};
