import { createElement, sampleFromArray, isArray, isNil, isString, Storage } from './utilities';
import dictionary from './data/dictionary';
import Config from './config';

/**
 * @typedef {'correct-spot' | 'wrong-spot' | 'missing-spot'} LettersState
 * Tile evaluation result: exact-position match, present but misplaced, or absent from the word.
 */
/**
 * @typedef {'active-spot' | LettersState} TileState
 * Full set of visual states a tile can hold during gameplay.
 */
/**
 * @typedef {HTMLElement & { dataset: { state: TileState, letter: string } }} Tile
 * A single cell in the guess grid, which holds a letter and a state that determines its color.
 */
/**
 * @typedef {object} GameOptions
 * @property {HTMLElement} notification - Container where temporary alert messages are injected.
 * @property {HTMLElement} scoreboard - Container that displays the current and high score.
 * @property {HTMLElement} grid - The game grid whose `.tile` children are the letter cells.
 * @property {HTMLElement} keyboard - The on-screen keyboard whose `.key` children are the letter buttons.
 */
/**
 * @callback AnimationCompleteCallback
 * @param {HTMLElement} item - The element whose animation just completed.
 * @param {number} index - Its position in the animated items array.
 * @param {Array<HTMLElement>} array - The full array of animated items.
 */

export default class WordleGame {
  /**
   * Container element where temporary alert messages are displayed.
   * @type {HTMLElement}
   */
  #notification;
  /**
   * Container element that shows the current score and high score.
   * @type {HTMLElement}
   */
  #scoreboard;
  /**
   * All tile elements in the game grid, ordered left-to-right, top-to-bottom.
   * @type {Array<Tile>}
   */
  #tiles;
  /**
   * All key elements on the on-screen keyboard.
   * @type {Array<HTMLElement>}
   */
  #keys;
  /**
   * The secret word the player must guess, always uppercase.
   * @type {string}
   */
  #targetWord;
  /**
   * Points accumulated in the current session.
   * @type {number}
   */
  #score;
  /**
   * Best score across all sessions, persisted in localStorage.
   * @type {number}
   */
  #highscore;
  /**
   * Whether hard mode is active: any revealed hint must be reused in subsequent guesses.
   * @type {boolean}
   */
  #hardMode;
  /**
   * Hints accumulated from previously evaluated rows in the current round.
   * `correctPositions` maps tile index -> required letter (green hints).
   * `mustContain` is the set of letters that must appear anywhere (yellow + green hints).
   * @type {{ correctPositions: Map<number, string>, mustContain: Set<string> }}
   */
  #revealedHints;

  /**
   * @description Wires up DOM references, builds the key lookup map, restores the high score
   * from localStorage, and starts the first round.
   * @param {GameOptions} options - DOM containers the game needs to read and write.
   */
  constructor({ notification, scoreboard, grid, keyboard }) {
    this.#notification = notification;
    this.#scoreboard = scoreboard;
    this.#tiles = Array.from(grid.querySelectorAll('.tile'));
    this.#keys = Array.from(keyboard.querySelectorAll('.key'));

    this.#targetWord = '';
    this.#score = Storage.getScore();
    this.#highscore = Storage.getHighscore();
    this.#hardMode = Storage.getHardMode();

    this.#revealedHints = {
      correctPositions: new Map(),
      mustContain: new Set(),
    };

