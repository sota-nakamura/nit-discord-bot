const { getVoiceConnection, VoiceConnectionStatus, createAudioPlayer } = require("@discordjs/voice");
const YtDlpEventEmitter = require("../../utils/ytdlp");
const { connectToVC } = require("../../utils/voiceConnection");
const { getAvailableBot, getBotForChannel } = require("../../utils/botpool");
const { audioPlayers } = require("../../utils/voiceConnection");
const { getOrCreateQueue } = require("../../utils/musicPlayer");
const { createErrorEmbed, createInfoEmbed } = require("../../utils/embed");

async function executePlay(interaction) {
    await interaction.deferReply();

    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel) {
        return interaction.editReply({ embeds: [createErrorEmbed("先にボイスチャンネルに参加してください。")] });
    }

    const query = interaction.options.getString("query");

    try {
        await interaction.editReply({ embeds: [createInfoEmbed(`**${query}** を検索中...`)] });

        const ytdlp = new YtDlpEventEmitter();

        const { info, filePath } = await ytdlp.downloadAudio(query);

        // ボイスチャンネル接続の取得または作成
        const botPool = interaction.client.botPool;
        let bot = getBotForChannel(interaction.guild.id, voiceChannel.id, botPool);
        let connection;
        let player;

        if (bot) {
            connection = getVoiceConnection(interaction.guild.id, bot.client.user.id);
        }

        if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
            bot = getAvailableBot(interaction.guild.id, botPool) || {
                client: interaction.client,
                index: 1,
            };
            const botGuild = bot.client.guilds.cache.get(interaction.guild.id) || interaction.guild;
            const vc = connectToVC({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: botGuild.voiceAdapterCreator,
                botUserId: bot.client.user.id,
                botIndex: bot.index,
            });
            connection = vc.connection;
            player = vc.player;
        } else {
            player = audioPlayers.get(voiceChannel.id);
            if (!player) {
                player = createAudioPlayer();
                audioPlayers.set(voiceChannel.id, player);
                connection.subscribe(player);
            }
        }

        const queue = getOrCreateQueue({
            guildId: interaction.guild.id,
            channelId: voiceChannel.id,
            textChannel: interaction.channel,
            connection,
            player,
        });

        const position = queue.addSong({
            info,
            filePath,
            requestedBy: member,
            bot
        });

        if (position === 0) {
            await interaction.editReply({ embeds: [createInfoEmbed(`**[${info.title}](${info.url})** の再生を開始します`)] });
        } else {
            await interaction.editReply({ embeds: [createInfoEmbed(`#${position} キューに追加しました: **[${info.title}](${info.url})** (${info.durationString})`)] });
        }
    } catch (error) {
        console.error("[ERROR] /play command failed:", error);
        await interaction.editReply({ embeds: [createErrorEmbed(`再生エラー: ${error.message || "曲の取得に失敗しました。"}`)] }).catch(() => { });
    }
}

module.exports = executePlay;