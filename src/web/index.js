const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.DASHBOARD_URL,
  credentials: true
}));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Discord Bot is Operating!" });
});

app.get("/auth", async (req, res) => {
  const code = req.query.code;
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
    res.status(response.status).json(data);
  } catch (err) {
    console.error("[OAUTH] token exchange error:", err);
    res.status(500).json({ error: "internal_server_error", message: err.message });
  }
});

// use middleware api/vc.js
app.use("/api/vc", require("./api/vc"));

module.exports = app;