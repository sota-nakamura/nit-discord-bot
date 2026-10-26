const { createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// Map<guildId, MusicQueue>
const queues = new Map();

function createMusicEmbed(info, requestedBy, statusText = "再生中", bot) {
    const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(info.title ? (info.title.length > 250 ? info.title.slice(0, 247) + "..." : info.title) : "YouTube Music")
        .setURL(info.url)
        .setAuthor({ name: `${statusText}: ${info.channel || "YouTube"}` })
        .addFields(
            { name: "再生時間", value: info.durationString || "不明", inline: true },
            { name: "リクエスト", value: requestedBy ? `<@${requestedBy.id || requestedBy}>` : "不明", inline: true }
        )
        .setFooter({
            text: bot.client.user.displayName,
            iconURL: bot.client.user.displayAvatarURL()
        })
        .setTimestamp();

    if (info.thumbnail) {
        embed.setThumbnail(info.thumbnail);
    }

    return embed;
}

function createMusicActionRow(isPaused = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("music_pause_resume")
            .setLabel(isPaused ? "再開" : "一時停止")
            .setEmoji(isPaused ? "▶️" : "⏸️")
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("music_skip")
            .setLabel("スキップ")
            .setEmoji("⏭️")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("music_stop")
            .setLabel("停止")
            .setEmoji("⏹️")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("music_queue")
            .setLabel("キュー")
            .setEmoji("📜")
            .setStyle(ButtonStyle.Secondary)
    );
}

class MusicQueue {
    constructor({ guildId, channelId, textChannel, connection, player }) {
        this.guildId = guildId;
        this.channelId = channelId;
        this.textChannel = textChannel;
        this.connection = connection;
        this.player = player;
        this.songs = [];
        this.current = null;
        this.paused = false;
        this.nowPlayingMessage = null;

        this.onIdle = () => {
            this.playNext();
        };

        this.onError = (error) => {
            console.error("[ERROR] music player error:", error);
            if (this.textChannel) {
                this.textChannel.send(`⚠️ 再生エラーが発生しました: ${error.message}`).catch(() => { });
            }
            this.playNext();
        };

        this.player.on(AudioPlayerStatus.Idle, this.onIdle);
        this.player.on("error", this.onError);
    }

    addSong(song) {
        this.songs.push(song);
        if (!this.current || this.player.state.status !== AudioPlayerStatus.Playing) {
            this.playNext();
            return 0; // Immediately playing
        }
        return this.songs.length; // Position in queue
    }

    async playNext() {
        if (this.songs.length === 1) {
            this.current = null;
            if (this.nowPlayingMessage) {
                this.nowPlayingMessage = null;
            }
            return;
        }

        this.current = this.songs.shift();
        this.paused = false;

        try {
            const resource = createAudioResource(this.current.filePath, {
                inlineVolume: true,
            });
            resource.volume.setVolume(0.25);
            this.connection.subscribe(this.player);
            this.player.play(resource);

            const embed = createMusicEmbed(this.current.info, this.current.requestedBy, "再生中", this.current.bot);
            const row = createMusicActionRow(false);

            if (this.textChannel) {
                this.nowPlayingMessage = await this.textChannel.send({
                    embeds: [embed],
                    components: [row],
                }).catch(() => null);
            }
        } catch (err) {
            console.error("[MUSIC ERROR] Failed to play next song:", err);
            if (this.textChannel) {
                this.textChannel.send(`⚠️ 再生の開始に失敗しました: ${err.message}`).catch(() => { });
            }
            this.playNext();
        }
    }

    pause() {
        if (this.paused) return false;
        const success = this.player.pause();
        if (success) {
            this.paused = true;
            this.updateNowPlayingMessage();
        }
        return success;
    }

    resume() {
        if (!this.paused) return false;
        const success = this.player.unpause();
        if (success) {
            this.paused = false;
            this.updateNowPlayingMessage();
        }
        return success;
    }

    skip() {
        if (!this.current) return false;
        const skippedSong = this.current;
        this.player.stop(); // Triggers AudioPlayerStatus.Idle -> playNext()
        return skippedSong;
    }

    stop() {
        this.songs = [];
        this.current = null;
        this.player.stop();
        if (this.nowPlayingMessage) {
            this.nowPlayingMessage.edit({ components: [] }).catch(() => { });
            this.nowPlayingMessage = null;
        }
        destroyQueue(this.guildId);
    }

    async updateNowPlayingMessage() {
        if (!this.nowPlayingMessage || !this.current) return;
        try {
            const statusText = this.paused ? "一時停止中" : "再生中";
            const embed = createMusicEmbed(this.current.info, this.current.requestedBy, statusText);
            const row = createMusicActionRow(this.paused);
            await this.nowPlayingMessage.edit({ embeds: [embed], components: [row] });
        } catch (e) {
            // Ignore if message was deleted
        }
    }

    destroy() {
        this.player.removeListener(AudioPlayerStatus.Idle, this.onIdle);
        this.player.removeListener("error", this.onError);
        this.songs = [];
        this.current = null;
    }
}

function getQueue(guildId) {
    return queues.get(guildId) || null;
}

function getOrCreateQueue({ guildId, channelId, textChannel, connection, player }) {
    let queue = queues.get(guildId);
    if (!queue) {
        queue = new MusicQueue({ guildId, channelId, textChannel, connection, player });
        queues.set(guildId, queue);
    } else {
        queue.channelId = channelId;
        queue.textChannel = textChannel;
        queue.connection = connection;
        queue.player = player;
    }
    return queue;
}

function destroyQueue(guildId) {
    const queue = queues.get(guildId);
    if (queue) {
        queue.destroy();
        queues.delete(guildId);
    }
}

module.exports = {
    getQueue,
    getOrCreateQueue,
    destroyQueue,
    createMusicEmbed,
    createMusicActionRow,
    MusicQueue,
};
