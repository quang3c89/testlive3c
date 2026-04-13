/**
 * Downloads a canvas as multi-page A4 PDF.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} [filename='sema.live3c.pdf']
 * @returns {Promise<void>}
 */
export async function downloadAsPDF(canvas, filename = 'sema.live3c.pdf') {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Invalid canvas provided for PDF export');
  }

  try {
    const jsPDFCtor = globalThis?.jspdf?.jsPDF;
    if (!jsPDFCtor) {
      throw new Error('jsPDF not loaded — PDF export unavailable');
    }

    const pdf = new jsPDFCtor('p', 'mm', 'a4');

    const pageW = 210;
    const pageH = 297;
    const margin = 8;
    const usableW = pageW - margin * 2; // 194
    const usableH = pageH - margin * 2; // 281

    const srcW = canvas.width;
    const srcH = canvas.height;

    if (!srcW || !srcH) {
      throw new Error('Canvas has invalid dimensions for PDF export');
    }

    const scale = usableW / srcW; // mm per pixel when fit to usable width
    const pageSlicePx = Math.floor(usableH / scale);
    if (pageSlicePx <= 0) {
      throw new Error('Computed PDF slice height is invalid');
    }

    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < srcH) {
      const sliceH = Math.min(pageSlicePx, srcH - offsetY);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = srcW;
      tempCanvas.height = sliceH;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error('Unable to create temporary canvas context for PDF export');

      ctx.drawImage(canvas, 0, offsetY, srcW, sliceH, 0, 0, srcW, sliceH);

      const renderH = sliceH * scale;
      const imgData = tempCanvas.toDataURL('image/jpeg', 0.92);

      pdf.addImage(imgData, 'JPEG', margin, margin, usableW, renderH);

      offsetY += sliceH;
      pageIndex += 1;
      if (offsetY < srcH) {
        pdf.addPage();
      }
    }

    pdf.save(filename);
  } catch (err) {
    if (err instanceof Error && err.message.includes('jsPDF not loaded')) {
      throw err;
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}
