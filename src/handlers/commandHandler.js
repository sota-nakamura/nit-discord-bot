const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");

function loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, "../commands");
    const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const dirPath = path.join(commandsPath, entry.name);
            const indexPath = path.join(dirPath, "index.js");

            if (fs.existsSync(indexPath)) {
                // if index.js exists, load index.js
                loadCommand(client, indexPath);
            } else {
                // if index.js doesn't exist, load all .js files
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".js"));
                for (const file of files) {
                    loadCommand(client, path.join(dirPath, file));
                }
            }
        } else if (entry.name.endsWith(".js")) {
            loadCommand(client, path.join(commandsPath, entry.name));
        }
    }
}

function loadCommand(client, filePath) {
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

module.exports = { loadCommands };
