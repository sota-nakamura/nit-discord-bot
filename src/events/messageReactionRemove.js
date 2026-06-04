const { Events } = require("discord.js");
const Netatweet = require("../models/Netatweet");
module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the reaction:', error);
                return;
            }
        }

        const message = reaction.message;
        if (!message.guild) return;

        // Fetch settings
        const config = Netatweet.get(message.guild.id);
        if (!config) return;

        if (message.channel.id === config.netatweet_channel_id) {
            if (reaction.emoji.name === "⭐" && reaction.count < config.reaction_count) {
                if (Netatweet.isPosted(message.id)) {
                    Netatweet.removePosted(message.id);

                    const displayChannel = await message.guild.channels.fetch(config.display_channel_id).catch(() => null);
                    if (displayChannel) {
                        const displayMessages = await displayChannel.messages.fetch({
                            limit: 100
                        });
                        const displayMessage = displayMessages.filter(msg => msg.embeds[0]?.footer?.text?.includes(message.id));
                        if (displayMessage) {
                            await displayMessage.forEach(msg => msg.delete());
                        }
                    }
                }
            }
        }
    }
}