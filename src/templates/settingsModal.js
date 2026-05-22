import { createElement } from '../utilities';
import Config from '../config';

/**
 * @description Builds the settings overlay modal and returns it detached so the
 * caller can append it to the document and wire up open/close logic.
 * @returns {HTMLElement} The modal overlay element.
 */
export function createSettingsModal() {
  const { translations: t } = Config;

  const modal = createElement('div', {
    attributes: { id: 'settings-modal', class: 'modal-overlay', hidden: '' },
  });

  const inner = createElement('div', {
    parent: modal,
    attributes: { class: 'modal' },
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
  body.innerHTML = `
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
