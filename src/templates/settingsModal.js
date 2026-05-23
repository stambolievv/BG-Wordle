import { createElement } from '../utilities';
import Config from '../config';

/**
 * @description Returns the settings overlay detached and hidden; the caller appends it and
 * wires the open/close interactions. Element IDs and data attributes are the shared contract
 * with the caller's event wiring — rename any of them and the wiring breaks.
 * @returns {HTMLElement} The modal overlay element.
 */
export function createSettingsModal() {
  const { translations: t } = Config;

  const modal = createElement('div', {
    attributes: { id: 'settings-modal', class: 'modal-overlay', hidden: '' },
  });

  const inner = createElement('div', {
    parent: modal,
    attributes: {
      class: 'modal',
      tabindex: '-1',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': t.settingsTitle,
    },
    children: [
      createElement('div', {
        attributes: { class: 'modal-header' },
        children: [
          createElement('h2', { textContent: t.settingsTitle }),
          createElement('button', { attributes: { class: 'modal-close', 'aria-label': t.modalClose }, textContent: '✕' }),
        ],
      }),
    ],
  });

  const body = createElement('div', { parent: inner, attributes: { class: 'modal-body' } });
  body.innerHTML = /* html */ `
    <div class="setting-row setting-row--column">
      <strong class="setting-label">${t.wordLengthTitle}</strong>
      <div class="word-length-picker">
        ${Config.wordLengthOptions.map(n => `<button class="word-length-btn" data-length="${n}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="setting-row">
      <div class="setting-label">
        <strong>${t.hardModeTitle}</strong>
        <span>${t.hardModeDesc}</span>
      </div>
      <label class="toggle">
        <input type="checkbox" id="hard-mode-toggle">
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    </div>
    <div class="setting-row">
      <div class="setting-label">
        <strong>${t.swapButtonsTitle}</strong>
        <span>${t.swapButtonsDesc}</span>
      </div>
      <label class="toggle">
        <input type="checkbox" id="swap-buttons-toggle">
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    </div>
    <div class="setting-row">
      <div class="setting-label">
        <strong>${t.darkThemeTitle}</strong>
      </div>
      <label class="toggle">
        <input type="checkbox" id="dark-theme-toggle" checked>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    </div>
  `;

  return modal;
}