    this.#initialize();
  }

  /**
   * @description Whether hard mode is currently active.
   * @returns {boolean}
   */
  get hardMode() {
    return this.#hardMode;
  }

  /**
   * @description Enables or disables hard mode and persists the preference to localStorage.
   * @param {boolean} enabled - `true` to enable, `false` to disable.
   */
  setHardMode(enabled) {
    this.#hardMode = enabled;
    Storage.setHardMode(enabled);
  }

  /**
   * @description Reads the active tiles as a word, validates it (length check, then dictionary
   * lookup), and reveals each tile's result color through a staggered flip animation.
   */
  async submitGuess() {
    const {
      wordLength,
      translations: { notEnoughLetters, noSuchWord },
      delays: { betweenFlips },
    } = Config;

    const activeTiles = this.#tiles.filter(tile => tile.dataset.state === 'active-spot');
    const guessedWord = activeTiles.reduce((word, tile) => word + tile.dataset.letter, '');

    if (activeTiles.length !== wordLength) {
      this.#showAlert(notEnoughLetters);
      await this.#playAnimation(activeTiles, 'shake');
      return;
    }

    if (!dictionary.includes(guessedWord)) {
      this.#showAlert(noSuchWord);
      await this.#playAnimation(activeTiles, 'shake');
      return;
    }

    if (this.#hardMode) {
      const violation = this.#checkHardModeConstraints(activeTiles, guessedWord);
      if (violation) {
        this.#showAlert(violation);
        await this.#playAnimation(activeTiles, 'shake');
        return;
      }
    }

    const tileStates = this.#computeTileStates(activeTiles);
    this.#updateRevealedHints(activeTiles, tileStates);

    await this.#playAnimation(activeTiles, 'flip', {
      listener: 'transitionend',
      delay: betweenFlips,
      onComplete: (tile, index, array) => {
        this.#flipTile(tile, tileStates[index]);

        if (index === array.length - 1) {
          tile.addEventListener('transitionend', () => (
            this.#checkWinLose(guessedWord, array)
          ), { once: true });
        }
      }
    });
  }

  /**
   * @description Places a letter on the next empty tile. Does nothing when the current row
   * is already full.
   * @param {string} key - The pressed letter; converted to uppercase before placement.
   */
  pressKey(key) {
    const activeTiles = this.#tiles.filter(tile => tile.dataset.state === 'active-spot');
    if (activeTiles.length >= Config.wordLength) return;

    const nextTile = this.#tiles.find(tile => isNil(tile.dataset.letter));
    if (!isNil(nextTile)) this.#setTile(nextTile, key.toLocaleUpperCase());
  }

  /**
   * @description Removes the last placed letter from the current row.
   */
  deleteKey() {
    const lastActiveTile = this.#tiles.findLast(tile => tile.dataset.state === 'active-spot');
    if (!isNil(lastActiveTile)) this.#resetTile(lastActiveTile);
  }

  /**
   * @description Starts a new round: picks a fresh target word, resets all tile and key
   * colors, and refreshes the scoreboard display.
   */
  #initialize() {
    this.#updateScore();
    this.#setRandomTargetWord();

    this.#revealedHints = {
      correctPositions: new Map(),
      mustContain: new Set(),
    };

    for (const key of this.#keys) key.className = 'key';
    for (const tile of this.#tiles) this.#resetTile(tile);
  }

  /**
   * @description Picks a random word from the dictionary and sets it as the new target.
   * Also logs it to the browser console - visible to anyone who opens DevTools (intentional).
   */
  #setRandomTargetWord() {
    this.#targetWord = sampleFromArray(dictionary);

    console.info(
      `%cДумата ти е %c"${this.#targetWord}"%c, но защо %cмамиш%c?`,
      'color:orange;font-size:1.4rem',
      'color:lime;font-size:1.6rem;font-weight:bolder',
      'color:orange;font-size:1.4rem;',
      'color:red;font-size:1.4rem;',
      'color:orange;font-size:1.4rem'
    );
  }

  /**
   * @description Adds `animation` as a CSS class to each item with an optional stagger delay,
   * waits for the specified DOM event on each item, then removes the class. Resolves once
   * every item has finished its animation.
   * @param {Array<HTMLElement>} items - Elements to animate.
   * @param {string} animation - CSS class name to add and then remove.
   * @param {object} [options] - Timing and callback configuration.
   * @param {string} [options.listener] - DOM event name to await on each element (default: `'animationend'`).
   * @param {number} [options.delay] - Stagger gap in ms between consecutive item animations (default: `0`).
   * @param {AnimationCompleteCallback} [options.onComplete] - Invoked for each element after its animation event fires.
   */
  async #playAnimation(items, animation, options = {}) {
    const { listener = 'animationend', delay = 0, onComplete = () => { } } = options;

    if (!isArray(items) || !isString(animation)) return;

    await Promise.all(items.map((item, index, array) => new Promise(resolve => {
      setTimeout(() => {
        item.classList.add(animation);
        item.addEventListener(listener, () => {
          item.classList.remove(animation);
          onComplete(item, index, array);
          resolve(item);
        }, { once: true });
      }, ((index + 1) * delay));
    })));
  }

  /**
   * @description Called after the last tile in a row finishes flipping. Awards points and
   * starts a new round on a correct guess; deducts points and ends the game if all six rows
   * are used up.
   * @param {string} guess - The word the player just submitted.
   * @param {Array<HTMLElement>} tiles - The row of tiles that was just revealed.
   */
  async #checkWinLose(guess, tiles) {
    const {
      translations: { win, lose },
      score: { penalty },
      alert: { rewardDuration, penaltyDuration },
      delays: { betweenJumps },
      wordLength, gridLength,
    } = Config;

    if (guess === this.#targetWord) {
      const maxGuesses = gridLength / wordLength;
      const guessNumber = this.#tiles.filter(t =>
        t.dataset.state === 'correct-spot' ||
        t.dataset.state === 'wrong-spot' ||
        t.dataset.state === 'missing-spot'
      ).length / wordLength;

      const reward = maxGuesses - guessNumber + 1;
      this.#score += reward;

      this.#showAlert(win.replace(/{{reward}}/, reward.toString()), rewardDuration);
      await this.#playAnimation(tiles, 'dance', { delay: betweenJumps });

      this.#initialize();
      return;
    }

    const isGridFull = this.#tiles.every(tile => isString(tile.dataset.letter));
    if (isGridFull) {
      if (this.#score > 0) this.#score -= penalty;

      await this.#showAlert(lose.replace(/{{word}}/, this.#targetWord).replace(/{{penalty}}/g, penalty.toString()), penaltyDuration);

      this.#initialize();
      return;
    }
  }

  /**
   * @description Checks whether the current score beats the stored high score, persists it
   * to localStorage if so, and refreshes the scoreboard text.
   */
  #updateScore() {
    const score = this.#scoreboard.children.namedItem('score');
    const highscore = this.#scoreboard.children.namedItem('highscore');

    if (isNil(score) || isNil(highscore)) return;

    const { translations } = Config;

    Storage.setScore(this.#score);

    if (this.#score > this.#highscore) {
      Storage.setHighscore(this.#score);
      this.#highscore = this.#score;
    }

    score.textContent = `${translations.score}${this.#score}`;
    highscore.textContent = `${translations.highscore}${this.#highscore}`;
  }

  /**
   * @description Prepends a dismissible alert to the notification container and automatically
   * fades it out after `duration` milliseconds.
   * @param {string} message - Text to show in the alert.
   * @param {number} [duration] - How long the alert stays visible before fading (ms). Defaults to `1000`.
   */
  async #showAlert(message, duration = 1000) {
    const alert = createElement('div', {
      parent: this.#notification,
      prepend: true,
      attributes: { class: 'alert' },
      textContent: message,
    });

    this.#playAnimation([alert], 'hide', {
      listener: 'transitionend',
      delay: duration,
      onComplete: item => item.remove()
    });
  }

  /**
   * @description Runs the standard two-pass Wordle evaluation algorithm against the current
   * target word. Pass 1 - marks exact-position matches as `'correct-spot'` and removes those
   * letters from the pool. Pass 2 - for each remaining tile, checks the reduced pool and
   * marks as `'wrong-spot'` if found (consuming that slot), or `'missing-spot'` otherwise.
   * This ensures a single occurrence in the target never produces more than one colored result.
   * @param {Array<HTMLElement>} tiles - Active tile elements for the current row.
   * @returns {Array<LettersState>} One state per tile, in the same order.
   */
  #computeTileStates(tiles) {
    const guessLetters = tiles.map(tile => tile.dataset.letter ?? '');
    const targetLetters = [...this.#targetWord];

    /** @type {Array<LettersState>} */
    const states = new Array(guessLetters.length).fill('missing-spot');

    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        states[i] = 'correct-spot';
        targetLetters[i] = '';
      }
    }

    for (let i = 0; i < guessLetters.length; i++) {
      if (states[i] === 'correct-spot') continue;

      const targetIndex = targetLetters.indexOf(guessLetters[i]);

      if (targetIndex !== -1) {
        states[i] = 'wrong-spot';
        targetLetters[targetIndex] = '';
      }
    }

    return states;
  }

  /**
   * @description Applies a pre-computed `LettersState` to a tile and upgrades the matching
   * keyboard key to the best state it has received so far
   * (green > yellow > gray - never downgraded).
   * @param {HTMLElement} tile - The tile to update.
   * @param {LettersState} state - The evaluation result for this tile.
   */
  #flipTile(tile, state) {
    const letter = tile.dataset.letter;
    if (isNil(letter)) return;

    const key = this.#keys.find(key => key.dataset.key === letter);
    if (isNil(key)) return;

    tile.dataset.state = state;

    if (state === 'correct-spot') {
      key.classList.remove('wrong-spot', 'missing-spot');
      key.classList.add('correct-spot');
    } else if (state === 'wrong-spot' && !key.classList.contains('correct-spot')) {
      key.classList.remove('missing-spot');
      key.classList.add('wrong-spot');
    } else if (!key.classList.contains('correct-spot') && !key.classList.contains('wrong-spot')) {
      key.classList.add('missing-spot');
    }
  }

  /**
   * @description Writes a letter onto a tile and marks it `'active-spot'`
   * when the player has typed this letter but has not yet submitted the row.
   * @param {HTMLElement} tile - The tile to populate.
   * @param {string} key - The uppercase letter to place.
   */
  #setTile(tile, key) {
    tile.textContent = key;
    tile.dataset.letter = key;
    tile.dataset.state = 'active-spot';
  }

  /**
   * @description Validates the guessed word against accumulated hard mode constraints.
   * First checks exact-position requirements (green hints), then checks that all
   * must-contain letters (yellow and green hints) appear somewhere in the guess.
   * @param {Array<Tile>} tiles - Active tiles for the current row.
   * @param {string} guessedWord - The word formed from those tiles.
   * @returns {string | null} An error message if a constraint is violated, or `null` if valid.
   */
  #checkHardModeConstraints(tiles, guessedWord) {
    const { translations } = Config;

    for (const [position, letter] of this.#revealedHints.correctPositions) {
      if (tiles[position].dataset.letter !== letter) {
        return translations.hardModeCorrectSpot
          .replace('{{position}}', (position + 1).toString())
          .replace('{{letter}}', letter);
      }
    }

    for (const letter of this.#revealedHints.mustContain) {
      if (!guessedWord.includes(letter)) {
        return translations.hardModeWrongSpot.replace('{{letter}}', letter);
      }
    }

    return null;
  }

  /**
   * @description Records newly revealed hints after a row is evaluated so that subsequent
   * guesses can be checked against them in hard mode.
   * @param {Array<Tile>} tiles - The evaluated row's tiles.
   * @param {Array<LettersState>} states - The computed state for each tile.
   */
  #updateRevealedHints(tiles, states) {
    for (let i = 0; i < tiles.length; i++) {
      const letter = tiles[i].dataset.letter ?? '';
      if (states[i] === 'correct-spot') {
        this.#revealedHints.correctPositions.set(i, letter);
        this.#revealedHints.mustContain.add(letter);
      } else if (states[i] === 'wrong-spot') {
        this.#revealedHints.mustContain.add(letter);
      }
    }
  }

  /**
   * @description Clears a tile's letter, text content, and visual state, restoring it to its
   * blank initial appearance.
   * @param {HTMLElement} tile - The tile to blank out.
   */
  #resetTile(tile) {
    tile.textContent = '';
    delete tile.dataset.letter;
    delete tile.dataset.state;
  }
}