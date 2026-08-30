const { EmbedBuilder, MessageFlags } = require("discord.js");
const LoLAccount = require("../../models/LoLAccount");
const { getPuuid } = require("../../utils/riotApi");

async function executeAddLolAcc(interaction) {
    await interaction.deferReply({
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
    });

    const name = interaction.options.getString("name");
    const tag = interaction.options.getString("tag");
    const user = interaction.options.getUser("user");

    const puuid = await getPuuid(name, tag);
    if (!puuid) {
        return interaction.editReply({
            content: "Riot ID が見つかりませんでした。"
        });
    }

    await LoLAccount.register(user.id, name, tag, puuid);

    const embed = new EmbedBuilder()
        .setTitle("Riot ID 連携完了")
        .setDescription(`**${user.username}** に Riot ID を連携しました。`)
        .addFields(
            { name: "Riot ID", value: `${name}#${tag}`, inline: true },
            { name: "PUUID", value: `\`${puuid.substring(0, 8)}...\``, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

    console.log(`[INFO] ${user.username}が登録完了しました。Riot ID: ${name}#${tag} PUUID: ${puuid.substring(0, 8)}...`);
    await interaction.editReply({ embeds: [embed] });
}

module.exports = { executeAddLolAcc };
