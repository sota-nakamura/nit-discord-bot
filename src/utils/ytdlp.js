const path = require('node:path');
const fs = require('node:fs');
const { EventEmitter } = require('node:events');
const { execFile } = require('node:child_process');
const YTDlpWrap = require('yt-dlp-wrap-plus').default;

const binDir = path.resolve(__dirname, '../../bin');
const cacheDir = path.resolve(__dirname, '../../cache');

const isWin = process.platform === 'win32';
const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const ffmpegName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

const localBinaryPath = path.join(binDir, binaryName);
const localFfmpegPath = path.join(binDir, ffmpegName);

// bin配下に存在すればそのバイナリを使用し、無ければシステムPATHを使用
const binaryPath = fs.existsSync(localBinaryPath) ? localBinaryPath : 'yt-dlp';
let ffmpegPath = fs.existsSync(localFfmpegPath) ? localFfmpegPath : 'ffmpeg';
try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
        ffmpegPath = ffmpegStatic;
        process.env.FFMPEG_PATH = ffmpegStatic;
    }
} catch {
    // fallback to local or system ffmpeg
}

if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

class YtDlpEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.ytDlpWrap = new YTDlpWrap(binaryPath);
    }

    /**
     * 動画のメタ情報を取得（検索クエリ・URL両対応）
     * @param {string} query URLまたは検索ワード
     * @returns {Promise<object>} 動画メタ情報
     */
    async getVideoInfo(query) {
        const trimmedQuery = query.trim();
        const isUrl = trimmedQuery.startsWith('http://') || trimmedQuery.startsWith('https://');
        const isSearchPrefix = /^[a-zA-Z0-9]+search\d*:/.test(trimmedQuery);
        const target = (isUrl || isSearchPrefix) ? trimmedQuery : `ytsearch1:${trimmedQuery}`;

        const args = [
            target,
            '--dump-json',
            '--no-playlist',
            '--js-runtimes', 'node',
        ];

        return new Promise((resolve, reject) => {
            execFile(binaryPath, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err) {
                    return reject(new Error(`Failed to get video info: ${stderr || err.message}`));
                }
                try {
                    let info;
                    const lines = stdout.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                            try {
                                info = JSON.parse(trimmed);
                                break;
                            } catch {
                                // continue searching lines
                            }
                        }
                    }

                    if (!info) {
                        info = JSON.parse(stdout.trim());
                    }

                    resolve({
                        id: info.id,
                        title: info.title,
                        url: info.original_url || info.webpage_url,
                        duration: info.duration,
                        durationString: info.duration_string || `${Math.floor((info.duration || 0) / 60)}:${String((info.duration || 0) % 60).padStart(2, '0')}`,
                        thumbnail: info.thumbnail,
                        channel: info.channel || info.uploader,
                        viewCount: info.view_count,
                    });
                } catch (parseErr) {
                    reject(new Error(`Failed to parse video info JSON: ${parseErr.message}`));
                }
            });
        });
    }

    /**
     * 音声をmp3としてcacheフォルダにダウンロード
     * @param {string} query URLまたは検索ワード
     * @param {Function} [progressCallback] 進捗コールバック (data) => void
     * @returns {Promise<{ info: object, filePath: string }>}
     */
    async downloadAudio(query, progressCallback) {
        const info = await this.getVideoInfo(query);
        const targetFilePath = path.join(cacheDir, `${info.id}.mp3`);

        // キャッシュが存在する場合は即座に返却
        if (fs.existsSync(targetFilePath)) {
            const cachedProgress = {
                percent: 100,
                totalSize: 'Cached',
                currentSpeed: 'Cached',
                eta: '00:00',
                cached: true,
            };
            this.emit('progress', cachedProgress);
            if (typeof progressCallback === 'function') {
                progressCallback(cachedProgress);
            }
            return { info, filePath: targetFilePath };
        }

        const args = [
            info.url,
            '-x',
            '--audio-format', 'mp3',
            '-o', path.join(cacheDir, `${info.id}.%(ext)s`),
            '--ffmpeg-location', ffmpegPath,
            '--js-runtimes', 'node',
            '--no-playlist',
        ];

        return new Promise((resolve, reject) => {
            const emitter = this.ytDlpWrap.exec(args);

            emitter.on('progress', (progress) => {
                this.emit('progress', progress);
                if (typeof progressCallback === 'function') {
                    progressCallback(progress);
                }
            });

            emitter.on('ytDlpEvent', (type, data) => {
                this.emit('ytDlpEvent', type, data);
            });

            emitter.on('error', (err) => {
                this.emit('error', err);
                reject(err);
            });

            emitter.on('close', () => {
                this.emit('close');
                if (fs.existsSync(targetFilePath)) {
                    resolve({ info, filePath: targetFilePath });
                } else {
                    reject(new Error(`Download completed but audio file not found at ${targetFilePath}`));
                }
            });
        });
    }
}

if (require.main === module) {
    (async () => {
        try {
            console.log(`Using yt-dlp at: ${binaryPath}`);
            const yt = new YtDlpEventEmitter();
            const version = await yt.ytDlpWrap.getVersion();
            console.log(`yt-dlp version: ${version}`);
        } catch (err) {
            console.error('Failed to run yt-dlp. Please run `npm run build` to download the binary.', err);
        }
    })();
}

// 互換性のため関数・クラス・オブジェクトいずれのインポート方法でも動くよう設定
module.exports = YtDlpEventEmitter;
module.exports.YtDlpEventEmitter = YtDlpEventEmitter;
module.exports.binaryPath = binaryPath;
module.exports.ffmpegPath = ffmpegPath;
module.exports.cacheDir = cacheDir;