const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.get("/", (req, res) => {
    res.status(200).json({ message: "Discord Bot is Operating!" });
});

app.get("/auth", async (req, res) => {
    const code = req.query.code;
    console.log(code);
    const response = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: process.env.CLIENT_ID_1,
            client_secret: process.env.TOKEN_1,
            code,
            redirect_uri: "http://localhost:5173/auth",
            grant_type: "authorization_code",
            scope: "identify email"
        }),
    });
    const data = await response.json();
    console.log(data);
    res.status(200).json({ code });
});

module.exports = app;