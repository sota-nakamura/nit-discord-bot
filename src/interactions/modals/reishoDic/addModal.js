const { MessageFlags } = require("discord.js");
const ReishoDic = require("../../../models/ReishoDic");

module.exports = {
    customId: "reishoDicAddModal",
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const content = interaction.fields.getTextInputValue("wordInput").trim();
        const typeValues = interaction.fields.getStringSelectValues("phraseTypeSelect");
        const type = typeValues[0] === "add_single_word" ? 1 : 0;

        const result = await ReishoDic.save(content, type);
        const message = result === "既に登録されています"
            ? `⚠️ 「${content}」は既に登録されています。`
            : `✅ 「${content}」（${type === 1 ? "単語" : "フレーズ"}）を登録しました。`;

        await interaction.editReply({ content: message });
    }
};