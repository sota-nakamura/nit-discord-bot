const {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    EmbedBuilder,
    MessageFlags
} = require("discord.js");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName("ユーザーの情報を取得する")
        .setType(ApplicationCommandType.User),
    async execute(interaction) {
        const targetMember = interaction.targetMember;
        const targetUser = interaction.targetUser;
        if (!targetMember) {
            const userEmbed = new EmbedBuilder()
                .setTitle("ユーザー情報")
                .addFields(
                    { name: "ユーザー名", value: targetUser.username },
                    { name: "ID", value: targetUser.id },
                )
                .setColor(0x0099FF)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

            return await interaction.reply({ embeds: [userEmbed], flags: [MessageFlags.Ephemeral] });
        }

        const roles = targetMember.roles.cache
            .filter(role => role.name !== "@everyone")
            .map(role => `<@&${role.id}>`)
            .join(", ");

        const rolesDisplay = roles.length > 1024 ? roles.slice(0, 1020) + "..." : (roles || "なし");
        const nicknameDisplay = targetMember.nickname || "設定されていません";

        const userEmbed = new EmbedBuilder()
            .setTitle("ユーザー情報")
            .addFields(
                { name: "ユーザー名", value: targetMember.user.username },
                { name: "表示名", value: targetMember.displayName || targetMember.user.displayName },
                { name: "ID", value: targetMember.id },
                { name: "ニックネーム", value: nicknameDisplay },
                { name: "ロール", value: rolesDisplay },
            )
            .setColor(0x0099FF)
            .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }));

        await interaction.reply({ embeds: [userEmbed], flags: [MessageFlags.Ephemeral] });
    },
};
