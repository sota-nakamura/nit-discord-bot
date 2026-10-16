const express = require("express");
const router = express.Router();

/**
 * ダッシュボードのメインルーターを生成
 * @param {import("discord.js").Client} client 
 */
module.exports = function createDashboardRouter(client) {
    // トップページ (ダッシュボード)
    router.get("/", (req, res) => {
        const botUser = client?.user;
        const guilds = client?.guilds?.cache || [];
        const commands = client?.commands || new Map();

        // 稼働時間 (フォーマット)
        const uptimeSeconds = Math.floor((client?.uptime || 0) / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

        // コマンド一覧データ
        const commandList = Array.from(commands.values()).map(cmd => ({
            name: cmd.data?.name || "unknown",
            description: cmd.data?.description || "説明なし"
        }));

        res.render("index", {
            bot: {
                username: botUser?.username || "NIT Discord Bot",
                tag: botUser?.tag || "Bot#0000",
                avatarURL: botUser?.displayAvatarURL?.({ dynamic: true, size: 128 }) || null,
                status: client?.isReady?.() ? "Online" : "Connecting",
                ping: client?.ws?.ping ?? -1,
                uptime: uptimeString,
                guildCount: guilds.size ?? 0,
                commandCount: commands.size ?? 0
            },
            commands: commandList,
            title: "NIT Bot Dashboard"
        });
    });

    // API エンドポイント: BotステータスJSON
    router.get("/api/status", (req, res) => {
        res.json({
            status: client?.isReady?.() ? "online" : "connecting",
            ping: client?.ws?.ping ?? -1,
            uptime: client?.uptime ?? 0,
            guildCount: client?.guilds?.cache?.size ?? 0,
            commandCount: client?.commands?.size ?? 0
        });
    });

    // 既存の keep-alive 互換エンドポイント (POST /wake)
    router.post("/wake", (req, res) => {
        console.log("[DASHBOARD] Woke up in post /wake");
        res.status(200).send("Woke up");
    });

    return router;
};
