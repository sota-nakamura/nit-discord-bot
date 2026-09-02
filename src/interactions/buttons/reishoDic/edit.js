const { MessageFlags } = require("discord.js");
const ReishoDicEdit = require("../../../utils/components/reishodic");
const CollectReishoDicEdit = require("../../../utils/collectors/reishoEdit");

module.exports = {
    customId: "edit_dic",
    async execute(interaction) {
        const container = await ReishoDicEdit.createActionSelectContainer();
        const response = await interaction.reply({
            components: [container],
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            withResponse: true
        });

        await CollectReishoDicEdit(response, interaction);
    }
};