const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");

function getFilesRecursively(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = [...files, ...getFilesRecursively(fullPath)];
        } else if (item.isFile() && item.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }
    return files;
}

function loadInteractions(client) {
    client.buttons = new Collection();
    client.modals = new Collection();

    // Load buttons
    const buttonsPath = path.join(__dirname, "../interactions/buttons");
    if (fs.existsSync(buttonsPath)) {
        const buttonFiles = getFilesRecursively(buttonsPath);
        for (const filePath of buttonFiles) {
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
        const modalFiles = getFilesRecursively(modalsPath);
        for (const filePath of modalFiles) {
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
