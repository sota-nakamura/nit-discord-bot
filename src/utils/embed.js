const { EmbedBuilder } = require("discord.js");

function createErrorEmbed(description, error = null) {
    const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("エラーが発生しました")
        .setDescription(description);
    if (error) embed.addFields({ name: "エラー", value: error });
    return embed;
}

function createInfoEmbed(description) {
    return new EmbedBuilder()
        .setColor("Blue")
        .setDescription(description);
}

function createLoLActiveGameEmbed({ account, user = null, title = null, description = null, champData, gameMode, startTime, version }) {
    const embed = new EmbedBuilder()
        .setTitle(title || "League of Legends 試合開始")
        .setDescription(description || `**${account.riot_id_name}#${account.riot_id_tag}** は現在試合中です！`)
        .setColor(0x0099ff)
        .addFields(
            { name: "使用チャンピオン", value: champData?.name || "不明", inline: true },
            { name: "ゲームモード", value: gameMode || "不明", inline: true }
        )
        .setTimestamp();

    if (user) {
        embed.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
    }
    if (champData?.image?.full) {
        embed.setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${version || "16.13.1"}/img/champion/${champData.image.full}`);
    }
    if (startTime > 0) {
        embed.addFields({ name: "開始時間", value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true });
    }
    return embed;
}

function createLoLMatchResultEmbed({ account, user = null, title = null, matchId, winStatus, gameMode, champData, kda, aiScore, gameDuration, killParticipation = null, version }) {
    const resultText = winStatus === true ? "勝利" : winStatus === false ? "敗北" : "不明";
    const resultColor = winStatus === true ? "Green" : winStatus === false ? "Orange" : "Blue";

    let durationStr = "不明";
    if (typeof gameDuration === "number" && gameDuration > 0) {
        const mins = String(Math.floor(gameDuration / 60)).padStart(2, "0");
        const secs = String(gameDuration % 60).padStart(2, "0");
        durationStr = `${mins}:${secs}`;
    } else if (typeof gameDuration === "string" && gameDuration) {
        durationStr = gameDuration;
    }

    const embed = new EmbedBuilder()
        .setTitle(title || `**${account.riot_id_name}#${account.riot_id_tag}** のLoLの試合が終了しました。`)
        .setDescription("タイトルをクリックしてDeepLOLの試合分析を確認できます！")
        .setColor(resultColor)
        .addFields(
            { name: "チャンピオン", value: champData?.name || "不明", inline: true },
            { name: "ゲームモード", value: gameMode || "不明", inline: true },
            { name: "KDA", value: kda || "不明", inline: true },
            { name: "AIスコア", value: aiScore != null ? `${aiScore}` : "不明", inline: true }
        )
        .setFooter({
            text: `試合結果: ${resultText} ｜ 試合時間: ${durationStr} ｜ キル関与率: ${killParticipation}%`
        })
        .setTimestamp();
    if (user) {
        embed.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
    }
    if (matchId) {
        embed.setURL(`https://www.deeplol.gg/summoner/jp/${encodeURIComponent(account.riot_id_name)}-${encodeURIComponent(account.riot_id_tag)}/matches/${matchId}`);
    }
    if (champData?.image?.full) {
        embed.setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${version || "16.13.1"}/img/champion/${champData.image.full}`);
    }

    return embed;
}

module.exports = {
    createErrorEmbed,
    createInfoEmbed,
    createLoLActiveGameEmbed,
    createLoLMatchResultEmbed
};