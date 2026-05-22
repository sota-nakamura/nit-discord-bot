const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");

function loadInteractions(client) {
    client.buttons = new Collection();
    client.modals = new Collection();

    // Load buttons
    const buttonsPath = path.join(__dirname, "../interactions/buttons");
    if (fs.existsSync(buttonsPath)) {
        const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith(".js"));
        for (const file of buttonFiles) {
            const filePath = path.join(buttonsPath, file);
            const button = require(filePath);
            if ("customId" in button && "execute" in button) {
                client.buttons.set(button.customId, button);
            } else {
                console.log(`[WARNING] The button interaction at ${filePath} is missing a required "customId" or "execute" property.`);
            }
        }
    }

    // Load modals
    const modalsPath = path.join(__dirname, "../interactions/modals");
    if (fs.existsSync(modalsPath)) {
        const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith(".js"));
        for (const file of modalFiles) {
            const filePath = path.join(modalsPath, file);
            const modal = require(filePath);
            if ("customId" in modal && "execute" in modal) {
                client.modals.set(modal.customId, modal);
            } else {
                console.log(`[WARNING] The modal interaction at ${filePath} is missing a required "customId" or "execute" property.`);
            }
        }
    }
}

module.exports = { loadInteractions };
