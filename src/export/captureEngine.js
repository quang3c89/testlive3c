<<<<<<< HEAD
=======
/**
 * Patches getComputedStyle reads to downgrade unsupported `color(...)` values
 * before html2canvas traverses and parses styles.
 *
 * @returns {void}
 */
function patchHtml2canvasColorParser() {
  if (window.__h2c_color_patched) return;
  window.__h2c_color_patched = true;

  const origGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function patchedGetComputedStyle(el, pseudo) {
    const style = origGetComputedStyle.call(window, el, pseudo);
    return new Proxy(style, {
      get(target, prop) {
        const val = target[prop];
        if (typeof val === 'string' && val.trim().startsWith('color(')) {
          return '#000000';
        }
        if (typeof val === 'function') return val.bind(target);
        return val;
      },
    });
  };
}

/**
 * Browser-safe upper bound for total canvas pixels.
 *
 * @type {number}
 */
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
export const MAX_CANVAS_PIXELS = 16384 * 16384;

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

export async function captureOffscreenLayer(containerElement) {
  patchHtml2canvasColorParser();

  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    throw new Error('captureOffscreenLayer: invalid element');
  }

<<<<<<< HEAD
  const width = Math.max(
    containerElement.offsetWidth,
    containerElement.scrollWidth,
    parseInt(containerElement.style.width) || 0
  );
  const height = Math.max(
    containerElement.offsetHeight,
    containerElement.scrollHeight,
    parseInt(containerElement.style.height) || 0
  );

  console.log('[CaptureEngine] size:', width, 'x', height);
=======
 // force reflow before reading dimensions
void containerElement.offsetWidth;
const width = Math.max(
  containerElement.offsetWidth,
  containerElement.scrollWidth,
  parseInt(containerElement.style.width) || 0
);
const height = Math.max(
  containerElement.offsetHeight,
  containerElement.scrollHeight,
  parseInt(containerElement.style.height) || 0
);
console.log('[CaptureEngine] dimensions:', width, 'x', height);
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)

  if (!width || !height) {
    throw new Error(`captureOffscreenLayer: invalid size (${width}x${height})`);
  }

  const scale = computeSafeScale(width, height, 2);

  // Use dom-to-image-more — handles modern CSS including color() syntax
  if (typeof domtoimage !== 'undefined') {
    console.log('[CaptureEngine] using dom-to-image-more, scale:', scale);
    const blob = await domtoimage.toBlob(containerElement, {
      width: width * scale,
      height: height * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: width + 'px',
        height: height + 'px',
      },
      bgcolor: '#0f0f1a',
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    });
    return await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Fallback to html2canvas
  if (typeof globalThis.html2canvas !== 'function') {
    throw new Error('captureOffscreenLayer: no capture library available');
  }
  console.log('[CaptureEngine] fallback to html2canvas');
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
    backgroundColor: '#0f0f1a',
    logging: false,
<<<<<<< HEAD
=======
    ignoreElements: (el) => (el.id === 'export-offscreen-layer' ? false : false),
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('*').forEach((el) => {
        const s = el.style;
        if (!s) return;
        ['color','backgroundColor','borderColor','outlineColor','fill','stroke','caretColor'].forEach((prop) => {
          try {
            const v = s.getPropertyValue(prop);
            if (v && v.trim().startsWith('color(')) {
              s.setProperty(prop, '#000000', 'important');
            }
          } catch (_) {}
        });
      });

      const style = clonedDoc.createElement('style');
      style.textContent = `
        :root, * {
          color-scheme: light only !important;
          forced-color-adjust: none !important;
        }
        * {
          --color-primary: #3b82f6 !important;
          --color-accent: #8b5cf6 !important;
          --color-bg: #ffffff !important;
          --color-text: #1a1a1a !important;
          --color-border: #334155 !important;
        }
      `;
      clonedDoc.head.insertBefore(style, clonedDoc.head.firstChild);
    },
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
  });

  if (!canvas || !canvas.width || !canvas.height) {
    throw new Error('captureOffscreenLayer: invalid canvas output');
  }
  return canvas;
}
