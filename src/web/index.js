const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors({
    origin: process.env.DASHBOARD_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        return next({
            status: 429,
            name: "TOO_MANY_REQUESTS",
            message: "リクエストが多すぎます。しばらく待ってから再試行してください。"
        });
    }
});

// APIルートにRate Limitを適用
app.use(apiLimiter);

app.get("/", (req, res) => {
    res.status(200).json({ message: "Discord Bot is Operating!" });
});

app.get("/auth", async (req, res, next) => {
    const code = req.query.code;
    if (!code) {
        return next({
            status: 400,
            name: "MISSING_PARAMETER",
            message: "認証コードが指定されていません。"
        });
    }

    console.log("[OAUTH] code received:", code);
    try {
        const response = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID_1,
                client_secret: process.env.CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: process.env.DASHBOARD_URL + "/auth"
            }),
        });
        const data = await response.json();
        console.log("[OAUTH] token response:", data);

        if (!response.ok) {
            return next({
                status: response.status,
                name: data.error || "OAUTH_ERROR",
                message: data.error_description || "アクセストークンの取得に失敗しました。"
            });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error("[OAUTH] token exchange error:", err);
        next({
            status: 500,
            name: "OAUTH_INTERNAL_SERVER_ERROR",
            message: "認証に失敗しました。"
        });
    }
});

// use middleware api/vc.js
app.use("/api/vc", require("./api/vc"));
app.use("/api/lolaccount", require("./api/lolaccount"));

// 404 Not Found もエラー処理ミドルウェアへ渡す
app.use((req, res, next) => {
    next({
        status: 404,
        name: "NOT_FOUND",
        message: "指定されたエンドポイントが見つかりません。"
    });
});

// 共通エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
    console.error("[API Error]:", err);
    const status = err.status || err.statusCode || 500;
    const errorName = err.error_name || err.name || "INTERNAL_SERVER_ERROR";
    const message = err.message || "サーバー内部でエラーが発生しました。";

    res.status(status).json({
        error_name: errorName,
        message
    });
});

module.exports = app;
