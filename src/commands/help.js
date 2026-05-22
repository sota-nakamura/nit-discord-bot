const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("ヘルプメニューを表示する"),
    async execute(interaction) {
        const helpEmbed1 = new EmbedBuilder()
            .setTitle("ヘルプ - プレフィックス関連 (1/2)")
            .setDescription("ロールごとの名前の先頭につくテキストを管理するコマンド")
            .addFields(
                { name: "/prefix add", value: "ロールに接頭辞を設定する" },
                { name: "/prefix remove", value: "ロールの接頭辞を削除する" },
                { name: "/prefix list", value: "ロールの接頭辞一覧を表示する" },
                { name: "/prefix apply", value: "ロールの接頭辞を適用し直す" }
            )
            .setColor(0x0099FF);

        const helpEmbed2 = new EmbedBuilder()
            .setTitle("ヘルプ - ユーザー情報取得関連 (2/2)")
            .setDescription("ユーザーの情報を取得するコマンド(ユーザー名を右クリックして利用できます)")
            .addFields(
                { name: "ユーザーの情報を取得する", value: "ユーザーの情報を取得する" }
            )
            .setColor(0x0099FF);
        const pages = [helpEmbed1, helpEmbed2];
        let currentPage = 0;

        // ページに応じたボタン行を生成する関数
        const getRow = (index) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("prev_page")
                    .setEmoji("◀")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index === 0),
                new ButtonBuilder()
                    .setCustomId("page_number")
                    .setLabel(`${index + 1} / ${pages.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("next_page")
                    .setEmoji("▶")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(index === pages.length - 1)
            );
        };

        const response = await interaction.reply({
            embeds: [pages[currentPage]],
            components: [getRow(currentPage)],
            withResponse: true
        });

        const collector = response.resource.message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
            time: 600000
        });

        collector.on("collect", async (i) => {

            if (i.customId === "prev_page") {
                currentPage--;
            } else if (i.customId === "next_page") {
                currentPage++;
            }

            await i.update({
                embeds: [pages[currentPage]],
                components: [getRow(currentPage)]
            });
        });

        collector.on("end", () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("prev_page")
                    .setEmoji("◀")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("page_number")
                    .setLabel(`${currentPage + 1} / ${pages.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("next_page")
                    .setEmoji("▶")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(index === pages.length - 1)
                    .setDisabled(true)
            );
            interaction.editReply({ components: [disabledRow] }).catch(() => { });
        });
    },
};
