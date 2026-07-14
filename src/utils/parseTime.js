const chrono = require("chrono-node");

function parseTime(input) {
    const now = new Date();
    const str = input.trim().toLowerCase();

    // 1. Compound relative (e.g. "1時間30分後", "1時間半後", "1時間30分", "1時間半")
    const compoundRegex = /^(\d+)\s*時間\s*(?:半|(\d+))?\s*(分)?(?:後)?$/;
    const compoundMatch = str.match(compoundRegex);
    if (compoundMatch) {
        const hours = parseInt(compoundMatch[1], 10);
        let mins = 0;
        if (str.includes("半")) {
            mins = 30;
        } else if (compoundMatch[2]) {
            mins = parseInt(compoundMatch[2], 10);
        }
        return new Date(now.getTime() + (hours * 60 + mins) * 60 * 1000);
    }

    // 2. Simple Relative offset (e.g. "10分後", "1時間後", "3日後", "10m", "2h", "3d", "10分", "1時間")
    const relativeRegex = /^(\d+)\s*(分後|分|時間後|時間|時|日後|日|秒後|秒|m|h|d|s|min|mins|minute|minutes|hour|hours|day|days)(?:後|later)?$/;
    const relativeMatch = str.match(relativeRegex);
    if (relativeMatch) {
        const val = parseInt(relativeMatch[1], 10);
        const unit = relativeMatch[2];
        if (unit.startsWith("分") || unit === "m" || unit === "min" || unit === "mins" || unit.startsWith("minute")) {
            return new Date(now.getTime() + val * 60 * 1000);
        } else if (unit.startsWith("時間") || unit === "h" || unit === "hour" || unit === "hours") {
            return new Date(now.getTime() + val * 60 * 60 * 1000);
        } else if (unit.startsWith("日") || unit === "d" || unit === "day" || unit === "days") {
            return new Date(now.getTime() + val * 24 * 60 * 60 * 1000);
        } else if (unit.startsWith("秒") || unit === "s" || unit.startsWith("second")) {
            return new Date(now.getTime() + val * 1000);
        }
    }

    // 3. Fallback to chrono-node
    let parsedDate = chrono.ja.parseDate(input);
    if (!parsedDate) {
        parsedDate = chrono.parseDate(input);
    }

    return parsedDate;
}

module.exports = parseTime;