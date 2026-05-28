const RolePrefix = require("../../../models/RolePrefix");
const { MessageFlags } = require("discord.js");

module.exports = {
    customId: "modal_addPrefix",
    async execute(interaction) {
        const prefix = interaction.fields.getTextInputValue("prefix");
        const role = interaction.fields.getSelectedRoles("role").first();
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await RolePrefix.set(role.id, prefix);

        await interaction.editReply({ content: `ロール **${role.name}** の接頭辞を **${prefix}** に設定しました。`, flags: MessageFlags.Ephemeral });
    }
}