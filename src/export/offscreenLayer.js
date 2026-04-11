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

  const layer = document.createElement('div');
  layer.id = OFFSCREEN_LAYER_ID;
  layer.style.position = 'fixed';
  layer.style.left = '-100000px';
  layer.style.top = '0';
  layer.style.width = `${Math.max(1, Number(size?.contentW) || 1)}px`;
  layer.style.height = `${Math.max(1, Number(size?.contentH) || 1)}px`;
  layer.style.overflow = 'hidden';
  layer.style.pointerEvents = 'none';
  layer.style.opacity = '1';
  layer.style.background = '#ffffff';
  layer.setAttribute('aria-hidden', 'true');

  if (typeof stylesheet === 'string' && stylesheet.trim()) {
    layer.insertAdjacentHTML('beforeend', stylesheet);
  }

  const mount = document.createElement('div');
  mount.style.position = 'relative';
  mount.style.width = '100%';
  mount.style.height = '100%';
  layer.appendChild(mount);

  cloneBracketDOM('#bracket-container', mount, colors);

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
