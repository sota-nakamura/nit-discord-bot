require("dotenv").config();
const { Client, IntentsBitField, Partials } = require("discord.js");
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");
const { loadInteractions } = require("./handlers/interactionHandler");
const { REST, Routes } = require("discord.js");
const { startDashboard } = require("./dashboard");

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
    console.log("TOKENを1つ以上設定してください。");
    process.exit(0);
}

const bots = [];

// Initialize all client instances
for (let i = 0; i < tokens.length; i++) {
    const myIntents = new IntentsBitField();
    myIntents.add(
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildMessageReactions
    );

    const clientInstance = new Client({
        intents: myIntents,
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

// Web Dashboard (Express & EJS)
startDashboard(mainBot.client, process.env.PORT || 3000, async () => {
    // Auto register commands for the main bot
    try {
        const commands = Array.from(mainBot.client.commands.values()).map(c => c.data.toJSON());
        const rest = new REST().setToken(mainBot.token);
        console.log(`[INFO] Started refreshing ${commands.length} application (/) commands.`);
        await rest.put(Routes.applicationGuildCommands(mainBot.clientId, guildId), { body: commands });
        console.log(`[INFO] Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error("[ERROR] Failed to reload commands:", error);
    }
});

// Login all bots
for (const bot of bots) {
    bot.client.login(bot.token)
        .then(() => {
            console.log(`[INFO] Bot ${bot.index} (${bot.client.user.tag}) logged in successfully.`);
        })
        .catch(err => {
            console.error(`[ERROR] Failed to login Bot ${bot.index}:`, err);
        });
}
