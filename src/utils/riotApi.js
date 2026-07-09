const { RiotAPI, RiotAPITypes, PlatformId } = require("@fightmegg/riot-api");
let championMap = null;

const config = {
    debug: false,
    cache: {
        cacheType: "local",
        ttls: {
            byMethod: {
                [RiotAPITypes.METHOD_KEY.SUMMONER.GET_BY_SUMMONER_NAME]: 5000, // ms
            },
        },
    },
};

if (!process.env.RIOT_API_KEY) {
    console.warn("[WARNING] RIOT_API_KEY is not defined in .env file.");
}

const rAPI = new RiotAPI(process.env.RIOT_API_KEY, config);

async function getPuuid(gameName, tagLine) {
    const account = await rAPI.account.getByRiotId({
        region: "asia",
        gameName: gameName.trim(),
        tagLine: tagLine.trim()
    });
    return account.puuid;
}

async function getSummonerId(puuid) {
    const account = await rAPI.account.getByPUUID({
        region: "asia",
        puuid
    });
    console.log(account)
    return account.gameName;
}


async function refreshPuuidIfNeeded(puuid) {
    try {
        const db = require("../models/Database");
        const LoLAccount = require("../models/LoLAccount");
        const account = db.prepare("SELECT * FROM lol_accounts WHERE puuid = ?").get(puuid);
        if (account) {
            console.log(`[INFO] Attempting to refresh PUUID for ${account.riot_id_name}#${account.riot_id_tag} due to key change.`);
            const newPuuid = await getPuuid(account.riot_id_name, account.riot_id_tag);
            if (newPuuid && newPuuid !== puuid) {
                LoLAccount.register(account.discord_user_id, account.riot_id_name, account.riot_id_tag, newPuuid);
                console.log(`[INFO] Successfully refreshed PUUID for ${account.riot_id_name}#${account.riot_id_tag}: ${puuid.substring(0, 8)}... -> ${newPuuid.substring(0, 8)}...`);
                return newPuuid;
            }
        }
    } catch (err) {
        console.error("[ERROR] Failed to refresh PUUID:", err);
    }
    return null;
}

async function getActiveGame(puuid) {
    try {
        const game = await rAPI.spectator.getBySummonerId({
            region: "jp1",
            summonerId: puuid
        })

        // Find user participant to get their selected champion
        const participant = game.participants.find(p => p.puuid === puuid);

        // Translate champion ID if possible (fallback to ID)
        // Data Dragon or mapping can be used, but Champion ID is returned by Riot API
        const championId = participant ? participant.championId : null;

        return {
            matchId: game.gameId,
            gameMode: game.gameMode,
            gameQueueConfigId: game.gameQueueConfigId,
            championId: championId,
            startTime: game.gameStartTime,
            version: await getVersion()
        };
    } catch (e) {
        if (e.status === 400 || e.statusCode === 400) {
            const newPuuid = await refreshPuuidIfNeeded(puuid);
            if (newPuuid) {
                return getActiveGame(newPuuid);
            }
        }
        // If not in game, Riot API returns 404
        if (e.status === 404 || e.statusCode === 404) {
            return null;
        }
        throw e;
    }
}

function getQueueName(queueId, gameMode) {
    const queueMap = {
        400: "ノーマル (ドラフト)",
        420: "ランク (ソロ/デュオ)",
        430: "ノーマル (ブラインド)",
        440: "ランク (フレックス)",
        450: "ARAM",
        700: "Clash",
        830: "AI戦 (入門)",
        840: "AI戦 (初級)",
        850: "AI戦 (中級)",
        900: "URF",
        1020: "ワン・フォー・オール",
        1300: "ネクサスブリッツ",
        1400: "アルティメット・スペルブック",
        1700: "アリーナ",
        1900: "URF"
    };
    return queueMap[queueId] || gameMode || "不明";
}

async function getLatestMatchStats(puuid) {
    try {
        const matchIds = await rAPI.matchV5.getIdsByPuuid({
            cluster: "asia",
            puuid,
            params: {
                count: 1
            }
        });

        if (!matchIds || matchIds.length === 0) return null;

        const matchId = matchIds[0];
        const match = await rAPI.matchV5.getMatchById({
            cluster: "asia",
            matchId
        });

        const participant = match.info.participants.find(p => p.puuid === puuid);
        if (!participant) return null;

        const teamId = participant.teamId;
        const teamParticipants = match.info.participants.filter(p => p.teamId === teamId);
        const totalTeamKills = teamParticipants.reduce((sum, p) => sum + p.kills, 0);

        const killParticipation = totalTeamKills > 0
            ? ((participant.kills + participant.assists) / totalTeamKills) * 100
            : 0;

        return {
            matchId,
            gameMode: getQueueName(match.info.queueId, match.info.gameMode),
            championId: participant.championId,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            win: participant.win,
            gameDuration: match.info.gameDuration,
            kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
            killParticipation: Math.min(100.0, parseFloat(killParticipation.toFixed(1))),
            version: await getVersion()
        };
    } catch (e) {
        if (e.status === 400 || e.statusCode === 400) {
            const newPuuid = await refreshPuuidIfNeeded(puuid);
            if (newPuuid) {
                return getLatestMatchStats(newPuuid);
            }
        }
        console.error("Error fetching match stats:", e);
        return null;
    }
}

async function getVersion() {
    const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = await versionRes.json();
    return versions[0];
}
async function getChampionData(championId) {
    try {
        if (!championMap) {
            const latestVersion = await getVersion();
            const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/ja_JP/champion.json`);
            const champData = await champRes.json();

            championMap = new Map();
            for (const key in champData.data) {
                const champ = champData.data[key];
                championMap.set(Number(champ.key), champ);
            }
        }
        return championMap.get(Number(championId)) || `Champion ${championId}`;
    } catch (e) {
        console.error("Error fetching champion name from Data Dragon:", e);
        return `Champion ${championId}`;
    }
}

module.exports = {
    rAPI,
    getPuuid,
    getSummonerId,
    getActiveGame,
    getLatestMatchStats,
    getChampionData
};