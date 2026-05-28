const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const RolePrefix = require("../models/RolePrefix");
const Prefix = require("../utils/prefix")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("prefix")
        .setDescription("ロールごとに名前の先頭につくテキストを管理します"),
    async execute(interaction) {
        // check permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: "このコマンドを実行する権限がありません。", flags: MessageFlags.Ephemeral });
        }
        const initialPrefixList = await RolePrefix.getAll();
        const PrefixEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("ロールの接頭辞設定")
            .setDescription("ロールに接頭辞を設定します")
            .addFields(
                ...initialPrefixList.map(prefixData => ({
                    name: `接頭辞: [${prefixData.prefix}]`,
                    value: `ロール: <@&${prefixData.role_id}>`,
                }))
            );
        const PrefixControl = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("addPrefix")
                    .setLabel("接頭辞を追加")
                    .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("removePrefix")
                    .setLabel("接頭辞を削除")
                    .setStyle(ButtonStyle.Danger)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("applyPrefix")
                    .setLabel("保存して適用")
                    .setStyle(ButtonStyle.Success)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("キャンセル")
                    .setStyle(ButtonStyle.Danger)
            );

        const response = await interaction.reply({
            embeds: [PrefixEmbed],
            components: [PrefixControl],
            flags: MessageFlags.Ephemeral,
            withResponse: true
        });

        const collector = response.resource.message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on("collect", async (i) => {
            switch (i.customId) {
                case "addPrefix":
                    const addPrefixModal = Prefix.createAddPrefixModal();
                    await i.showModal(addPrefixModal);
                    break;
                case "removePrefix":
                    const removePrefixModal = Prefix.createRemovePrefixModal();
                    await i.showModal(removePrefixModal);
                    break;
                case "applyPrefix":
                    await i.deferReply({ flags: MessageFlags.Ephemeral });
                    const prefixList = await RolePrefix.getAll();
                    const prefixManager = new Prefix(prefixList, interaction.client);
                    await prefixManager.apply(interaction.guild);
                    await i.editReply({ content: "保存して適用しました。" });
                    collector.stop("applied");
                    break;
                case "cancel":
                    await i.deferUpdate();
                    await RolePrefix.restore(initialPrefixList);
                    collector.stop("cancelled");
                    break;
            }
        });
        collector.on("end", async (collected, reason) => {
            if (reason === "applied") {
                const prefixList = await RolePrefix.getAll();
                const PrefixEmbed = new EmbedBuilder()
                    .setColor("#00ff00")
                    .setTitle("ロールの接頭辞設定（適用済み）")
                    .setDescription("ロールの接頭辞設定が保存・適用されました。")
                    .addFields(
                        ...prefixList.map(prefixData => ({
                            name: `接頭辞: [${prefixData.prefix}]`,
                            value: `ロール: <@&${prefixData.role_id}>`,
                        }))
                    );
                await interaction.editReply({ embeds: [PrefixEmbed], components: [] }).catch(() => { });
            } else if (reason === "cancelled") {
                const PrefixEmbed = new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle("ロールの接頭辞設定（キャンセル済み）")
                    .setDescription("変更はすべて破棄されました。");
                await interaction.editReply({ embeds: [PrefixEmbed], components: [] }).catch(() => { });
            } else {
                await RolePrefix.restore(initialPrefixList);
                const PrefixEmbed = new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle("ロールの接頭辞設定（タイムアウト）")
                    .setDescription("タイムアウトしたため、すべての変更を破棄して終了しました。");
                await interaction.editReply({ embeds: [PrefixEmbed], components: [] }).catch(() => { });
            }
        });
    },
};
