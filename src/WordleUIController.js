import WordleGame from './WordleGame';
import { createArray, createElement, isNil, isString } from './utilities';
import config from './config';

export default class WordleUIController {
  /**
   * @description Represents the Wordle game, providing the main functionality and logic.
   * @type {WordleGame}
   */
  #game;
  /**
   * @description The controller used to manage event listeners and abort events.
   * @type {AbortController | null}
   */
  #controller;

  constructor() {
    this.#game = new WordleGame(WordleUIController.createInterface());

    this.#controller = null;
    this.#toggleEventListeners(true);
  }

  /**
   * @description Toggles event listeners on or off.
   * @param {boolean} enable - Flag indicating whether to enable or disable event listeners.
   */
  #toggleEventListeners(enable) {
    if (isNil(this.#controller)) this.#controller = new AbortController();

    const eventHandler = event => this.#eventHandler(event.key || event.target?.dataset?.key);

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
   * @description Handles events actions based on the target element and updates the game accordingly.
   * @param {string | undefined} key - The string representing the clicked, touched or pressed key.
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
   * @description Creates the game interface elements and returns them as an object.
   * @returns {GameElements} The created HTML game elements.
   */
  static createInterface() {
    const { girdLength, keys, templates } = config;

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
          textContent: templates.score
        }),
        createElement('span', {
          attributes: { id: 'highscore' },
          textContent: templates.highscore
        }),
      ]
    });

    const grid = createElement('div', {
      parent: document.body,
      attributes: { id: 'guess-grid' },
      children: createArray(girdLength, () => createElement('div', { attributes: { class: 'tile' } }))
    });

    const keyboard = createElement('div', {
      parent: document.body,
      attributes: { id: 'keyboard' },
    });

    for (const key of keys) {
      const content = key === 'Delete' ? { children: [createDeleteKeySVG(key)] } : { textContent: key };
      createElement('button', {
        parent: keyboard,
        attributes: { class: 'key', 'data-key': key },
        ...content
      });
    }

    return { notification, scoreboard, grid, keyboard };
  }
}

/**
 * @typedef {object} GameElements - Represents the HTML elements used in the game.
 * @property {HTMLElement} notification - The notification element.
 * @property {HTMLElement} scoreboard - The scoreboard element.
 * @property {HTMLElement} grid - The grid element.
 * @property {HTMLElement} keyboard - The keyboard element.
 */