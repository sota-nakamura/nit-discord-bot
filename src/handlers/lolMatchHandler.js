const { getChampionData, getLatestMatchStats, getDeepLoLAIScore, getQueueName } = require("../utils/riotApi");
const { createLoLActiveGameEmbed, createLoLMatchResultEmbed } = require("../utils/embed");
const dayjs = require("dayjs");

const activeGames = new Map();

function loadLoLMatchHandler(client) {
    const channelId = process.env.LOL_CHANNEL_ID;
    if (!channelId) {
        return;
    }

    client.on("lolMatchStart", async (account, gameData, isFirstRun = false) => {
        const userId = account.discord_user_id;
        const puuid = account.puuid;
        if (activeGames.has(puuid)) return;
        let gameMode;
        let startTime = Date.now();
        let matchId = null;
        let champData = null;
        let version = "16.13.1";

        // If account is linked, fetch details from Riot API
        if (account) {
            try {
                if (gameData) {
                    matchId = gameData.matchId;
                    version = gameData.version;
                    if (gameData.championId) {
                        champData = await getChampionData(gameData.championId);
                    }
                    gameMode = getQueueName(gameData.gameQueueConfigId, gameData.gameMode);
                    if (gameData.startTime > 0) {
                        startTime = gameData.startTime;
                    }
                    activeGames.set(puuid, {
                        matchId,
                        version,
                        puuid,
                        championId: gameData.championId,
                        champion: champData,
                        lastKda: null,
                        details: gameMode,
                        startTime
                    });
                } else {
                    activeGames.delete(puuid);
                    return;
                }
            } catch (error) {
                console.error("Error fetching live game from Riot API in lolMatchStart:", error);
                activeGames.delete(puuid);
                return;
            }
        }
        if (isFirstRun) return;
        if (activeGames.has(puuid)) {
            const channel = await client.channels.fetch(channelId).catch(console.error);
            if (!channel) return;

            const user = await client.users.fetch(userId).catch(() => null);
            const embed = createLoLActiveGameEmbed({
                account,
                user,
                title: "League of Legends 試合開始",
                description: `<@${userId}> (**${account.riot_id_name}#${account.riot_id_tag}**) がLoLの試合を開始しました！`,
                champData,
                gameMode,
                startTime,
                version
            });

            await channel.send({ embeds: [embed] }).catch(console.error);
        }
    });

    client.on("lolMatchEnd", async (account) => {
        const userId = account.discord_user_id;
        const puuid = account.puuid;
        const gameInfo = activeGames.get(puuid);
        if (!gameInfo) return;
        activeGames.delete(puuid);

        setTimeout(async () => {
            let finalKda = gameInfo.lastKda;
            const champData = gameInfo.champion;
            let winStatus = null; // win, lose, or null (unknown)
            let actualGameMode = gameInfo.details;
            let killParticipation = null;
            let gameDuration = dayjs(Date.now() - gameInfo.startTime).format("mm:ss");
            let version = gameInfo.version || "16.13.1";

            if (gameInfo.puuid) {
                try {
                    const matchStats = await getLatestMatchStats(gameInfo.puuid);
                    if (matchStats && (!gameInfo.matchId || matchStats.matchId === gameInfo.matchId)) {
                        finalKda = matchStats.kda;
                        winStatus = matchStats.win;
                        actualGameMode = matchStats.gameMode;
                        killParticipation = matchStats.killParticipation;
                        if (matchStats.gameDuration) {
                            gameDuration = matchStats.gameDuration;
                        }
                        if (matchStats.version) {
                            version = matchStats.version;
                        }
                    }
                } catch (error) {
                    console.error("Error fetching match stats from Riot API:", error);
                }
            }

            const aiScore = await getDeepLoLAIScore(gameInfo.matchId, account, gameInfo.championId);

            const channel = await client.channels.fetch(channelId).catch(console.error);
            if (!channel) return;

            const user = await client.users.fetch(userId).catch(() => null);
            const embed = createLoLMatchResultEmbed({
                account,
                user,
                title: `${account.riot_id_name}#${account.riot_id_tag} のLoLの試合が終了しました。`,
                matchId: gameInfo.matchId,
                winStatus,
                gameMode: actualGameMode,
                champData,
                kda: finalKda,
                aiScore,
                gameDuration,
                killParticipation,
                version
            });

            await channel.send({ embeds: [embed] }).catch(console.error);
        }, 15000);
    });
}

module.exports = { loadLoLMatchHandler, activeGames };

