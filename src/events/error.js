const { Events } = require("discord.js");

module.exports = {
    name: Events.Error,
    execute(error) {
        console.error("[ERROR] An error occurred while the Bot was running:", error);
    }
};
