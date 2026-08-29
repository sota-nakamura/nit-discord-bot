const { Events, EmbedBuilder, Collection } = require("discord.js");
const Netatweet = require("../models/Netatweet");
const Impersonated = require("../models/Impersonated");

module.exports = {
    name: Events.MessageReactionAdd,
    execute: async (reaction, user) => {
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
        const netatweetconfig = Netatweet.get(message.guild.id);

        // neta tweet reaction
        if (netatweetconfig && message.channel.id === netatweetconfig.netatweet_channel_id) {
            if (reaction.emoji.name === "⭐" && reaction.count >= netatweetconfig.reaction_count) {
                if (!Netatweet.isPosted(message.id)) {
                    // Save to DB first to avoid race conditions
                    await Netatweet.addPosted(message.author.id, message.id, reaction.count);

                    const displayChannel = await message.guild.channels.fetch(netatweetconfig.display_channel_id).catch(() => null);
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
                } else {
                    //update star count 
                    const displayChannel = await message.guild.channels.fetch(netatweetconfig.display_channel_id).catch(() => null);
                    if (displayChannel) {
                        const displayMessage = await displayChannel.messages.fetch(message.id).catch(() => null);
                        if (displayMessage) {
                            const embed = displayMessage.embeds[0];
                            embed.data.fields[1].value = `${reaction.emoji.toString()} **${reaction.count}**`;
                            displayMessage.edit({
                                content: `${message.author.username} のネタツイが${reaction.count}人にウケました | <#${message.channel.id}>`,
                                embeds: [embed]
                            });
                        }
                    }
                }
            }
        }
        // check impersonated message
        if (reaction.emoji.name === "👀" && reaction.users.cache.has(message.client.user.id)) {
            const targetUser = reaction.users.cache.last();
            await reaction.users.remove(targetUser);
            const impersonatedData = await Impersonated.get(message.id);
            if (!impersonatedData) return;
            const user = message.client.users.cache.get(impersonatedData.user_id);
            if (!user) {
                await targetUser.send({
                    content: `ユーザーが見つかりませんでした。`
                }).catch(console.error);
            }
            await targetUser.send({
                content: `${message.url}\nこのメッセージは${user.username}によって送信されました。`
            }).catch(console.error);
        }
    }
}