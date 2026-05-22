import WordleGame from './WordleGame';
import { createArray, createElement, isString, Storage } from './utilities';
import { createHelpIconSVG, createSettingsIconSVG, createDeleteKeySVG, createHelpModal, createSettingsModal } from './templates';
import Config from './config';

/**
 * @typedef {object} InterfaceElements
 * @property {HTMLElement} notification - Container where temporary alert messages are injected.
 * @property {HTMLElement} scoreboard - Container that displays the current and high score.
 * @property {HTMLElement} grid - The game grid whose `.tile` children are the letter cells.
 * @property {HTMLElement} keyboard - The on-screen keyboard whose `.key` children are the letter buttons.
 * @property {HTMLElement} helpModal - The how-to-play overlay modal.
 * @property {HTMLElement} settingsModal - The settings overlay modal.
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
    if (Storage.getTheme() === 'light') {
      document.documentElement.classList.add('light-theme');
    }

    const { helpModal, settingsModal, ...gameElements } = WordleUIController.createInterface();

    this.#game = new WordleGame(gameElements);
    this.#controller = new AbortController();

    this.#toggleEventListeners(true);
    this.#setupModals(helpModal, settingsModal);
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
   * @description Wires up modal open/close interactions and settings toggle handlers.
   * Game input is disabled while any modal is open and re-enabled on close.
   * @param {HTMLElement} helpModal - The help overlay element.
   * @param {HTMLElement} settingsModal - The settings overlay element.
   */
  #setupModals(helpModal, settingsModal) {
    const openModal = (/** @type {HTMLElement} */ modal) => {
      this.#toggleEventListeners(false);
      modal.removeAttribute('hidden');
    };

    const closeModal = (/** @type {HTMLElement} */ modal) => {
      modal.setAttribute('hidden', '');
      this.#toggleEventListeners(true);
    };

    document.getElementById('help-btn')?.addEventListener('click', () => openModal(helpModal));
    document.getElementById('settings-btn')?.addEventListener('click', () => openModal(settingsModal));

    for (const modal of [helpModal, settingsModal]) {
      modal.querySelector('.modal-close')?.addEventListener('click', () => closeModal(modal));
      modal.addEventListener('pointerdown', e => { if (e.target === modal) closeModal(modal); });
    }

    const hardModeToggle = /** @type {HTMLInputElement | null} */ (document.getElementById('hard-mode-toggle'));
    if (hardModeToggle) {
      hardModeToggle.checked = this.#game.hardMode;
      hardModeToggle.addEventListener('change', () => {
        this.#game.setHardMode(hardModeToggle.checked);
      });
    }

    const swapButtonsToggle = /** @type {HTMLInputElement | null} */ (document.getElementById('swap-buttons-toggle'));
    if (swapButtonsToggle) {
      swapButtonsToggle.checked = Storage.getSwapButtons();
      swapButtonsToggle.addEventListener('change', () => {
        Storage.setSwapButtons(swapButtonsToggle.checked);
        const keyboard = document.getElementById('keyboard');
        const enterBtn = keyboard?.querySelector('[data-key="Enter"]');
        const deleteBtn = keyboard?.querySelector('[data-key="Delete"]');
        if (enterBtn && deleteBtn) {
          const placeholder = document.createComment('');
          enterBtn.replaceWith(placeholder);
          deleteBtn.replaceWith(enterBtn);
          placeholder.replaceWith(deleteBtn);
        }
      });
    }

    const darkThemeToggle = /** @type {HTMLInputElement | null} */ (document.getElementById('dark-theme-toggle'));
    if (darkThemeToggle) {
      darkThemeToggle.checked = Storage.getTheme() !== 'light';
      darkThemeToggle.addEventListener('change', () => {
        const isLight = !darkThemeToggle.checked;
        document.documentElement.classList.toggle('light-theme', isLight);
        Storage.setTheme(isLight ? 'light' : 'dark');
      });
    }
  }

  /**
   * @description Builds and appends all game UI elements to `document.body` — the header,
   * notification container, scoreboard, guess grid, on-screen keyboard, and both modals —
   * then returns them so the game instance and modal setup can reference them.
   * @returns {InterfaceElements} The created HTML elements.
   */
  static createInterface() {
    const { gridLength, keys, translations } = Config;

    const swappedKeys = Storage.getSwapButtons()
      ? keys.map(k => k === 'Enter' ? 'Delete' : k === 'Delete' ? 'Enter' : k)
      : keys;

    createElement('header', {
      parent: document.body,
      attributes: { id: 'header' },
      children: [
        createElement('button', {
          attributes: { id: 'help-btn', class: 'icon-btn', 'aria-label': translations.helpAriaLabel },
          children: [createHelpIconSVG()],
        }),
        createElement('h1', { attributes: { id: 'title' }, textContent: translations.title }),
        createElement('button', {
          attributes: { id: 'settings-btn', class: 'icon-btn', 'aria-label': translations.settingsAriaLabel },
          children: [createSettingsIconSVG()],
        }),
      ],
    });

    const scoreboard = createElement('div', {
      parent: document.body,
      attributes: { id: 'score-text' },
      children: [
        createElement('span', {
          attributes: { id: 'score' },
          textContent: translations.score,
        }),
        createElement('span', {
          attributes: { id: 'highscore' },
          textContent: translations.highscore,
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

    for (const key of swappedKeys) {
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


    const helpModal = createHelpModal();
    document.body.append(helpModal);

    const settingsModal = createSettingsModal();
    document.body.append(settingsModal);

    return { scoreboard, grid, keyboard, notification, helpModal, settingsModal };
  }
}
