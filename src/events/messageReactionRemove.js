const { Events, EmbedBuilder } = require("discord.js");
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
            if (reaction.emoji.name === "⭐") {
                if (reaction.count < config.reaction_count) {
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
                } else {
                    if (Netatweet.isPosted(message.id)) {
                        const displayChannel = await message.guild.channels.fetch(config.display_channel_id).catch(() => null);
                        if (displayChannel) {
                            const displayMessage = await displayChannel.messages.fetch(message.id).catch(() => null);
                            if (displayMessage) {
                                const embed = displayMessage.embeds[0];
                                embed.data.fields[1].value = `${reaction.emoji.toString()} **${reaction.count}**`;
                                displayMessage.edit({ embeds: [embed] });
                            }
                        }
                    } else {
                        Netatweet.addPosted(message.author.id, message.id, reaction.count);
                        const displayChannel = await message.guild.channels.fetch(config.display_channel_id).catch(() => null);
                        if (displayChannel) {
                            const embed = new EmbedBuilder()
                                .setColor(0x1da1f2) // Twitter bird blue
                                .setAuthor({
                                    name: `${message.author.tag}`,
                                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                                })
                                .setDescription(message.content || "*画像または埋め込みのみ*")
                                .addFields(
                                    { name: "元のメッセージ", value: `[クリックして移動](${message.url})`, inline: true },
                                    { name: "リアクション数", value: `${reaction.emoji.toString()} **${reaction.count}**`, inline: true }
                                )
                                .setFooter({ text: `メッセージID: ${message.id}` })
                                .setTimestamp(message.createdAt);

                            // Attach the first image if present
                            const attachment = message.attachments.first();
                            if (attachment && attachment.contentType?.startsWith("image/")) {
                                embed.setImage(attachment.url);
                            }

                            await displayChannel.send({
                                content: `${message.author.username} のネタツイが${reaction.count}人にウケました | <#${message.channel.id}>`,
                                embeds: [embed]
                            }).catch(console.error);
                        }
                    }
                }
            }
        }
    }
}