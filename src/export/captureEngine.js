/**
 * Browser-safe upper bound for total canvas pixels.
 *
 * @type {number}
 */
export const MAX_CANVAS_PIXELS = 16384 * 16384;

/**
 * Computes a safe html2canvas scale under pixel budget.
 *
 * @param {number} contentW
 * @param {number} contentH
 * @param {number} [desiredScale=2]
 * @returns {number}
 */
export function computeSafeScale(contentW, contentH, desiredScale = 2) {
  const w = Number(contentW) || 0;
  const h = Number(contentH) || 0;
  const desired = Math.max(1, Number(desiredScale) || 2);

  if (w <= 0 || h <= 0) return 1;

  const safeBudget = MAX_CANVAS_PIXELS * 0.85;
  const maxScaleByPixels = Math.sqrt(safeBudget / (w * h));
  const bounded = Math.min(desired, maxScaleByPixels);

  if (!Number.isFinite(bounded) || bounded < 1) return 1;
  return bounded;
}

/**
 * Captures an offscreen export layer using html2canvas with guarded dimensions.
 *
 * @param {HTMLElement} containerElement
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function captureOffscreenLayer(containerElement) {
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    throw new Error('captureOffscreenLayer: containerElement must be a valid HTMLElement');
  }

  const width = containerElement.offsetWidth;
  const height = containerElement.offsetHeight;

  if (!width || !height) {
    throw new Error(`captureOffscreenLayer: invalid container size (${width}x${height})`);
  }

  if (typeof globalThis.html2canvas !== 'function') {
    throw new Error('captureOffscreenLayer: html2canvas is not available on window');
  }

  const scale = computeSafeScale(width, height, 2);
  // Nuclear patch: walk entire clone and strip color() from ALL computed styles
// Chrome on some displays converts colors to color() format which html2canvas rejects
const allEls = containerElement.querySelectorAll('*');
allEls.forEach(el => {
  try {
    const computed = window.getComputedStyle(el);
    const colorProps = [
      'color','background-color','border-color','border-top-color',
      'border-bottom-color','border-left-color','border-right-color',
      'outline-color','text-decoration-color','column-rule-color',
      'fill','stroke'
    ];
    colorProps.forEach(prop => {
      try {
        const val = computed.getPropertyValue(prop);
        if (val && val.includes('color(')) {
          el.style.setProperty(prop, '#000000', 'important');
        }
      } catch(_) {}
    });
  } catch(_) {}
});

  const canvas = await globalThis.html2canvas(containerElement, {
    scale,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: false,
    backgroundColor: '#ffffff',
    logging: false,
    ignoreElements: (el) => (el.id === 'export-offscreen-layer' ? false : false),
  });

  if (!canvas) {
    throw new Error('captureOffscreenLayer: html2canvas returned null canvas');
  }

  if (!canvas.width || !canvas.height) {
    throw new Error(`captureOffscreenLayer: invalid canvas output (${canvas.width}x${canvas.height})`);
  }

  return canvas;
}
