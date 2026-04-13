/**
 * Detects iOS Safari / in-app browser environments where direct download
 * is unreliable and opening a new tab is safer.
 *
 * @returns {boolean}
 */
function shouldUseMobileFallback() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInApp = /Instagram|FBAN|FBAV|Line/i.test(ua);
  const hasStandalone = 'standalone' in window.navigator;

  return isIOS || (isInApp && !hasStandalone);
}

/**
 * Downloads a canvas as PNG, with mobile-safe fallback behavior.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} [filename='sema.live3c.png']
 * @returns {Promise<{ success: true, size: number }>}
 */
export async function downloadAsPNG(canvas, filename = 'sema.live3c.png') {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Invalid canvas provided for PNG export');
  }

  const blob = await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => {
        if (!b) {
          reject(new Error('Failed to create PNG blob from canvas'));
          return;
        }
        resolve(b);
      }, 'image/png');
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });

  const objectURL = URL.createObjectURL(blob);

  if (shouldUseMobileFallback()) {
    window.open(objectURL, '_blank', 'noopener,noreferrer');
  } else {
    const a = document.createElement('a');
    a.download = filename;
    a.href = objectURL;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  setTimeout(() => {
    URL.revokeObjectURL(objectURL);
  }, 60000);

  return { success: true, size: blob.size };
}
