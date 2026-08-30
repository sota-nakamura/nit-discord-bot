const { EmbedBuilder, MessageFlags } = require("discord.js");
const LoLAccount = require("../../models/LoLAccount");

async function executeLol(interaction) {
    const target = interaction.options.getUser("user");
    let embed;

    if (!target) {
        // show list of all lol accounts
        const accounts = await LoLAccount.getAll();
        embed = new EmbedBuilder()
            .setTitle("Riot ID一覧")
            .setDescription("現在登録されているRiot IDの一覧です。")
            .setColor(0x0099ff)
            .addFields(
                accounts.map(account => ({
                    name: `user: ${interaction.client.users.cache.get(account.discord_user_id).displayName}`,
                    value: `${account.riot_id_name}#${account.riot_id_tag}`
                }))
            );
    } else {
        // show lol account of specified user
        const account = await LoLAccount.get(target.id);
        embed = new EmbedBuilder()
            .setTitle("Riot ID")
            .setDescription("現在登録されているRiot IDの一覧です。")
            .setColor(0x0099ff)
            .addFields(
                {
                    name: `user: ${interaction.client.users.cache.get(account.discord_user_id).displayName}`,
                    value: `${account.riot_id_name}#${account.riot_id_tag}`
                }
            );
    }

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

module.exports = { executeLol };
