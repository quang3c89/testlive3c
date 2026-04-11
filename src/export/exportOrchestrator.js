import { resolveExportColors, buildExportStylesheet } from './exportUtils.js';
import { createOffscreenLayer, destroyOffscreenLayer } from './offscreenLayer.js';
import { captureOffscreenLayer } from './captureEngine.js';
import { downloadAsPNG } from './pngExporter.js';
import { downloadAsPDF } from './pdfExporter.js';

/**
 * Shows export error using existing app hook if present.
 * Falls back to alert() for compatibility.
 *
 * @param {string} message
 * @returns {void}
 */
function showExportErrorSafe(message) {
  if (typeof globalThis.showExportError === 'function') {
    globalThis.showExportError(message);
    return;
  }
  alert(message || 'Export failed');
}

/**
 * Closes export submenu using existing app hook if present.
 *
 * @returns {void}
 */
function closeExportMenuSafe() {
  if (typeof globalThis.closeExportMenu === 'function') {
    globalThis.closeExportMenu();
    return;
  }
  if (typeof globalThis.closeBracketExportMenu === 'function') {
    globalThis.closeBracketExportMenu();
  }
}

/**
 * Exports bracket as PNG or PDF from an offscreen render layer.
 *
 * NOTE:
 * contentW/contentH is currently derived from scroll/client box metrics.
 * This may be inaccurate if the live container uses overflow clipping.
 * TODO: switch to data-driven sizing from bracket model in future task.
 *
 * @param {'png'|'pdf'} type
 * @returns {Promise<void>}
 */
export async function exportBracket(type) {
  if (type !== 'png' && type !== 'pdf') {
    throw new Error("Invalid export type. Expected 'png' or 'pdf'");
  }

  const exportBtn = document.querySelector('#bracket-export-btn');
  if (exportBtn instanceof HTMLButtonElement) {
    exportBtn.disabled = true;
    exportBtn.classList.add('loading');
  }

  try {
    const source = document.querySelector('#bracket-container');
    if (!(source instanceof HTMLElement)) {
      throw new Error('Bracket container not found: #bracket-container');
    }

    // PHASE 1 — data snapshot
    const colors = resolveExportColors(source);
    const stylesheet = buildExportStylesheet(colors);
    const contentW = Math.max(source.scrollWidth || 0, source.clientWidth || 0);
    const contentH = Math.max(source.scrollHeight || 0, source.clientHeight || 0);

    if (!contentW || !contentH) {
      throw new Error('Bracket dimensions are invalid for export');
    }

    // PHASE 2 — offscreen render
    const offscreen = createOffscreenLayer({ contentW, contentH }, colors, stylesheet);

    // PHASE 3 — capture
    const canvas = await captureOffscreenLayer(offscreen);

    // PHASE 4 — output
    if (type === 'png') {
      await downloadAsPNG(canvas);
    } else {
      await downloadAsPDF(canvas);
    }
  } catch (err) {
    console.error('[BracketExport] Failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    showExportErrorSafe(message);
  } finally {
    destroyOffscreenLayer();
    if (exportBtn instanceof HTMLButtonElement) {
      exportBtn.disabled = false;
      exportBtn.classList.remove('loading');
    }
    closeExportMenuSafe();
  }
}
