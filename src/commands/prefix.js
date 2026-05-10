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
        const subcommand = interaction.options.getSubcommand();
        // check permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'このコマンドを実行する権限がありません。', flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'add') {
            const prefix = interaction.options.getString('prefix');
            const role = interaction.options.getRole('role');

            // update or insert in database via model
            await RolePrefix.set(role.id, prefix);

            interaction.reply({ content: `ロール **${role.name}** の接頭辞を **${prefix}** に設定しました。`, flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'remove') {
            const role = interaction.options.getRole('role');

            // update or insert in database via model
            await RolePrefix.remove(role.id);

            interaction.reply({ content: `ロール **${role.name}** の接頭辞を削除しました。`, flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'list') {
            const prefixes = await RolePrefix.getAll();
            const embed = new EmbedBuilder()
                .setTitle('ロールの接頭辞一覧')
                .setColor('#0099ff');
            const description = prefixes.map(prefix => `<@&${prefix.role_id}>: **${prefix.prefix}**\n`).join('');
            embed.setDescription(description === '' ? 'まだ設定されていません。' : description);
            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else if (subcommand === 'apply') {
            const prefixes = await RolePrefix.getAll();
            const guild = interaction.guild;
            let updateCount = 0;
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Fetch all roles to get their positions
            const allRoles = await guild.roles.fetch();
            
            // Sort prefixes by role position descending
            const sortedPrefixes = prefixes
                .map(p => {
                    const role = allRoles.get(p.role_id);
                    return { ...p, position: role ? role.position : -1 };
                })
                .sort((a, b) => b.position - a.position);

            const members = await guild.members.fetch();
            for (const member of members.values()) {
                // Find the first (highest position) role in sortedPrefixes that the member has
                const prefixData = sortedPrefixes.find(p => member.roles.cache.has(p.role_id));
                
                if (prefixData) {
                    const prefix = prefixData.prefix;
                    const targetNickname = `[${prefix}]${member.user.username}`.slice(0, 32);
                    
                    if (member.nickname !== targetNickname) {
                        try {
                            await member.setNickname(targetNickname);
                            updateCount++;
                        } catch (error) {
                            console.error('Failed to set nickname for member:', member.user.username, error);
                        }
                    }
                }
            }
            await interaction.editReply({ content: `${updateCount} 人のユーザーにロールの接頭辞を適用しました。` });
        }
    },
};
