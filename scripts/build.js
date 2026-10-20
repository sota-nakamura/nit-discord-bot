const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const YTDlpWrap = require('yt-dlp-wrap-plus').default;

const rootDir = path.resolve(__dirname, '..');
const binDir = path.join(rootDir, 'bin');
const dbDir = path.join(rootDir, 'db');
const cacheDir = path.join(rootDir, 'cache');

const isWin = process.platform === 'win32';
const ytDlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const ffmpegName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

const ytDlpPath = path.join(binDir, ytDlpName);
const ffmpegPath = path.join(binDir, ffmpegName);

async function setupDirectories() {
    console.log('[BUILD] 1/3 Checking directories...');
    for (const dir of [binDir, dbDir, cacheDir]) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[BUILD] Created directory: ${path.relative(rootDir, dir)}/`);
        }
    }
}

async function setupYtDlp() {
    console.log('[BUILD] 2/3 Checking yt-dlp binary...');
    const isForce = process.argv.includes('--force');

    if (fs.existsSync(ytDlpPath) && !isForce) {
        try {
            const ytDlp = new YTDlpWrap(ytDlpPath);
            const version = await ytDlp.getVersion();
            console.log(`[BUILD] yt-dlp is ready: v${version} (${path.relative(rootDir, ytDlpPath)})`);
            return;
        } catch {
            console.log('[BUILD] Existing yt-dlp binary seems corrupted. Re-downloading...');
        }
    }

    console.log(`[BUILD] Downloading latest yt-dlp binary to: ${path.relative(rootDir, ytDlpPath)}`);
    await YTDlpWrap.downloadFromGithub(ytDlpPath, undefined, undefined);
    console.log('\n[BUILD] yt-dlp download complete!');

    const ytDlp = new YTDlpWrap(ytDlpPath);
    const version = await ytDlp.getVersion();
    console.log(`[BUILD] Installed yt-dlp: v${version}`);
}

async function setupFfmpeg() {
    console.log('[BUILD] 3/3 Checking ffmpeg binary...');
    let ffmpegStaticPath;
    try {
        ffmpegStaticPath = require('ffmpeg-static');
    } catch {
        console.warn('[BUILD] ffmpeg-static package not found.');
        return;
    }

    if (ffmpegStaticPath && fs.existsSync(ffmpegStaticPath)) {
        if (!fs.existsSync(ffmpegPath)) {
            console.log(`[BUILD] Copying ffmpeg to: ${path.relative(rootDir, ffmpegPath)}`);
            fs.copyFileSync(ffmpegStaticPath, ffmpegPath);
            if (!isWin) {
                fs.chmodSync(ffmpegPath, '755');
            }
        }
        try {
            const out = execFileSync(ffmpegPath, ['-version'], { encoding: 'utf-8' });
            const firstLine = out.split('\n')[0].trim();
            console.log(`[BUILD] ffmpeg is ready: ${firstLine}`);
        } catch (e) {
            console.warn('[BUILD] ffmpeg verification warning:', e.message);
        }
    } else {
        console.warn('[BUILD] ffmpeg binary could not be found via ffmpeg-static.');
    }
}

async function main() {
    console.log('=== [NIT Bot] Starting build process ===');
    const start = Date.now();

    await setupDirectories();
    await setupYtDlp();
    await setupFfmpeg();

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`=== [NIT Bot] Build completed successfully in ${elapsed}s ===\n`);
}

main().catch((err) => {
    console.error('\n[BUILD ERROR]', err);
    process.exit(1);
});
