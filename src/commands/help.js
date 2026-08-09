const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Embed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("ヘルプメニューを表示する"),
    async execute(interaction) {
        const helpEmbed1 = new EmbedBuilder()
            .setTitle("ヘルプ - プレフィックス関連 (1/5)")
            .setDescription("ロールごとの名前の先頭につくテキストを管理するコマンド")
            .addFields(
                { name: "</prefix:1500799219273826407>", value: "ロールに接頭辞を設定する" }
            )
            .setColor(0x0099FF);

        const helpEmbed2 = new EmbedBuilder()
            .setTitle("ヘルプ - ユーザー情報取得関連 (2/5)")
            .setDescription("ユーザーの情報を取得するコマンド(ユーザー名を右クリックして利用できます)")
            .addFields(
                { name: "ユーザーの情報を取得する", value: "ユーザーの情報を取得する" }
            )
            .setColor(0x0099FF);

        const helpEmbed3 = new EmbedBuilder()
            .setTitle("ヘルプ - League of Legends 関連 (3/5)")
            .setDescription("League of Legends 関連のコマンド")
            .addFields(
                { name: "</lol register:1524315070497296449>", value: "Riot IDを連携する" },
                { name: "</lol unregister:1524315070497296449>", value: "Riot IDの連携を解除する" },
                { name: "</lol status:1524315070497296449>", value: "現在の試合状況を取得する" }
            )
            .setColor(0x0099FF);

        const helpEmbed4 = new EmbedBuilder()
            .setTitle("ヘルプ - リマインダー関連 (4/5)")
            .setDescription("リマインダーを管理するコマンド")
            .addFields(
                { name: "</reminder add:1526457071829123153>", value: "リマインダーを追加する" },
                { name: "</reminder delete:1526457071829123153>", value: "リマインダーを削除する" },
                { name: "</reminder list:1526457071829123153>", value: "リマインダー一覧を表示する" }
            )
            .setColor(0x0099FF);

        const helpEmbed5 = new EmbedBuilder()
            .setTitle("ヘルプ -なりすまし関連 (5/5)")
            .setDescription("なりすまし関連のコマンド")
            .addFields(
                { name: "</impersonate:1526490201524801537>", value: "なりすましメッセージを送信する" }
            )
            .setColor(0x0099FF);
        const pages = [helpEmbed1, helpEmbed2, helpEmbed3, helpEmbed4, helpEmbed5];
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
