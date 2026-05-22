/**
 * Keys used to read and write data in browser storage.
 * Frozen to prevent accidental mutation.
 */
const KEYS = Object.freeze({
  score: 'bg-wordle-score',
  highscore: 'bg-wordle-highscore',
  hardMode: 'bg-wordle-hard-mode',
  swapButtons: 'bg-wordle-swap-buttons',
  theme: 'bg-wordle-theme',
});

/**
 * @description Centralises all browser-storage reads and writes for the game.
 * Session-scoped data (`score`) lives in `sessionStorage` and resets when the tab is closed.
 * Persistent settings (`highscore`, `hardMode`, `swapButtons`, `theme`) live in `localStorage`.
 */
export class Storage {
  /**
   * @description Current-session score. Survives page refresh but not tab close.
   * @returns {number}
   */
  static getScore() { return Number(sessionStorage.getItem(KEYS.score)) || 0; }
  /** @param {number} value */
  static setScore(value) { sessionStorage.setItem(KEYS.score, String(value)); }

  /**
   * @description All-time high score, persisted across sessions.
   * @returns {number}
   */
  static getHighscore() { return Number(localStorage.getItem(KEYS.highscore)) || 0; }
  /** @param {number} value */
  static setHighscore(value) { localStorage.setItem(KEYS.highscore, String(value)); }

  /**
   * @description Whether hard mode was last enabled by the user.
   * @returns {boolean}
   */
  static getHardMode() { return localStorage.getItem(KEYS.hardMode) === 'true'; }
  /** @param {boolean} value */
  static setHardMode(value) { localStorage.setItem(KEYS.hardMode, String(value)); }

  /**
   * @description The saved UI theme (`'light'` or `'dark'`), or `null` if never set.
   * @returns {string | null}
   */
  static getTheme() { return localStorage.getItem(KEYS.theme); }
  /** @param {string} value */
  static setTheme(value) { localStorage.setItem(KEYS.theme, value); }

  /**
   * @description Whether the Enter and Delete on-screen buttons are swapped.
   * @returns {boolean}
   */
  static getSwapButtons() { return localStorage.getItem(KEYS.swapButtons) === 'true'; }
  /** @param {boolean} value */
  static setSwapButtons(value) { localStorage.setItem(KEYS.swapButtons, String(value)); }
}
