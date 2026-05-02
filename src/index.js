require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const querystring = require('node:querystring');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
    console.log("TOKENを設定してください。");
    process.exit(0);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Load handlers
loadCommands(client);
loadEvents(client);

// HTTP Server (Keep-alive for hosting)
http.createServer((req, res) => {
    if (req.method == "POST") {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => {
            if (!data) {
                res.end("No post data");
                return;
            }
            const dataObject = querystring.parse(data);
            if (dataObject.type == "wake") {
                console.log("Woke up in post");
            }
            res.end();
        });
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Discord Bot is Operating!");
    }
}).listen(process.env.PORT, async () => {
    console.log("Server is running on port " + (process.env.PORT));

    // Auto register commands on start
    try {
        const commands = Array.from(client.commands.values()).map(c => c.data.toJSON());
        const rest = new REST().setToken(token);
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error('Failed to reload commands:', error);
    }
});

client.login(token);
