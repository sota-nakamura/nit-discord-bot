const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require('discord.js');
const RolePrefix = require('../models/RolePrefix');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('ロールごとに名前の先頭につくテキストを管理します')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('ロールに接頭辞を設定します')
                .addStringOption(option =>
                    option.setName('prefix')
                        .setDescription('設定するテキスト')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('接頭辞を設定するロール')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('ロールの接頭辞を削除します')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('接頭辞を削除するロール')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('ロールの接頭辞一覧を表示します')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('apply')
                .setDescription('ロールの接頭辞を適用し直します')
        ),
    async execute(interaction) {
        // check permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'このコマンドを実行する権限がありません。', flags: MessageFlags.Ephemeral });
        }

        if (interaction.options.getSubcommand() === 'add') {
            const prefix = interaction.options.getString('prefix');
            const role = interaction.options.getRole('role');

            // update or insert in database via model
            RolePrefix.set(role.id, prefix);

            interaction.reply({ content: `ロール **${role.name}** の接頭辞を **${prefix}** に設定しました。`, flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommand() === 'remove') {
            const role = interaction.options.getRole('role');

            // update or insert in database via model
            RolePrefix.remove(role.id);

            interaction.reply({ content: `ロール **${role.name}** の接頭辞を削除しました。`, flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommand() === 'list') {
            const prefixes = RolePrefix.getAll();
            const embed = new EmbedBuilder()
                .setTitle('ロールの接頭辞一覧')
                .setColor('#0099ff');
            prefixes.forEach(prefix => {
                embed.addFields({ name: prefix.role_id, value: prefix.prefix });
            });
            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else if (interaction.options.getSubcommand() === 'apply') {
            const prefixes = RolePrefix.getAll();
            const guild = interaction.guild;
            let updateCount = 0;
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const members = await guild.members.fetch();
            for (const member of members) {
                const role = member.roles.highest;
                const prefixData = prefixes.find(p => p.role_id === role.id);
                if (prefixData) {
                    const prefix = prefixData.prefix;
                    try {
                        await member.setNickname(`[${prefix}]${member.user.username}`);
                        updateCount++;
                    } catch (error) {
                        console.error('Failed to set nickname for member:', member.user.username, error);
                    }
                }
            }
            await interaction.editReply({ content: `${updateCount} 人のユーザーにロールの接頭辞を適用しました。` });
        }
    },
};
