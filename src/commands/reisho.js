const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const ReishoDicEdit = require("../utils/components/reishodic");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reisho")
        .setDescription("冷笑を検知する辞書を管理"),
    async execute(interaction) {
        const response = await interaction.reply({
            components: [ReishoDicEdit.createActionSelectContainer()],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            withResponse: true
        });

        const collector = response.resource.message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 120000
        });

        collector.on("collect", async i => {
            const action = i.values[0];
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
                default:
                    break;
            }
        });

        // エフェメラルメッセージは編集不可のため end イベントでは何もしない
        collector.on("end", () => {});
    }
};