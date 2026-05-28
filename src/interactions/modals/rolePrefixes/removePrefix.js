const RolePrefix = require("../../../models/RolePrefix");
const { MessageFlags } = require("discord.js");

module.exports = {
    customId: "modal_removePrefix",
    async execute(interaction) {
        const role = interaction.fields.getSelectedRoles("role").first();
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const prefixData = await RolePrefix.get(role.id);
        if (!prefixData) {
            return interaction.editReply({ content: `ロール **${role.name}** には接頭辞が設定されていません。`, flags: MessageFlags.Ephemeral });
        }
        await RolePrefix.remove(role.id);
        await interaction.editReply({ content: `ロール **${role.name}** の接頭辞を削除しました。` });
    }
}