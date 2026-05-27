const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    RoleSelectMenuBuilder,
    LabelBuilder
} = require("discord.js");

module.exports = {
    customId: "addPrefix",
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId("addPrefix")
            .setTitle("ロールの接頭辞設定");

        const prefixInput = new TextInputBuilder()
            .setCustomId("prefix")
            .setStyle(TextInputStyle.Short)
            .setMinLength(0)
            .setMaxLength(1000)
            .setRequired(true);
        const prefixInputLabel = new LabelBuilder()
            .setLabel("接頭辞")
            .setTextInputComponent(prefixInput);

        const roleInput = new RoleSelectMenuBuilder()
            .setCustomId("role")
            .setMaxValues(1)
            .setMinValues(1);
        const roleInputLabel = new LabelBuilder()
            .setCustomId("roleInputLabel")
            .setLabel("ロールを選択")
            .setRoleSelectMenuComponent(roleInput);

        modal.addLabelComponents(prefixInputLabel, roleInputLabel);

        await interaction.showModal(modal);
    }
};
