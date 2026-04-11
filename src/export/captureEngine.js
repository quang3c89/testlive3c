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
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    throw new Error('captureOffscreenLayer: invalid element');
  }

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
  });

  if (!canvas || !canvas.width || !canvas.height) {
    throw new Error('captureOffscreenLayer: invalid canvas output');
  }
  return canvas;
}
