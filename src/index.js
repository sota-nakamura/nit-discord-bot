require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const http = require("http");
const querystring = require("node:querystring");
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");
const { loadInteractions } = require("./handlers/interactionHandler");
const { REST, Routes } = require("discord.js");

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception thrown:", error);
});

// Load tokens and client IDs for up to 3 bots
const tokens = [];
const clientIds = [];
for (let i = 1; i <= 5; i++) {
    const tokenVal = process.env[`TOKEN_${i}`];
    const clientIdVal = process.env[`CLIENT_ID_${i}`] || (i === 1 ? process.env.CLIENT_ID : undefined);
    if (tokenVal) {
        tokens.push(tokenVal);
        clientIds.push(clientIdVal);
    }
}

const guildId = process.env.GUILD_ID;

if (tokens.length === 0) {
    console.log("TOKEN_1〜3のいずれかを設定してください。");
    process.exit(0);
}

const bots = [];

// Initialize all client instances
for (let i = 0; i < tokens.length; i++) {
    const clientInstance = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildMessageReactions
        ],
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ],
    });

    bots.push({
        client: clientInstance,
        token: tokens[i],
        clientId: clientIds[i],
        index: i + 1
    });
}

// Bot 1 (index 0) is the Main Bot
const mainBot = bots[0];

// Load handlers on the Main Bot
loadCommands(mainBot.client);
loadEvents(mainBot.client);
loadInteractions(mainBot.client);

// Attach the bot pool to the main client so event handlers can access it
mainBot.client.botPool = bots;

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
}).listen(process.env.PORT || 3000, async () => {
    console.log("Server is running on port " + (process.env.PORT || 3000));

    // Auto register commands for the main bot
    try {
        const commands = Array.from(mainBot.client.commands.values()).map(c => c.data.toJSON());
        const rest = new REST().setToken(mainBot.token);
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        await rest.put(Routes.applicationGuildCommands(mainBot.clientId, guildId), { body: commands });
        console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error("Failed to reload commands:", error);
    }
});

// Login all bots
for (const bot of bots) {
    bot.client.login(bot.token)
        .then(() => {
            console.log(`Bot ${bot.index} (${bot.client.user.tag}) logged in successfully.`);
        })
        .catch(err => {
            console.error(`Failed to login Bot ${bot.index}:`, err);
        });
}
