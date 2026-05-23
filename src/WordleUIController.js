import WordleGame from './WordleGame';
import { createArray, createElement, isString, Storage, loadDictionary } from './utilities';
import { createHelpIconSVG, createSettingsIconSVG, createDeleteKeySVG, createHelpModal, createSettingsModal } from './templates';
import Config from './config';

/**
 * Named DOM references produced once by `createInterface`.
 * The modal elements are only needed for open/close wiring; the remaining elements
 * are passed into the game instance and stored for rebuilds.
 * @typedef {object} InterfaceElements
 * @property {HTMLElement} notification - Container for alert messages; cleared on each new load.
 * @property {HTMLElement} scoreboard - Displays current and high score.
 * @property {HTMLElement} grid - The tile grid; rebuilt when word length changes.
 * @property {HTMLElement} keyboard - The on-screen keyboard; updated with result colors after each guess.
 * @property {HTMLElement} helpModal - How-to-play overlay.
 * @property {HTMLElement} settingsModal - Settings overlay.
 */

export default class WordleUIController {
  /**
   * Null until the dictionary finishes loading; input is silently dropped until this is set.
   * @type {WordleGame | null}
   */
  #game = null;
  /**
   * Aborted to cancel all listeners at once. Replaced with a fresh instance before the next re-enable.
   * @type {AbortController}
   */
  #controller;
  /**
   * Cached to skip redundant fetches when the user selects the same length already active.
   * @type {number}
   */
  #wordLength;
  /**
   * Stable DOM references shared across game instances.
   * @type {Omit<InterfaceElements, 'helpModal' | 'settingsModal'>}
   */
  #gameElements;

  /**
   * @description Applies the stored theme before building the DOM to prevent a flash,
   * then kicks off the first dictionary load.
   */
  constructor() {
    if (Storage.getTheme() === 'light') {
      document.documentElement.classList.add('light-theme');
    }

    this.#wordLength = Storage.getWordLength();

    const { helpModal, settingsModal, ...gameElements } = WordleUIController.createInterface(this.#wordLength);
    this.#gameElements = gameElements;

    this.#controller = new AbortController();

    this.#setupModals(helpModal, settingsModal);
    this.#load(this.#wordLength);
  }

  /**
   * @description Central switch for game input. Disabled while animations run, while the
   * dictionary is loading, and while any modal is open.
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
   * @description Unified handler for both physical keyboard and on-screen button input.
   * Input is re-gated around each action to prevent animation overlap.
   * @param {string | undefined} key - The letter, `'Enter'`, `'Delete'`, or `'Backspace'`;
   * `undefined` for events that didn't originate from a recognised input source.
   */
  async #eventHandler(key) {
    if (!isString(key) || !this.#game) return;

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
   * @description Prepends a notification to the container and returns the element so
   * the caller can remove or update it when ready.
   * @param {string} message - Text to show in the notification.
   * @returns {HTMLElement} The injected alert element.
   */
  #showNotification(message) {
    return createElement('div', {
      parent: this.#gameElements.notification,
      prepend: true,
      attributes: { class: 'alert' },
      textContent: message,
    });
  }

  /**
   * @description On failure, the notification becomes a retry button and input stays
   * blocked until the next successful load.
   * @param {number} wordLength - Word length to fetch the dictionary for.
   */
  async #load(wordLength) {
    this.#gameElements.notification.replaceChildren();
    const alert = this.#showNotification(Config.translations.loading);

    try {
      const dictionary = await loadDictionary(wordLength);
      alert.remove();

      this.#game = new WordleGame({ ...this.#gameElements, dictionary, wordLength });
      this.#toggleEventListeners(true);
    } catch (err) {
      alert.textContent = Config.translations.loadingError;
      alert.classList.add('retryable');
      alert.addEventListener('pointerdown', () => this.#load(wordLength), { once: true });

      console.error('Failed to load game:', err);
    }
  }

  /**
   * @description Closes the modal upfront so a second tap cannot trigger another rebuild
   * while the first fetch is still running.
   * @param {number} newWordLength - The word length the player just selected.
   * @param {HTMLElement} settingsModal - Closed before the fetch starts to block a second trigger.
   */
  async #rebuild(newWordLength, settingsModal) {
    settingsModal.setAttribute('hidden', '');

    Storage.setWordLength(newWordLength);
    this.#wordLength = newWordLength;
    document.documentElement.style.setProperty('--word-length', String(newWordLength));

    const { grid } = this.#gameElements;
    grid.replaceChildren(
      ...Array.from({ length: Config.maxGuesses * newWordLength }, () =>
        createElement('div', { attributes: { class: 'tile' } })
      )
    );

    await this.#load(newWordLength);
  }

