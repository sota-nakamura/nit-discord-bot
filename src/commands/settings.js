const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require("discord.js");

const ServerConfig = require("../utils/serverconfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("settings")
        .setDescription("サーバーの設定を行う")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const response = await interaction.reply({
            components: [ServerConfig.createServerConfigContainer()],
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            withResponse: true
        });
        const collector = response.resource.message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on("collect", async (i) => {
            if (i.values) {
                switch (i.values[0]) {
                    case "welcomeMsg":
                        const welcomeMsgModal = await ServerConfig.createWelcomeMsgConfigModal(i.guild.id);
                        await i.showModal(welcomeMsgModal);
                        break;
                    case "lolNotification":
                        const lolNotificationModal = ServerConfig.createLoLConfigModal(i.guild.id);
                        await i.showModal(lolNotificationModal)
                        break;
                    case "eventCreate":
                        const eventCreateModal = ServerConfig.createEventConfigModal(i.guild.id);
                        await i.showModal(eventCreateModal)
                        break;
                }
            } else if (i.customId === "cancel") {
                const response = await i.update({
                    content: "サーバー設定を保存せずに終了しました。",
                    flags: [MessageFlags.Ephemeral]
                });
            } else if (i.customId === "save") {
                const response = await i.update({
                    content: "サーバー設定を保存しました。",
                    flags: [MessageFlags.Ephemeral]
                });
            }
        });

        collector.on("end", () => {
            interaction.editReply({ components: [] }).catch(() => { });
        });
    }
};