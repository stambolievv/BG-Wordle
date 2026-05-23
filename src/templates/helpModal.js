import { createElement } from '../utilities';
import Config from '../config';

/**
 * @description Returns the help overlay detached and hidden; the caller appends it and
 * wires the open/close interactions. Body content comes entirely from `Config.translations`
 * at build time, so using `innerHTML` here carries no XSS risk.
 * @returns {HTMLElement} The modal overlay element.
 */
export function createHelpModal() {
  const { translations: t } = Config;

  const modal = createElement('div', {
    attributes: { id: 'help-modal', class: 'modal-overlay', hidden: '' },
  });

  const inner = createElement('div', {
    parent: modal,
    attributes: {
      class: 'modal',
      tabindex: '-1',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': t.helpTitle,
    },
    children: [
      createElement('div', {
        attributes: { class: 'modal-header' },
        children: [
          createElement('h2', { textContent: t.helpTitle }),
          createElement('button', { attributes: { class: 'modal-close', 'aria-label': t.modalClose }, textContent: '✕' }),
        ],
      }),
    ],
  });

  const body = createElement('div', { parent: inner, attributes: { class: 'modal-body' } });

  const [e1a, e1b, e1c, e1d, e1e] = t.helpExample1Letters;
  const [e2a, e2b, e2c, e2d, e2e] = t.helpExample2Letters;
  const [e3a, e3b, e3c, e3d, e3e] = t.helpExample3Letters;

  body.innerHTML = /* html */ `
    <p>${t.helpRule1}</p>
    <ul>
      <li>${t.helpRule2}</li>
      <li>${t.helpRule3}</li>
    </ul>
    <hr>
    <p><strong>${t.helpExamplesHeading}</strong></p>
    <div>
      <div class="example-row">
        <div class="example-tile correct-spot">${e1a}</div>
        <div class="example-tile">${e1b}</div>
        <div class="example-tile">${e1c}</div>
        <div class="example-tile">${e1d}</div>
        <div class="example-tile">${e1e}</div>
      </div>
      <p>${t.helpExample1Desc}</p>
    </div>
    <div>
      <div class="example-row">
        <div class="example-tile">${e2a}</div>
        <div class="example-tile wrong-spot">${e2b}</div>
        <div class="example-tile">${e2c}</div>
        <div class="example-tile">${e2d}</div>
        <div class="example-tile">${e2e}</div>
      </div>
      <p>${t.helpExample2Desc}</p>
    </div>
    <div>
      <div class="example-row">
        <div class="example-tile">${e3a}</div>
        <div class="example-tile">${e3b}</div>
        <div class="example-tile">${e3c}</div>
        <div class="example-tile missing-spot">${e3d}</div>
        <div class="example-tile">${e3e}</div>
      </div>
      <p>${t.helpExample3Desc}</p>
    </div>
    <hr>
    <p>${t.helpFooter}</p>
  `;

  return modal;
}
