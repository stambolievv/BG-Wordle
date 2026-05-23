import Config from '../config';

/**
 * Keys used to read and write data in browser storage.
 */
const KEYS = Object.freeze({
  score: 'bg-wordle-score',
  highscore: 'bg-wordle-highscore',
  hardMode: 'bg-wordle-hard-mode',
  swapButtons: 'bg-wordle-swap-buttons',
  theme: 'bg-wordle-theme',
  wordLength: 'bg-wordle-word-length',
  dictionary: 'bg-wordle-dictionary',
});

/**
 * Centralises all browser-storage reads and writes for the game.
 */
export class Storage {
  /**
   * @description Current-session score, keyed by word length. Resets on tab close by design.
   * @param {number} wordLength - The word length whose score to look up.
   * @returns {number} The current session score, or 0 if nothing is stored.
   */
  static getScore(wordLength) { return Number(sessionStorage.getItem(`${KEYS.score}-${wordLength}`)) || 0; }
  /**
   * @description Current-session score, keyed by word length. Resets on tab close by design.
   * @param {number} wordLength - The word length to record the score under.
   * @param {number} value - The new score.
   */
  static setScore(wordLength, value) { sessionStorage.setItem(`${KEYS.score}-${wordLength}`, String(value)); }

  /**
   * @description All-time high score for a given word length. Only ever updated on a win, never decremented.
   * @param {number} wordLength - The word length whose high score to look up.
   * @returns {number} The best score ever recorded for this word length, or 0.
   */
  static getHighscore(wordLength) { return Number(localStorage.getItem(`${KEYS.highscore}-${wordLength}`)) || 0; }
  /**
   * @description All-time high score for a given word length. Only ever updated on a win, never decremented.
   * @param {number} wordLength - The word length to record the high score under.
   * @param {number} value - The new high score.
   */
  static setHighscore(wordLength, value) { localStorage.setItem(`${KEYS.highscore}-${wordLength}`, String(value)); }

  /**
   * @description Whether hard mode is enabled.
   * @returns {boolean} `true` if hard mode is currently on.
   */
  static getHardMode() { return localStorage.getItem(KEYS.hardMode) === 'true'; }
  /**
   * @description Persists the hard mode preference.
   * @param {boolean} value - `true` to enable, `false` to disable.
   */
  static setHardMode(value) { localStorage.setItem(KEYS.hardMode, String(value)); }

  /**
   * @description The stored theme preference. Absent means the app defaults to dark;
   * `'light'` activates the light theme.
   * @returns {string | null} The stored theme name, or `null` if not yet set.
   */
  static getTheme() { return localStorage.getItem(KEYS.theme); }
  /**
   * @description Persists the active theme.
   * @param {string} value - Theme name to persist.
   */
  static setTheme(value) { localStorage.setItem(KEYS.theme, value); }

  /**
   * @description Whether the Enter and Delete on-screen buttons are swapped.
   * @returns {boolean} `true` if the positions are swapped.
   */
  static getSwapButtons() { return localStorage.getItem(KEYS.swapButtons) === 'true'; }
  /**
   * @description Persists the swap-buttons preference.
   * @param {boolean} value - `true` to swap, `false` to restore default order.
   */
  static setSwapButtons(value) { localStorage.setItem(KEYS.swapButtons, String(value)); }

  /**
   * @description The user's preferred word length, persisted across sessions.
   * @returns {number} The saved word length, or the config default if nothing is stored.
   */
  static getWordLength() { return Number(localStorage.getItem(KEYS.wordLength)) || Config.defaultWordLength; }
  /**
   * @description Persists the chosen word length.
   * @param {number} value - Word length to persist.
   */
  static setWordLength(value) { localStorage.setItem(KEYS.wordLength, String(value)); }

  /**
   * @description Cached word list for a specific word length.
   * Returns `null` on a cache miss, a parse error, or a structurally invalid entry.
   * Entries have no expiry; they stay valid until new dictionary files are deployed.
   * @param {number} wordLength - The word length whose cache entry to look up.
   * @returns {{ dictionary: Array<string>, ts: number } | null} The cached entry, or `null` on a miss.
   */
  static getDictionaryCache(wordLength) {
    try {
      const raw = localStorage.getItem(`${KEYS.dictionary}-${wordLength}`);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.dictionary) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * @description Writes a word list to the cache for future loads.
   * @param {Array<string>} dictionary - The filtered word list to cache.
   * @param {number} wordLength - The word length this list belongs to.
   */
  static setDictionaryCache(dictionary, wordLength) {
    try {
      localStorage.setItem(
        `${KEYS.dictionary}-${wordLength}`,
        JSON.stringify({ dictionary, ts: Date.now() })
      );
    } catch {
      /* quota exceeded - cache silently skipped */
    }
  }
}
