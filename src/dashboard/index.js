const express = require("express");
const path = require("path");
const createDashboardRouter = require("./routes");
const os = require("os");

/**
 * Expressダッシュボードサーバーのセットアップと起動
 * @param {import("discord.js").Client} client Discord Bot Client
 * @param {number|string} port ポート番号
 * @returns {import("http").Server} HTTP Server インスタンス
 */
function startDashboard(client, port = process.env.PORT || 3000, onListening) {
    const app = express();

    // EJS テンプレートエンジンの設定
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    // ミドルウェア
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 静的ファイルの配信 (CSS, JS, 画像など)
    app.use(express.static(path.join(__dirname, "public")));

    // 既存の keep-alive 互換用 (ルートへのPOSTリクエスト等)
    app.use((req, res, next) => {
        if (req.method === "POST" && req.body?.type === "wake") {
            console.log("[DASHBOARD] Woke up in post root");
            return res.send("OK");
        }
        next();
    });

    // ルーティング
    app.use("/", createDashboardRouter(client));

    // サーバー起動
    const server = app.listen(port, () => {
        console.log(`[DASHBOARD] Express Web Dashboard is running on port ${port}`);
        if (typeof onListening === "function") {
            onListening(server);
        }
    });

    return server;
}

module.exports = { startDashboard };
