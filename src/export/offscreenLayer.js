import { cloneBracketDOM } from './bracketCloner.js';

const OFFSCREEN_LAYER_ID = 'export-offscreen-layer';

/**
 * Creates an offscreen export layer and injects a cleaned bracket clone.
 *
 * @param {{ contentW: number, contentH: number }} size
 * @param {import('./exportUtils.js').ExportColors} colors
 * @param {string} stylesheet
 * @returns {HTMLElement}
 */
export function createOffscreenLayer(size, colors, stylesheet) {
  destroyOffscreenLayer();

  const header = document.querySelector('.tournament-header')
    || document.querySelector('#tournament-header')
    || document.querySelector('header')
    || document.querySelector('.bracket-header');
  const headerH = header ? header.offsetHeight : 0;

  const layer = document.createElement('div');
  layer.id = OFFSCREEN_LAYER_ID;
  layer.style.position = 'fixed';
  layer.style.left = '-100000px';
  layer.style.top = '0';
  layer.style.width = `${Math.max(1, Number(size?.contentW) || 1)}px`;
  layer.style.height = `${Math.max(1, Number(size?.contentH) || 1) + headerH}px`;
  layer.style.overflow = 'visible';
  layer.style.pointerEvents = 'none';
  layer.style.opacity = '1';
  layer.style.background = '#ffffff';
  layer.setAttribute('aria-hidden', 'true');

  if (typeof stylesheet === 'string' && stylesheet.trim()) {
    const styleEl = document.createElement('style');
    styleEl.textContent = stylesheet;
    layer.appendChild(styleEl);
  }

  // Preserve background gradient for bracket container
  const bgStyle = document.createElement('style');
  bgStyle.textContent = `
    #bracket-container, .bracket-container {
      background: radial-gradient(ellipse at center, #8B0000 0%, #3D0000 40%, #1a0000 100%) !important;
    }
  `;
  layer.appendChild(bgStyle);

  const mount = document.createElement('div');
  mount.style.position = 'relative';
  mount.style.width = '100%';
  mount.style.height = '100%';
  layer.appendChild(mount);

  cloneBracketDOM('#bracket-container', mount, colors);

  // Also clone the tournament header
  if (header) {
    const headerClone = header.cloneNode(true);
    headerClone.style.position = 'relative';
    headerClone.style.width = '100%';
    mount.insertBefore(headerClone, mount.firstChild);
  }

  document.body.appendChild(layer);
  return layer;
}

/**
 * Removes the offscreen export layer if it exists.
 *
 * @returns {void}
 */
export function destroyOffscreenLayer() {
  const old = document.getElementById(OFFSCREEN_LAYER_ID);
  if (old) old.remove();
}
