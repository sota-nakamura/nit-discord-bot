const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, RoleSelectMenuBuilder } = require("discord.js");
const RolePrefix = require("../models/RolePrefix");

class Prefix {
    constructor(prefixList, client) {
        this.prefixList = prefixList || [];
        this.client = client;
    }

    async apply(guild) {
        if (!guild) return 0;

        // Fetch all roles to get their positions
        const allRoles = await guild.roles.fetch();

        // Sort prefixes by role position descending
        const sortedPrefixes = this.prefixList
            .map(p => {
                const role = allRoles.get(p.role_id);
                return { ...p, position: role ? role.position : -1 };
            })
            .sort((a, b) => b.position - a.position);

        const members = await guild.members.fetch();
        let updateCount = 0;

        for (const member of members.values()) {
            // Find the first (highest position) role in sortedPrefixes that the member has
            const prefixData = sortedPrefixes.find(p => member.roles.cache.has(p.role_id));

            if (prefixData) {
                const prefix = prefixData.prefix;
                // Strip any existing prefix in brackets (e.g., "[Prefix] Name" or "[Prefix]Name")
                const baseName = (member.nickname || member.user.displayName).replace(/^\[[^\]]+\]\s*/, "");
                const targetNickname = `[${prefix}]${baseName}`.slice(0, 32);

                if (member.nickname !== targetNickname) {
                    if (member.manageable || member.id === this.client.user.id) {
                        try {
                            await member.setNickname(targetNickname);
                            updateCount++;
                        } catch (error) {
                            if (error.code === 50013) {
                                console.error(`このユーザーのニックネーム変更権限がありません: ${member.user.username}`, error);
                            } else {
                                console.error(`ニックネームの変更に失敗しました: ${member.user.username}`, error);
                            }
                        }
                    }
                }
            } else {
                // If member doesn't have any roles with prefixes, remove any existing brackets-based prefix
                if (member.nickname && member.nickname.startsWith("[")) {
                    // Extract name without prefix
                    const baseName = member.nickname.replace(/^\[[^\]]+\]\s*/, "");
                    const finalNickname = (baseName === member.user.displayName) ? null : baseName;

                    if (member.nickname !== finalNickname) {
                        if (member.manageable || member.id === this.client.user.id) {
                            try {
                                await member.setNickname(finalNickname);
                                updateCount++;
                            } catch (error) {
                                if (error.code === 50013) {
                                    console.error(`このユーザーのニックネーム変更権限がありません: ${member.user.username}`, error);
                                } else {
                                    console.error(`ニックネームの変更に失敗しました: ${member.user.username}`, error);
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log(`[INFO] Prefix apply finished: updated ${updateCount} member nicknames.`);
        return updateCount;
    }

    static createAddPrefixModal() {
        const modal = new ModalBuilder()
            .setCustomId("modal_addPrefix")
            .setTitle("ロールの接頭辞設定");

        const prefixInput = new TextInputBuilder()
            .setCustomId("prefix")
            .setStyle(TextInputStyle.Short)
            .setMinLength(0)
            .setMaxLength(10)
            .setRequired(true);
        const prefixInputLabel = new LabelBuilder()
            .setLabel("接頭辞")
            .setDescription("ロールの接頭辞に設定するテキストを入力(10文字以下)")
            .setTextInputComponent(prefixInput);

        const roleInput = new RoleSelectMenuBuilder()
            .setCustomId("role")
            .setRequired(true)
            .setMaxValues(1)
            .setMinValues(1);
        const roleInputLabel = new LabelBuilder()
            .setLabel("ロールを選択")
            .setRoleSelectMenuComponent(roleInput);

        modal.addLabelComponents(roleInputLabel, prefixInputLabel);

        return modal;
    }

    static createRemovePrefixModal() {
        const modal = new ModalBuilder()
            .setCustomId("modal_removePrefix")
            .setTitle("ロールの接頭辞設定");

        const roleInput = new RoleSelectMenuBuilder()
            .setCustomId("role")
            .setRequired(true)
            .setMaxValues(1)
            .setMinValues(1);
        const roleInputLabel = new LabelBuilder()
            .setLabel("ロールを選択")
            .setRoleSelectMenuComponent(roleInput);

        modal.addLabelComponents(roleInputLabel);

        return modal;
    }
}

module.exports = Prefix;