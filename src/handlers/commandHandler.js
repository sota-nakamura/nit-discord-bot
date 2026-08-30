const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");

function loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, "../commands");
    const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

    for (const entry of entries) {
        let filePath;
        if (entry.isDirectory()) {
            // read index.js in sub directory
            const indexPath = path.join(commandsPath, entry.name, "index.js");
            if (!fs.existsSync(indexPath)) continue;
            filePath = indexPath;
        } else if (entry.name.endsWith(".js")) {
            filePath = path.join(commandsPath, entry.name);
        } else {
            continue;
        }

        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

module.exports = { loadCommands };

