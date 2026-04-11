/**
 * @typedef {Object} ExportColors
 * @property {string} bg
 * @property {string} card
 * @property {string} text
 * @property {string} border
 * @property {string} primary
 * @property {string} accent
 */

const SAFE_LINE_COLOR = '#2563eb';

/**
 * Removes unwanted nodes from export clone.
 *
 * @param {HTMLElement} root
 * @returns {void}
 */
function stripUnwantedNodes(root) {
  const selectors = [
    'script',
    'video',
    '#bracket-bg-layer',
    '#sponsor-stage',
    '[data-export-ignore]',
    '[class*="bracket-bg-"]',
  ];

  root.querySelectorAll(selectors.join(',')).forEach((node) => node.remove());
}

/**
 * Applies flat inline export styles to cloned tree.
 *
 * @param {HTMLElement} root
 * @param {ExportColors} colors
 * @returns {void}
 */
function applyInlineExportStyles(root, colors) {
  const c = {
    bg: colors?.bg || '#ffffff',
    card: colors?.card || '#ffffff',
    text: colors?.text || '#111827',
    border: colors?.border || '#d1d5db',
    primary: colors?.primary || SAFE_LINE_COLOR,
    accent: colors?.accent || SAFE_LINE_COLOR,
  };

  root.style.setProperty('background', c.bg, 'important');
  root.style.setProperty('color', c.text, 'important');
  root.style.setProperty('border-color', c.border, 'important');
  root.style.setProperty('box-shadow', 'none', 'important');
  root.style.setProperty('filter', 'none', 'important');
  root.style.setProperty('transform', 'none', 'important');
  root.style.setProperty('animation', 'none', 'important');
  root.style.setProperty('transition', 'none', 'important');
  root.dataset.exportStroke = c.primary;

  root.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();

    el.style.setProperty('animation', 'none', 'important');
    el.style.setProperty('transition', 'none', 'important');
    el.style.setProperty('filter', 'none', 'important');
    el.style.setProperty('backdrop-filter', 'none', 'important');
    el.style.setProperty('transform', 'none', 'important');
    el.style.setProperty('box-shadow', 'none', 'important');
    el.style.setProperty('text-shadow', 'none', 'important');

    if (
      el.classList.contains('mp') ||
      el.classList.contains('bracket-cell') ||
      el.classList.contains('register-item') ||
      el.classList.contains('sched-match') ||
      el.classList.contains('round-col')
    ) {
      el.style.setProperty('background', c.card, 'important');
      el.style.setProperty('border-color', c.border, 'important');
      el.style.setProperty('color', c.text, 'important');
    }

    if (['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'td', 'th', 'a', 'div'].includes(tag)) {
      el.style.setProperty('color', c.text, 'important');
    }

    if (el.classList.contains('bracket-line') || el.id === 'bracket-lines') {
      el.style.setProperty('color', c.primary, 'important');
      el.style.setProperty('stroke', c.primary, 'important');
    }
  });
}

/**
 * Deep-clones bracket DOM and prepares a static export tree.
 *
 * @param {string} sourceSelector
 * @param {HTMLElement} targetContainer
 * @param {ExportColors} colors
 * @returns {HTMLElement}
 */
export function cloneBracketDOM(sourceSelector, targetContainer, colors) {
  const source = document.querySelector(sourceSelector);
  if (!source || !(source instanceof HTMLElement)) {
    throw new Error(`Source element not found: ${sourceSelector}`);
  }
  if (!targetContainer || !(targetContainer instanceof HTMLElement)) {
    throw new Error('targetContainer must be a valid HTMLElement');
  }

  const clone = /** @type {HTMLElement} */ (source.cloneNode(true));
  stripUnwantedNodes(clone);
  applyInlineExportStyles(clone, colors);

  const oldLinesSvg = clone.querySelector('#bracket-lines');
  if (oldLinesSvg) oldLinesSvg.remove();
  injectSVGLines(clone, colors);

  targetContainer.appendChild(clone);
  return clone;
}

/**
 * Injects bracket SVG lines from dataset line cache.
 *
 * Expects `containerElement.dataset.lines` to be valid JSON array with objects:
 * `{ path, isLeftSide, hasWinner, points }`.
 *
 * If dataset is missing or invalid, logs warning and exits gracefully.
 *
 * @param {HTMLElement} containerElement
 * @param {ExportColors} colors
 * @returns {void}
 */
export function injectSVGLines(containerElement, colors) {
  if (!containerElement || !(containerElement instanceof HTMLElement)) return;

  const raw = containerElement.dataset?.lines;
  if (!raw) {
    console.warn('[bracketCloner] Missing dataset.lines on export container');
    return;
  }

  /** @type {Array<{path?: string, isLeftSide?: boolean, hasWinner?: boolean, points?: unknown}>} */
  let lines;
  try {
    const parsed = JSON.parse(raw);
    lines = Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    console.warn('[bracketCloner] Invalid dataset.lines JSON; SVG lines skipped');
    return;
  }

  if (!lines.length) return;

  const ns = 'http://www.w3.org/2000/svg';
  let svg = containerElement.querySelector('#bracket-lines-export');
  if (!svg) {
    svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('id', 'bracket-lines-export');
    svg.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;');
    containerElement.appendChild(svg);
  }

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const primary = colors?.primary || SAFE_LINE_COLOR;
  const border = colors?.border || '#d1d5db';

  lines.forEach((lineObj) => {
    if (typeof lineObj?.path !== 'string' || !lineObj.path.trim()) return;

    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', lineObj.path);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', lineObj.hasWinner ? primary : border);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
  });
}
