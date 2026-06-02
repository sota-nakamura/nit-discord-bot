const { Events } = require("discord.js");
const FunnyVote = require("../models/funnyVote");

module.exports = {
    name: Events.MessageCreate,
    execute: async (message) => {
        if (message.author.bot) return;

        // Check if the message is in a DM
        if (!message.guild) {
            if (message.content.trim() === "ごめんなさい") {
                const userStatus = await FunnyVote.get(message.author.id);
                if (userStatus && userStatus.not_funny_count >= 10) {
                    // Reset counts
                    await FunnyVote.resetNotFunnyCount(message.author.id);

                    // Remove role in all guilds
                    const guilds = message.client.guilds.cache;
                    for (const [guildId, guild] of guilds) {
                        try {
                            const member = await guild.members.fetch(message.author.id).catch(() => null);
                            if (member) {
                                await member.roles.remove("1509784499544915968").catch(() => null);
                            }
                        } catch (err) {
                            console.error(`Failed to remove role from user ${message.author.id} in guild ${guildId}:`, err);
                        }
                    }

                    await message.reply("謝罪が送られてきたのでミュートが解除されました。面白くない判定をされた回数はリセットされています。");
                } else {
                    return;
                }
            }
        }
    }
};