const { MessageFlags } = require("discord.js");
const ReishoDicEdit = require("../../../utils/components/reishodic");

module.exports = {
    customId: "edit_dic",
    async execute(interaction) {
        const container = await ReishoDicEdit.createActionSelectContainer();
        const response = await interaction.reply({
            components: [container],
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            withResponse: true
        });

        const collector = response.resource.message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 120000
        });

        collector.on("collect", async i => {
            const action = i.values[0];
            await interaction.deleteReply();
            switch (action) {
                case "add": {
                    const addModal = ReishoDicEdit.createAddModal();
                    await i.showModal(addModal);
                    break;
                }
                case "delete": {
                    const searchModal = ReishoDicEdit.createDeleteSearchModal();
                    await i.showModal(searchModal);
                    break;
                }
                case "edit": {
                    await i.reply({
                        content: "編集機能は現在準備中です。",
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                }
            }
        });

        collector.on("end", () => { });
    }
};