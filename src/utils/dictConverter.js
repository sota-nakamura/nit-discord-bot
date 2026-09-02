const fs = require("node:fs");
const path = require("node:path");
const wanakana = require("wanakana");

const DEFAULT_DICT_PATH = path.resolve(__dirname, "../../assets/dict/data.json");

const numMap = {
    "0": "ゼロ", "1": "イチ", "2": "ニ", "3": "サン", "4": "ヨン",
    "5": "ゴ", "6": "ロク", "7": "ナナ", "8": "ハチ", "9": "キュウ"
};

// Consonant fallback for leftover Latin letters (e.g. word-ending consonants)
const CONSONANT_FALLBACK = {
    k: "ク", s: "ス", t: "ト", n: "ン", h: "ハ", f: "フ", m: "ム",
    r: "ル", l: "ル", g: "グ", z: "ズ", d: "ド", b: "ブ", p: "プ",
    c: "ク", j: "ジ", v: "ブ", w: "ウ", y: "イ", x: "クス", q: "ク"
};

function romajiToKatakana(str) {
    if (!str) return "";

    // Convert digits first
    const text = str.replace(/[0-9]/g, d => numMap[d] || d);

    // Convert Romaji to Katakana using wanakana
    let kana = wanakana.toKatakana(text);

    // Fallback for any leftover isolated Latin consonants
    kana = kana.replace(/[a-zA-Z]/g, ch => CONSONANT_FALLBACK[ch.toLowerCase()] || ch);

    return kana;
}

const customEnToKana = new Map([
    ["lol", "ロル"],
    ["w", "ワラ"],
    ["ww", "ワラワラ"],
    ["www", "ワラワラ"],
    ["juggernaut", "ジャガーノート"],
    ["discord", "ディスコード"]
]);

class DictConverter {
    constructor(dictPath = DEFAULT_DICT_PATH) {
        this.dictPath = dictPath;
        this.enToKana = new Map(customEnToKana);
        this.kanaToEn = new Map();
        this.loaded = false;
    }

    load() {
        if (this.loaded) return;
        try {
            if (!fs.existsSync(this.dictPath)) {
                console.warn(`[WARN] Dictionary file not found: ${this.dictPath}`);
                this.loaded = true;
                return;
            }
            const raw = fs.readFileSync(this.dictPath, "utf-8");
            let data;
            try {
                data = JSON.parse(raw);
            } catch (e) {
                console.warn("[WARN] Failed to parse dictionary as JSON, falling back to legacy format", e);
                data = {};
            }

            if (Array.isArray(data)) {
                for (const entry of data) {
                    if (!entry.en || !entry.kana) continue;
                    const en = entry.en.trim().toLowerCase();
                    const kana = entry.kana.trim();
                    if (!this.enToKana.has(en)) this.enToKana.set(en, kana);
                    if (!this.kanaToEn.has(kana)) this.kanaToEn.set(kana, en);
                }
            } else {
                for (const [en, kana] of Object.entries(data)) {
                    const enVal = String(en).trim().toLowerCase();
                    const kanaVal = String(kana).trim();
                    if (!this.enToKana.has(enVal)) this.enToKana.set(enVal, kanaVal);
                    if (!this.kanaToEn.has(kanaVal)) this.kanaToEn.set(kanaVal, enVal);
                }
            }
            this.loaded = true;
        } catch (e) {
            console.error("[ERROR] Failed to load dictionary:", e);
            this.loaded = true; // prevent infinite retries
        }
    }

    lookupEnToKana(english) {
        this.load();
        const lower = english.trim().toLowerCase();
        if (this.enToKana.has(lower)) return this.enToKana.get(lower);
        return null;
    }

    convertEnglishToKatakana(text) {
        this.load();
        if (!text) return "";

        // Match sequences of English words / characters (including apostrophes / hyphens)
        return text.replace(/[A-Za-z0-9'-]+(?:\s+[A-Za-z0-9'-]+)*/g, (match) => {
            const lower = match.trim().toLowerCase();

            // 1. Direct full match (phrase or word in dictionary)
            if (this.enToKana.has(lower)) return this.enToKana.get(lower);
            // 2. Multi-word match: split and convert each word
            if (match.includes(" ")) {
                return match.split(/\s+/).map(w => this.convertSingleWord(w)).join(" ");
            }

            return this.convertSingleWord(match);
        });
    }

    convertSingleWord(word) {
        const lower = word.trim().toLowerCase();
        if (this.enToKana.has(lower)) return this.enToKana.get(lower);

        // Fallback: convert unknown English/Romaji to Katakana reading
        return romajiToKatakana(word);
    }
}

const defaultConverter = new DictConverter();

module.exports = {
    DictConverter,
    defaultConverter,
    romajiToKatakana,
    convertEnglishToKatakana: (text) => defaultConverter.convertEnglishToKatakana(text),
    lookupEnToKana: (en) => defaultConverter.lookupEnToKana(en)
};

