const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const ReishoDicEdit = require("../utils/components/reishodic");
const CollectReishoDicEdit = require("../utils/collectors/reishoEdit");

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
        await CollectReishoDicEdit(response, interaction);
    }
};