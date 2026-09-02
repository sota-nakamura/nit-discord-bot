const { Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const FunnyVote = require("../models/funnyVote");
const TemporaryVC = require("../models/TemporaryVC");
const { playTTS } = require("../utils/tts");
const { getBotForChannel } = require("../utils/botpool");
const ReishoDic = require("../models/ReishoDic");

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
                }
            }
            return;
        }
        const tempVC = await TemporaryVC.getVC(message.channelId);
        // detect reisho
        const content = message.content;
        const phrases = await ReishoDic.getAll("phrase");
        const singleWord = await ReishoDic.getAll("single_word");
        const isReisho = phrases.some(v => content.includes(v.content)) || singleWord.some(v => content.trim() === v.content);
        const editDicButton = new ButtonBuilder()
            .setCustomId("edit_dic")
            .setLabel("冷笑辞書を編集する")
            .setEmoji("📝")
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder()
            .addComponents(editDicButton);
        if (isReisho) {
            await message.reply({
                content: "冷笑やめてクカさい:bangbang:",
                components: [row]
            });
        }
        if (tempVC) {
            const prefs = await TemporaryVC.getPrefs(tempVC.creator_id);
            if (prefs?.read_message === 1) {
                const content = message.content.length > 50 ? message.content.slice(0, 50) + "以下略" : message.content;
                const bot = getBotForChannel(message.guild.id, message.channelId, message.client.botPool);
                if (bot) {
                    const connection = getVoiceConnection(message.guild.id, bot.client.user.id);
                    await playTTS(connection, message.channelId, content);
                }
            }
        }
    }
};