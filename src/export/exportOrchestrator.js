export async function exportBracket(type) {
  const btn = document.querySelector('#bracket-export-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }

  try {
    if (typeof domtoimage === 'undefined') throw new Error('dom-to-image-more not loaded');

    const tourney = document.querySelector('#tourney-bar');
    const center  = document.querySelector('#center-panel');
    if (!center) throw new Error('#center-panel not found');

    // Read true content dimensions before any manipulation
    const trueW = Math.max(center.scrollWidth, center.offsetWidth);
    const trueH = Math.max(center.scrollHeight, center.offsetHeight);

    // Temporarily expand center to show full content
    const origOverflow = center.style.overflow;
    const origWidth    = center.style.width;
    const origHeight   = center.style.height;
    center.style.overflow = 'visible';
    center.style.width    = trueW + 'px';
    center.style.height   = trueH + 'px';
    void center.offsetWidth;
    await new Promise(r => requestAnimationFrame(r));

    // Capture header
    let headerCanvas = null;
    if (tourney) {
      headerCanvas = await domtoimage.toCanvas(tourney, {
        imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        cacheBust: true,
      }).catch(() => null);
    }

    // Capture center with full width
    const centerCanvas = await domtoimage.toCanvas(center, {
      width: trueW,
      height: trueH,
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      cacheBust: true,
      filter: node => {
        if (!node.classList) return true;
        if (node.id === 'bracket-export-btn') return false;
        if (node.classList?.contains('export-menu')) return false;
        if (node.classList?.contains('bracket-export-menu')) return false;
        if (node.classList?.contains('bracket-tools')) return false;
        if (node.classList?.contains('zoom-controls')) return false;
        if (node.classList?.contains('mobile-tabs')) return false;
        return true;
      }
    });

    // Restore original styles immediately after capture
    center.style.overflow = origOverflow;
    center.style.width    = origWidth;
    center.style.height   = origHeight;

    // Merge header + center
    const W = Math.max(headerCanvas ? headerCanvas.width : 0, centerCanvas.width);
    const headerH = headerCanvas ? headerCanvas.height : 0;
    const H = headerH + centerCanvas.height;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width  = W;
    finalCanvas.height = H;
    const ctx = finalCanvas.getContext('2d');
    if (headerCanvas) ctx.drawImage(headerCanvas, 0, 0, W, headerH);
    ctx.drawImage(centerCanvas, 0, headerH, W, centerCanvas.height);

    if (type === 'png') {
      finalCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = 'bracket.png';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }, 'image/png');
    } else {
      const jsPDF = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
      if (!jsPDF) throw new Error('jsPDF not loaded');
      const dataUrl = finalCanvas.toDataURL('image/png');
      const orientation = W > H ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [W, H] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, W, H);
      pdf.save('bracket.pdf');
    }

  } catch(err) {
    console.error('[Export] Failed:', err);
    alert('Export lỗi: ' + err.message);
  } finally {
    const btn2 = document.querySelector('#bracket-export-btn');
    if (btn2) { btn2.disabled = false; btn2.classList.remove('loading'); }
    if (typeof globalThis.closeExportMenu === 'function') globalThis.closeExportMenu();
    if (typeof globalThis.closeBracketExportMenu === 'function') globalThis.closeBracketExportMenu();
  }
}

window.exportBracket = exportBracket;
