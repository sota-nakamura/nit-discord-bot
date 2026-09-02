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

/**
 * Convert Romaji text to Katakana pronunciation using wanakana.
 * @param {string} str
 * @returns {string}
 */
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

class DictConverter {
    constructor(dictPath = DEFAULT_DICT_PATH) {
        this.dictPath = dictPath;
        this.enToKana = new Map();
        this.kanaToEn = new Map();
        this.loaded = false;
        this._sortedKanaKeys = null;
        this._kanaRegex = null;
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
                // Fallback to legacy comma‑separated format
                console.warn('[WARN] Failed to parse dictionary as JSON, falling back to legacy format');
                const lines = raw.split(",");
                data = {};
                for (const line of lines) {
                    if (!line.trim()) continue;
                    const parts = line.split(":");
                    if (parts.length >= 2) {
                        const kana = parts[0].trim();
                        const en = parts[1].trim().toLowerCase();
                        data[kana] = en;
                    }
                }
            }
            // Support both object map {kana: en} and array of {kana, en}
            if (Array.isArray(data)) {
                for (const entry of data) {
                    if (!entry.kana || !entry.en) continue;
                    const kana = entry.kana.trim();
                    const en = entry.en.trim().toLowerCase();
                    if (!this.enToKana.has(en)) this.enToKana.set(en, kana);
                    if (!this.kanaToEn.has(kana)) this.kanaToEn.set(kana, en);
                }
            } else {
                for (const [kana, en] of Object.entries(data)) {
                    const kanaKey = kana.trim();
                    const enVal = String(en).trim().toLowerCase();
                    if (!this.enToKana.has(enVal)) this.enToKana.set(enVal, kanaKey);
                    if (!this.kanaToEn.has(kanaKey)) this.kanaToEn.set(kanaKey, enVal);
                }
            }
            this.loaded = true;
        } catch (e) {
            console.error('[ERROR] Failed to load dictionary:', e);
            this.loaded = true; // prevent infinite retries
        }
    }

    /**
     * Look up a single English word or phrase in the dictionary.
     * @param {string} english
     * @returns {string|null}
     */
    lookupEnToKana(english) {
        this.load();
        const lower = english.trim().toLowerCase();
        if (this.enToKana.has(lower)) return this.enToKana.get(lower);
        return null;
    }

    /**
     * Look up a single Katakana word or phrase in the dictionary.
     * @param {string} katakana
     * @returns {string|null}
     */
    lookupKanaToEn(katakana) {
        this.load();
        const trimmed = katakana.trim();
        return this.kanaToEn.get(trimmed) || null;
    }

    /**
     * Convert English words in text to Katakana using the dictionary or Romaji reading.
     * @param {string} text
     * @returns {string}
     */
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

    /**
     * Convert a single English word to Katakana (dictionary match -> Romaji reading fallback).
     * @param {string} word
     * @returns {string}
     */
    convertSingleWord(word) {
        const lower = word.toLowerCase();
        if (customEnToKana.has(lower)) return customEnToKana.get(lower);
        if (this.enToKana.has(lower)) return this.enToKana.get(lower);

        // Fallback: convert unknown English/Romaji to Katakana reading
        return romajiToKatakana(word);
    }

    /**
     * Convert Katakana words in text to English using the dictionary.
     * @param {string} text
     * @returns {string}
     */
    convertKatakanaToEnglish(text) {
        this.load();
        if (!text) return "";

        if (!this._sortedKanaKeys) {
            // Sort by length descending for greedy/longest matching
            this._sortedKanaKeys = Array.from(this.kanaToEn.keys()).sort((a, b) => b.length - a.length);
            if (this._sortedKanaKeys.length === 0) return text;
            const pattern = this._sortedKanaKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
            this._kanaRegex = new RegExp(pattern, "g");
        }

        return text.replace(this._kanaRegex, (match) => this.kanaToEn.get(match) || match);
    }
}

const defaultConverter = new DictConverter();

module.exports = {
    DictConverter,
    defaultConverter,
    romajiToKatakana,
    convertEnglishToKatakana: (text) => defaultConverter.convertEnglishToKatakana(text),
    convertKatakanaToEnglish: (text) => defaultConverter.convertKatakanaToEnglish(text),
    lookupEnToKana: (en) => defaultConverter.lookupEnToKana(en),
    lookupKanaToEn: (kana) => defaultConverter.lookupKanaToEn(kana)
};

