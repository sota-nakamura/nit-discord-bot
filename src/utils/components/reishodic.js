const {
    StringSelectMenuBuilder,
    LabelBuilder,
    ModalBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    EmbedBuilder,
    TextInputBuilder,
    TextInputStyle,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require("discord.js");

class ReishoDicEdit {
    static createActionSelectContainer() {
        return new ContainerBuilder()
            .setAccentColor(0x0099ff)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## :tools: 冷笑辞書の編集\n- 冷笑を検知する単語を編集します。\n- 実行する操作を選択してください。"
                    )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("edit_reisho_dic_action")
                            .setPlaceholder("操作を選択")
                            .setRequired(true)
                            .addOptions(
                                { label: "追加", value: "add" },
                                { label: "削除", value: "delete" },
                                { label: "編集", value: "edit" }
                            )
                    )
            );
    }

    static createDeleteSearchModal() {
        const wordInput = new TextInputBuilder()
            .setCustomId("delete_search_keyword")
            .setPlaceholder("検索キーワードを入力（空欄で全件表示）")
            .setRequired(false)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short);
        const wordLabel = new LabelBuilder()
            .setLabel("検索キーワード")
            .setTextInputComponent(wordInput);
        return new ModalBuilder()
            .setCustomId("reishoDicDeleteSearchModal")
            .setTitle("削除する単語を検索")
            .addLabelComponents(wordLabel);
    }

    static async createDeleteSelectContainer(results) {
        const select = new StringSelectMenuBuilder()
            .setCustomId("reisho_dic_delete_select")
            .setPlaceholder("削除する単語を選択（複数可）")
            .setMinValues(1)
            .setMaxValues(Math.min(results.length, 25))
            .setDisabled(results.length === 0)
            .addOptions(
                results.slice(0, 25).map(r => ({
                    label: r.content,
                    description: `種類: ${r.type}`,
                    value: `${r.type}::${r.content}`
                }))
            );
        const deleteButton = new ButtonBuilder()
            .setCustomId("reisho_dic_delete_confirm")
            .setLabel("選択した単語を削除")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(results.length === 0)
            .setEmoji("🗑️");
        const searchButton = new ButtonBuilder()
            .setCustomId("search_again")
            .setLabel("再検索")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔍");
        return new ContainerBuilder()
            .setAccentColor(0xff0000)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent("## :wastebasket: 削除する単語を選択")
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(results.length ?
                        `### 検索結果 \n **${results.length}件** の単語が見つかりました。\n ${results.map(r => `- **${r.content}** (${r.type})`).join("\n")}` :
                        "該当する単語はありません")
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(select)
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(deleteButton, searchButton)
            );
    }

    /**
     * 追加モーダル
     */
    static createAddModal() {
        const typeSelect = new StringSelectMenuBuilder()
            .setCustomId("phraseTypeSelect")
            .setPlaceholder("単語の種類を選択してください")
            .addOptions(
                { label: "検知するフレーズ（部分一致）", value: "add_phrase" },
                { label: "検知する単語（完全一致）", value: "add_single_word" }
            )
            .setRequired(true)
            .setMinValues(1)
            .setMaxValues(1);
        const typeSelectLabel = new LabelBuilder()
            .setLabel("単語の種類を選択してください")
            .setStringSelectMenuComponent(typeSelect);
        const wordInput = new TextInputBuilder()
            .setCustomId("wordInput")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const wordInputLabel = new LabelBuilder()
            .setLabel("単語を入力してください")
            .setTextInputComponent(wordInput);
        return new ModalBuilder()
            .setCustomId("reishoDicAddModal")
            .setTitle("冷笑を検知する単語を追加")
            .addLabelComponents(typeSelectLabel, wordInputLabel);
    }
}

module.exports = ReishoDicEdit;