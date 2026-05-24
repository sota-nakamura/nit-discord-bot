const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require("discord.js");

const { ServerConfig } = require("../utils/components");
const welcomeMsg = require("../models/welcomeMsg");
const LoLNotification = require("../models/LoLNotification");

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
                        const welcomeMsgModal = ServerConfig.createWelcomeMsgConfigModal(i.guild.id);
                        await i.showModal(welcomeMsgModal);
                        break;
                    case "lolNotification":
                        const lolNotificationModal = ServerConfig.createLoLConfigModal(i.guild.id)
                        await i.showModal(lolNotificationModal)
                        break;
                }
            } else if (i.customId === "back") {
                const response = await i.update({
                    components: [ServerConfig.createServerConfigContainer()],
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                    withResponse: true
                });
            }
        });

        collector.on("end", () => {
            interaction.editReply({ components: [] }).catch(() => { });
        });
    }
};