import WordleGame from './WordleGame';
import { createArray, createElement, isString } from './utilities';
import Config from './config';

/**
 * @typedef {object} InterfaceElements
 * @property {HTMLElement} notification - Container where temporary alert messages are injected.
 * @property {HTMLElement} scoreboard - Container that displays the current and high score.
 * @property {HTMLElement} grid - The game grid whose `.tile` children are the letter cells.
 * @property {HTMLElement} keyboard - The on-screen keyboard whose `.key` children are the letter buttons.
 */

export default class WordleUIController {
  /**
   * The game instance that owns all guess evaluation and scoring logic.
   * @type {WordleGame}
   */
  #game;
  /**
   * Manages the active keyboard and pointer event listeners; aborted and replaced each time
   * input must be temporarily disabled.
   * @type {AbortController}
   */
  #controller;

  /**
   * @description Builds the DOM interface, creates the game instance, enables input, and
   * wires up the help and settings modals.
   */
  constructor() {
    this.#game = new WordleGame(WordleUIController.createInterface());
    this.#controller = new AbortController();

    this.#toggleEventListeners(true);
  }

  /**
   * @description Enables or disables all keyboard and pointer event listeners. Disabling is
   * done by aborting the current `AbortController` and creating a fresh one so the next
   * `enable` call starts with a clean signal.
   * @param {boolean} enable - `true` to attach listeners, `false` to remove them.
   */
  #toggleEventListeners(enable) {
    const eventHandler = (/** @type {KeyboardEvent | PointerEvent} */ event) =>
      this.#eventHandler(
        (/** @type {KeyboardEvent} */ (event)).key ||
        (/** @type {HTMLElement | null} */ (event.target))?.dataset?.key
      );

    if (enable) {
      const { signal } = this.#controller;
      document.addEventListener('pointerdown', eventHandler, { signal });
      document.addEventListener('keydown', eventHandler, { signal });
    } else {
      this.#controller.abort();
      this.#controller = new AbortController();
    }
  }

  /**
   * @description Dispatches a keyboard or pointer event to the appropriate game action.
   * Input is blocked for the duration of the action to prevent overlapping animations.
   * @param {string | undefined} key - The letter, `'Enter'`, `'Delete'`, or `'Backspace'`
   * derived from the event; `undefined` for unrecognised targets.
   */
  async #eventHandler(key) {
    if (!isString(key)) return;

    this.#toggleEventListeners(false);

    if (key.match(/^[а-яА-Я]$/)) {
      this.#game.pressKey(key);
    } else if (key === 'Enter') {
      await this.#game.submitGuess();
    } else if (key === 'Delete' || key === 'Backspace') {
      this.#game.deleteKey();
    }

    this.#toggleEventListeners(true);
  }

  /**
   * @description Builds and appends all game UI elements to `document.body` — the header,
   * notification container, scoreboard, guess grid, on-screen keyboard, and both modals —
   * then returns them so the game instance and modal setup can reference them.
   * @returns {InterfaceElements} The created HTML elements.
   */
  static createInterface() {
    const { gridLength, keys, templates } = Config;

    const createDeleteKeySVG = (key) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('data-key', key);
      svg.setAttribute('viewBox', '0 0 24 24');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('data-key', key);
      path.setAttribute('d', 'M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z');

      svg.appendChild(path);

      return svg;
    };

    const notification = createElement('div', {
      parent: document.body,
      attributes: { id: 'notification' }
    });

    const scoreboard = createElement('div', {
      parent: document.body,
      attributes: { id: 'score-text' },
      children: [
        createElement('span', {
          attributes: { id: 'score' },
          textContent: templates.score,
        }),
        createElement('span', {
          attributes: { id: 'highscore' },
          textContent: templates.highscore,
        }),
      ]
    });

    const grid = createElement('div', {
      parent: document.body,
      attributes: { id: 'guess-grid' },
      children: createArray(gridLength, () => createElement('div', { attributes: { class: 'tile' } }))
    });

    const keyboard = createElement('div', {
      parent: document.body,
      attributes: { id: 'keyboard' },
    });

    for (const key of keys) {
      const content = key === 'Delete'
        ? { children: [createDeleteKeySVG(key)] }
        : { textContent: key };

      createElement('button', {
        parent: keyboard,
        attributes: { class: 'key', 'data-key': key },
        ...content,
      });
    }

    const notification = createElement('div', {
      parent: document.body,
      attributes: { id: 'notification' }
    });


    return { scoreboard, grid, keyboard, notification };
  }
}
