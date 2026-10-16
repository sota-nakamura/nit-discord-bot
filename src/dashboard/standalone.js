const { startDashboard } = require("./index");

// スタンドアロン実行用のモッククライアント
const mockClient = {
    isReady: () => true,
    user: {
        username: "NIT Discord Bot (Dev)",
        tag: "NITBot#1234",
        displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/0.png"
    },
    uptime: 125000,
    ws: { ping: 24 },
    guilds: {
        cache: new Map([["1", { name: "テストサーバー1" }], ["2", { name: "テストサーバー2" }]])
    },
    commands: new Map([
        ["music", { data: { name: "music", description: "音楽を再生・管理します" } }],
        ["reminder", { data: { name: "reminder", description: "リマインダーを設定します" } }],
        ["impersonate", { data: { name: "impersonate", description: "特定のユーザーの口調を真似て発言します" } }]
    ])
};

const port = process.env.PORT || 3000;
startDashboard(mockClient, port);
console.log(`[DEV] Standalone dashboard preview running at http://localhost:${port}`);