  /**
   * @description Wires open/close and all settings toggle interactions. Input is blocked
   * whenever a modal is open. The word-length picker syncs to the active length on open
   * because the rebuild flow closes the modal before the fetch finishes.
   * @param {HTMLElement} helpModal - The help overlay to wire.
   * @param {HTMLElement} settingsModal - The settings overlay to wire.
   */
  #setupModals(helpModal, settingsModal) {
    const updateWordLengthUI = () => {
      const picker = settingsModal.querySelector('.word-length-picker');
      if (!picker) return;
      for (const btn of picker.querySelectorAll('.word-length-btn')) {
        btn.classList.toggle('active', Number((/** @type {HTMLElement} */ (btn)).dataset.length) === this.#wordLength);
      }
    };

    const openModal = (/** @type {HTMLElement} */ modal) => {
      this.#toggleEventListeners(false);
      if (modal === settingsModal) updateWordLengthUI();
      modal.removeAttribute('hidden');
      /** @type {HTMLElement | null} */ (modal.querySelector('.modal'))?.focus();
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

    const picker = settingsModal.querySelector('.word-length-picker');
    if (picker) {
      for (const btn of picker.querySelectorAll('.word-length-btn')) {
        btn.addEventListener('click', () => {
          const newLength = Number((/** @type {HTMLElement} */ (btn)).dataset.length);
          if (newLength && newLength !== this.#wordLength) this.#rebuild(newLength, settingsModal);
        });
      }
    }

    const hardModeToggle = /** @type {HTMLInputElement | null} */ (document.getElementById('hard-mode-toggle'));
    if (hardModeToggle) {
      hardModeToggle.checked = Storage.getHardMode();
      hardModeToggle.addEventListener('change', () => {
        this.#game?.setHardMode(hardModeToggle.checked);
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
   * @description Called statically so the DOM can be built before the instance exists.
   * Sets two CSS variables that drive the grid layout.
   * @param {number} wordLength - Controls the initial grid dimensions.
   * @returns {InterfaceElements} Named references to every persistent DOM element.
   */
  static createInterface(wordLength) {
    const { maxGuesses, keys, translations } = Config;
    const gridLength = maxGuesses * wordLength;

    document.documentElement.style.setProperty('--word-length', String(wordLength));
    document.documentElement.style.setProperty('--max-guesses', String(maxGuesses));

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

    const main = createElement('main', {
      parent: document.body,
      attributes: { id: 'main' },
    });

    const scoreboard = createElement('div', {
      parent: main,
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
      parent: main,
      attributes: { id: 'guess-grid' },
      children: createArray(gridLength, () => createElement('div', { attributes: { class: 'tile' } }))
    });

    const keyboard = createElement('div', {
      parent: main,
      attributes: { id: 'keyboard' },
    });

    for (const key of swappedKeys) {
      const isDelete = key === 'Delete';
      createElement('button', {
        parent: keyboard,
        attributes: {
          class: 'key',
          'data-key': key,
          ...(isDelete && { 'aria-label': translations.deleteAriaLabel }),
        },
        ...(isDelete ? { children: [createDeleteKeySVG(key)] } : { textContent: key }),
      });
    }

    const notification = createElement('div', {
      parent: main,
      attributes: { id: 'notification' }
    });

    const helpModal = createHelpModal();
    document.body.append(helpModal);

    const settingsModal = createSettingsModal();
    document.body.append(settingsModal);

    return { scoreboard, grid, keyboard, notification, helpModal, settingsModal };
  }
}
