const http = require("http");
const querystring = require("node:querystring");
const { REST, Routes } = require('discord.js');
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;
const fs = require('node:fs');
const path = require('node:path');

http
    .createServer(function (req, res) {
        if (req.method == "POST") {
            var data = "";
            req.on("data", function (chunk) {
                data += chunk;
            });
            req.on("end", function () {
                if (!data) {
                    res.end("No post data");
                    return;
                }
                var dataObject = querystring.parse(data);
                console.log("post:" + dataObject.type);
                if (dataObject.type == "wake") {
                    console.log("Woke up in post");
                    res.end();
                    return;
                }
                res.end();
            });
        } else if (req.method == "GET") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Discord Bot is Oprateing!");
        }
    })
    .listen(3000, () => {
        const commands = [];
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }

        // Construct and prepare an instance of the REST module
        const rest = new REST().setToken(token);

        // and deploy your commands!
        (async () => {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);

                // The put method is used to fully refresh all commands in the guild with the current set
                const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
                console.log("Server is running on port 3000");
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error);
            }
        })();
    });

if (process.env.TOKEN == undefined || process.env.TOKEN == "") {
    console.log("TOKENを設定してください。");
    process.exit(0);
}

require("./app.js")
