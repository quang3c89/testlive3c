export async function exportBracket(type) {
  const btn = document.querySelector('#bracket-export-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }

  try {
    if (typeof domtoimage === 'undefined') throw new Error('dom-to-image-more not loaded');

    const tourney = document.querySelector('#tourney-bar');
    const center  = document.querySelector('#center-panel');
    if (!center) throw new Error('#center-panel not found');

    const isBracket = !!center.querySelector('#bracket-container, .bracket-wrap');

    // Step 1: capture header
    let headerCv = null;
    if (tourney) {
      headerCv = await domtoimage.toCanvas(tourney, {
        imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        cacheBust: true,
      }).catch(() => null);
    }

    // Step 2: expand bracket if needed
    const origOverflow = center.style.overflow;
    const origWidth    = center.style.width;
    if (isBracket) {
      const trueW = center.scrollWidth;
      center.style.overflow = 'visible';
      center.style.width    = trueW + 'px';
      void center.offsetWidth;
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 200));
    }

    // Step 3: capture center
    const W = Math.max(center.scrollWidth, center.offsetWidth);
    const H = Math.max(center.scrollHeight, center.offsetHeight);

    const centerCv = await domtoimage.toCanvas(center, {
      width: W,
      height: H,
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

    // Step 4: restore
    if (isBracket) {
      center.style.overflow = origOverflow;
      center.style.width    = origWidth;
    }

    // Step 5: merge header + center
    const finalW = Math.max(headerCv ? headerCv.width : 0, centerCv.width);
    const headerH = headerCv ? headerCv.height : 0;
    const finalH  = headerH + centerCv.height;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width  = finalW;
    finalCanvas.height = finalH;
    const ctx = finalCanvas.getContext('2d');
    if (headerCv) ctx.drawImage(headerCv, 0, 0, finalW, headerH);
    ctx.drawImage(centerCv, 0, headerH, finalW, centerCv.height);

    // Step 6: output
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
      const orientation = finalW > finalH ? 'landscape' : 'portrait';
      const pdf = new jsPDF({ orientation, unit: 'px', format: [finalW, finalH] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, finalW, finalH);
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
