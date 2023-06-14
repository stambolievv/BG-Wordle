import { createElement, sampleFromArray, isArray, isNil, isString } from './utilities';
import dictionary from './data/dictionary';
import config from './config';

export default class WordleGame {
  /**
   * @description The notification element.
   * @type {HTMLElement}
   */
  #notification;
  /**
   * @type {HTMLElement}
   */
  #scoreboard;
  /**
   * @description The array of tile elements.
   * @type {Array<HTMLElement>}
   */
  #tiles;
  /**
   * @description The array of key elements.
   * @type {Array<HTMLElement>}
   */
  #keys;
  /**
   * @description The target word for the game.
   * @type {string}
   */
  #targetWord;
  /**
   * @description The current score.
   * @type {number}
   */
  #score;
  /**
   * @description The highest score.
   * @type {number}
   */
  #highscore;

  /**
   * @description Creates an instance of the Game class.
   * @param {object} options - The game options.
   * @param {HTMLElement} options.notification - The notification element.
   * @param {HTMLElement} options.scoreboard - The scoreboard element.
   * @param {HTMLElement} options.grid - The grid element.
   * @param {HTMLElement} options.keyboard - The keyboard element.
   */
  constructor({ notification, scoreboard, grid, keyboard }) {
    this.#notification = notification;
    this.#scoreboard = scoreboard;
    this.#tiles = Array.from(grid.querySelectorAll('.tile'));
    this.#keys = Array.from(keyboard.querySelectorAll('.key'));

    this.#targetWord = '';
    this.#score = 0;
    this.#highscore = Number(localStorage.getItem('bg-wordle-highscore')) || 0;

    this.#initialize();
  }

  /**
   * @description Submits the current guess for validation.
   */
  async submitGuess() {
    const {
      wordLength,
      templates: { notEnoughLetters, noSuchWord },
      delays: { betweenFlips },
    } = config;

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

    await this.#playAnimation(activeTiles, 'flip', {
      listener: 'transitionend',
      delay: betweenFlips,
      onComplete: (tile, index, array) => {
        this.#flipTile(tile, index);

        if (index === array.length - 1) {
          tile.addEventListener('transitionend', () => (
            this.#checkWinLose(guessedWord, array)
          ), { once: true });
        }
      }
    });
  }

  /**
   * @description Assigns the pressed key to the next available tile on the game grid.
   * @param {string} key - The pressed key.
   */
  pressKey(key) {
    const activeTiles = this.#tiles.filter(tile => tile.dataset.state === 'active-spot');
    if (activeTiles.length >= config.wordLength) return;

    const nextTile = this.#tiles.find(tile => isNil(tile.dataset.letter));
    if (!isNil(nextTile)) this.#setTile(nextTile, key.toLocaleUpperCase());
  }

  /**
   * @description Deletes the last assigned key from the game grid.
   */
  deleteKey() {
    const lastActiveTile = this.#tiles.findLast(tile => tile.dataset.state === 'active-spot');
    if (!isNil(lastActiveTile)) this.#resetTile(lastActiveTile);
  }

  /**
   * @description Initializes the game.
   */
  #initialize() {
    this.#updateScore();
    this.#setRandomTargetWord();

    for (const key of this.#keys) key.className = 'key';
    for (const tile of this.#tiles) this.#resetTile(tile);
  }

  /**
   * @description Sets a random word from the dictionary as the target word.
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
   * @description Plays an animation on the specified items.
   * @param {Array<HTMLElement>} items - The items to animate.
   * @param {string} animation - The animation class to add and remove.
   * @param {object} [options] - The options for the animation.
   * @param {string} [options.listener] - The event listener to wait for animation completion.
   * @param {number} [options.delay] - The delay between each item animation.
   * @param {AnimationCompleteCallback} [options.onComplete] - The callback function to call after each item animation completes.
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
   * @description Checks if the guess is correct or not and handles win/lose scenarios.
   * @param {string} guess - The current guess word.
   * @param {Array<HTMLElement>} tiles - The array of tiles used in the guess.
   */
  async #checkWinLose(guess, tiles) {
    const {
      templates: { win, lose },
      score: { reward, penalty },
      alert: { rewardDuration, penaltyDuration },
      delays: { betweenJumps }
    } = config;

    if (guess === this.#targetWord) {
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
   * @description Updates the score and high score on the scoreboard.
   */
  #updateScore() {
    const score = this.#scoreboard.children.namedItem('score');
    const highscore = this.#scoreboard.children.namedItem('highscore');

    if (isNil(score) || isNil(highscore)) return;

    const { templates } = config;

    if (this.#score > this.#highscore) {
      localStorage.setItem('bg-wordle-highscore', this.#score.toString());
      this.#highscore = this.#score;
    }

    score.textContent = `${templates.score}${this.#score}`;
    highscore.textContent = `${templates.highscore}${this.#highscore}`;
  }

  /**
   * @description Shows an alert with the given message.
   * @param {string} message - The message to display in the alert.
   * @param {number} duration - The duration in milliseconds for which the alert should be displayed.
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
   * @description Flips the specified tile based on its letter and updates its state and corresponding key.
   * @param {HTMLElement} tile - The tile element to flip.
   * @param {number} index - The index of the tile in the array.
   */
  #flipTile(tile, index) {
    const letter = tile.dataset.letter;
    if (isNil(letter)) return;

    const key = this.#keys.find(key => key.dataset.key === letter);
    if (isNil(key)) return;

    if (this.#targetWord[index] === letter) {
      tile.dataset.state = 'correct-spot';
      key.classList.add('correct-spot');
    } else if (this.#targetWord.includes(letter)) {
      tile.dataset.state = 'wrong-spot';
      key.classList.add('wrong-spot');
    } else {
      tile.dataset.state = 'missing-spot';
      key.classList.add('missing-spot');
    }
  }

  /**
   * @description Sets a tile with the specified key.
   * @param {HTMLElement} tile - The tile element to set.
   * @param {string} key - The key to set on the tile.
   */
  #setTile(tile, key) {
    tile.textContent = key;
    tile.dataset.letter = key;
    tile.dataset.state = 'active-spot';
  }

  /**
   * @description Resets a tile to its initial state.
   * @param {HTMLElement} tile - The tile element to reset.
   */
  #resetTile(tile) {
    tile.textContent = '';
    delete tile.dataset.letter;
    delete tile.dataset.state;
  }
}

/**
 * @callback AnimationCompleteCallback Callback function called after animation completion.
 * @param {HTMLElement} item - The item that completed the animation.
 * @param {number} index - The index of the item in the array.
 * @param {Array<HTMLElement>} array - The array of items being animated.
 */