const { Events, EmbedBuilder } = require("discord.js");
const LoLAccount = require("../models/LoLAccount");
const LoLNotification = require("../models/LoLNotification");
const { getActiveGame, getLatestMatchStats, getChampionData } = require("../utils/riotApi");
const activeGames = new Map();

module.exports = {
    name: Events.PresenceUpdate,
    async execute(oldPresence, newPresence) {
        if (newPresence?.user?.bot) return;

        const member = newPresence?.member || oldPresence?.member;
        if (!member) return;

        const guild = newPresence?.guild || oldPresence?.guild;
        if (!guild) return;

        const oldLolActivity = oldPresence?.activities?.find(a => a.applicationId === "401518684763586560" || a.applicationId === "1402418696126992445" || a.name === "League of Legends");
        const newLolActivity = newPresence?.activities?.find(a => a.applicationId === "401518684763586560" || a.applicationId === "1402418696126992445" || a.name === "League of Legends");

        // Fetch notification channel
        const channelId = process.env.LOL_CHANNEL_ID;
        if (!channelId) {
            return;
        }

        const channel = await guild.channels.fetch(channelId);

        // Check if user has linked Riot Account
        const account = await LoLAccount.get(member.id);

        // Case 1: Started playing a game
        if (newLolActivity && !activeGames.has(member.id)) {
            let gameMode;
            let startTime = Date.now();
            let matchId = null;
            let champData = null;

            // If account is linked, fetch details from Riot API
            if (account) {
                try {
                    const apiGame = await getActiveGame(account.puuid);
                    if (apiGame) {
                        matchId = apiGame.matchId;
                        version = apiGame.version
                        if (apiGame.championId) {
                            champData = await getChampionData(apiGame.championId);
                        }
                        if (apiGame.gameMode) {
                            gameMode = `In-Game (${apiGame.gameMode})`;
                        }
                        if (apiGame.startTime > 0) {
                            startTime = apiGame.startTime;
                        }
                        activeGames.set(member.id, {
                            matchId,
                            puuid: account?.puuid || null,
                            champion: champData,
                            lastKda: null,
                            details: gameMode,
                            startTime
                        });
                    } else {
                        activeGames.delete(member.id);
                        return;
                    }
                } catch (error) {
                    console.error("Error fetching live game from Riot API in presenceUpdate:", error);
                    activeGames.delete(member.id);
                    return;
                }
            }
            if (activeGames.has(member.id)) {
                const embed = new EmbedBuilder()
                    .setTitle("🎮 League of Legends 試合開始")
                    .setDescription(`${member} がLoLの試合を開始しました！`)
                    .setColor(0x0099ff)
                    .addFields(
                        { name: "使用チャンピオン", value: champData.name, inline: true },
                        { name: "ゲームモード", value: gameMode, inline: true }
                    )
                    .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champData.image.full}`)
                    .setTimestamp();

                if (startTime > 0) {
                    embed.addFields({ name: "開始時間", value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true });
                }

                await channel.send({ embeds: [embed] }).catch(console.error);
            }
        }
        else if (!newLolActivity && activeGames.has(member.id)) {
            const gameInfo = activeGames.get(member.id);
            activeGames.delete(member.id);
            setTimeout(async () => {
                let finalKda = gameInfo.lastKda;
                let championName = gameInfo.champion.name;
                let winStatus = null; // win, lose, or null (unknown)
                let actualGameMode = gameInfo.details;
                let killParticipation = null;

                if (gameInfo.puuid) {
                    try {
                        const matchStats = await getLatestMatchStats(gameInfo.puuid);
                        if (matchStats) {
                            finalKda = matchStats.kda;
                            championName = matchStats.championName;
                            winStatus = matchStats.win;
                            actualGameMode = matchStats.gameMode;
                            killParticipation = matchStats.killParticipation;
                        }
                    } catch (error) {
                        console.error("Error fetching match stats from Riot API:", error);
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle(`${member} のLoLの試合が終了しました。`)
                    .setURL(`https://www.deeplol.gg/summoner/jp/${account.riot_id_name}-${account.riot_id_tag}/matches/${gameInfo.matchId}`)
                    .setDescription("タイトルをクリックしてDeepLOLの試合分析を確認できます！")
                    .setColor(winStatus ? "Green" : "Orange" || "Blue")
                    .addFields(
                        { name: "結果", value: winStatus ? "勝利" : "敗北" || "不明", inline: true },
                        { name: "ゲームモード", value: actualGameMode || "不明", inline: true },
                        { name: "チャンピオン", value: championName || "不明", inline: true },
                        { name: "KDA", value: finalKda || "不明", inline: true }
                    )
                    .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/16.13.1/img/champion/${champName}.png`);
                if (killParticipation !== null) {
                    embed.addFields({ name: "キル関与率", value: `${killParticipation}%`, inline: true });
                }

                embed.setTimestamp();

                await channel.send({ embeds: [embed] }).catch(console.error);
            }, 15000);
        }
    }
};
