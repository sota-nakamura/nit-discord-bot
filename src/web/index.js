const express = require("express");
const cors = require("cors");

const app = express();
const API_BASE = 'https://ipscanner.io';

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim(); // left-most = original client
  return req.socket.remoteAddress;
}

async function checkVpn(ip) {
  try {
    const res = await fetch(`${API_BASE}/v1/vpn/${ip}`, {
      headers: { Authorization: `Bearer ${process.env.IPSCANNER_API_KEY}` }
    });
    if (!res.ok) throw new Error(`lookup failed: ${res.status}`);
    const data = await res.json();
    return { isVpn: Boolean(data.vpn), score: data.score ?? 0 };
  } catch (err) {
    console.error('vpn check error', err);
    return { isVpn: false, score: 0 }; // fail open
  }
}
const cache = new Map(); // ip -> { value, expires }

async function checkVpnCached(ip, ttlMs = 10 * 60 * 1000) {
  const hit = cache.get(ip);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await checkVpn(ip);
  cache.set(ip, { value, expires: Date.now() + ttlMs });
  return value;
}
app.use(cors({
    origin: process.env.DASHBOARD_URL,
    credentials: true
}));

app.use( async (req, res, next) => {
    const ip = getClientIp(req);
    const { isVpn, score } = await checkVpnCached(ip);

    if (score >= 70) {
        return res.status(403).json({ error: 'Blocked. VPN, Tor, or Proxy detected.' });
    }
    next();
});

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
                redirect_uri: "http://localhost:5173/auth"
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

module.exports = app;