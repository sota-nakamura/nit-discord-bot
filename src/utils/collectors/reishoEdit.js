const ReishoDicEdit = require("../components/reishodic");
const { MessageFlags } = require("discord.js");

module.exports = async function CollectReishoDicEdit(response, interaction) {
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
};