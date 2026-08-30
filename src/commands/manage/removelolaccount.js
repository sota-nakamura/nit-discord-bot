const {
    MessageFlags,
    ContainerBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require("discord.js");
const LoLAccount = require("../../models/LoLAccount");

async function executeRemoveLolAcc(interaction) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const user = interaction.options.getUser("user");
    const account = await LoLAccount.get(user.id);

    if (!account) {
        return interaction.editReply({
            content: "そのユーザーにはlolアカウントが登録されていません。"
        });
    }

    if (account.length === 1) {
        // delete if registered account is not multiple
        await LoLAccount.unregister(account[0].puuid);
        await interaction.editReply({
            content: `**${user.username}** のlolアカウントを削除しました。`
        });
    } else {
        // send select menu to dm if multiple accounts are registered
        const accountSelect = new ContainerBuilder()
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`remove-lol-acc-${user.id}`)
                        .setPlaceholder("削除するアカウントを選択してください")
                        .addOptions(
                            ...account.map(acc => ({
                                label: `${acc.riot_id_name}#${acc.riot_id_tag}`,
                                value: acc.id
                            }))
                        )
                )
            );

        await interaction.editReply({
            content: "LoLアカウントを選択するメニューをDMに送信しました。ご確認ください。"
        });
        await interaction.user.send({
            content: `**${user.username}** のlolアカウントを選択してください。`,
            components: [accountSelect]
        });

        const collector = interaction.user.createMessageComponentCollector({
            time: 60000
        });

        collector.on("collect", async i => {
            const puuid = account.find(acc => acc.id === i.values[0]).puuid;
            await LoLAccount.unregister(puuid);
            await i.update({
                content: `**${user.username}** のlolアカウントを削除しました。`,
                components: []
            });
        });

        collector.on("end", async collected => {
            if (collected.size === 0) {
                await interaction.user.send({
                    content: `**${user.username}** のlolアカウントの登録解除はキャンセルされました。`
                });
            }
        });
    }

    console.log(`[INFO] ${user.username}がRiot IDの登録を解除しました。`);
}

module.exports = { executeRemoveLolAcc };
