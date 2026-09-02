const { MessageFlags } = require("discord.js");
const ReishoDic = require("../../../models/ReishoDic");
const ReishoDicEdit = require("../../../utils/components/reishodic");

module.exports = {
    customId: "reishoDicDeleteSearchModal",
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const keyword = interaction.fields.getTextInputValue("delete_search_keyword").trim();

        const all = await ReishoDic.getAll();
        const results = keyword
            ? all.filter(r => r.content.includes(keyword))
            : all;

        const container = await ReishoDicEdit.createDeleteSelectContainer(results);
        const response = await interaction.editReply({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });

        const collector = response.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 120000
        });

        collector.on("collect", async i => {
            if (i.customId === "reisho_dic_delete_select") {
                await i.deferUpdate();
            } else if (i.customId === "reisho_dic_delete_confirm") {
                const selectedValues = i.message.components[0]
                    ?.components?.find(c => c.customId === "reisho_dic_delete_select")
                    ?.values ?? [];

                if (selectedValues.length === 0) {
                    await i.reply({ content: "削除する単語が選択されていません。", flags: MessageFlags.Ephemeral });
                    return;
                }

                for (const val of selectedValues) {
                    const [type, content] = val.split("::");
                    await ReishoDic.delete(content, type === "単語" ? 1 : 0);
                }

                await i.reply({
                    embeds: [
                        ReishoDicEdit.createSearchResultEmbed(null)
                            .setTitle("削除完了")
                            .setDescription(`✅ **${selectedValues.length}件** を削除しました。`)
                    ],
                    components: [],
                    flags: [MessageFlags.IsComponentsV2]
                });
                collector.stop();
            } else if (i.customId === "search_again") {
                await i.showModal(ReishoDicEdit.createDeleteSearchModal());
                await i.deleteReply();
            }
        });

        collector.on("end", () => { });
    }
};
