export async function exportBracket(type) {
  const btn = document.querySelector('#bracket-export-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }

  try {
    if (typeof domtoimage === 'undefined') throw new Error('dom-to-image-more not loaded');

    const tourney = document.querySelector('#tourney-bar');
    const center  = document.querySelector('#center-panel');
    if (!center) throw new Error('#center-panel not found');

    // Detect tab by content
    const isSchedule = center.classList.contains('schedule-active');
    const isBracket  = !isSchedule && !!center.querySelector('#bracket-container, .bracket-wrap');
    const isList     = !isSchedule && !isBracket;

    console.log('[Export] tab:', isSchedule ? 'schedule' : isBracket ? 'bracket' : 'list');

    const tourneyCv = tourney
      ? await domtoimage.toCanvas(tourney, {
          imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          cacheBust: true,
        }).catch(() => null)
      : null;

    let centerCv;

    if (isBracket) {
      // Bracket: temporarily expand overflow to capture full width
      const origOverflow = center.style.overflow;
      const origW = center.style.width;
      const trueW = center.scrollWidth;
      const trueH = center.scrollHeight;
      center.style.overflow = 'visible';
      center.style.width = trueW + 'px';
      void center.offsetWidth;
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 200));

      centerCv = await domtoimage.toCanvas(center, {
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

      center.style.overflow = origOverflow;
      center.style.width = origW;

    } else {
      // List/Schedule: expand scroll containers in a clone
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;left:-99999px;top:0;z-index:-1;';
      const clone = center.cloneNode(true);
      clone.style.cssText = 'position:relative;width:' + center.offsetWidth + 'px;overflow:visible;height:auto;max-height:none;';
      clone.querySelectorAll('*').forEach(el => {
        const cs = window.getComputedStyle(el);
        if (cs.overflow === 'hidden' || cs.overflow === 'scroll' || cs.overflow === 'auto' ||
            cs.overflowY === 'scroll' || cs.overflowY === 'auto') {
          el.style.overflow = 'visible';
          el.style.height = 'auto';
          el.style.maxHeight = 'none';
        }
      });
      wrap.appendChild(clone);
      document.body.appendChild(wrap);
      void wrap.offsetWidth;
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 300));

      const W = Math.max(clone.scrollWidth, clone.offsetWidth);
      const H = Math.max(clone.scrollHeight, clone.offsetHeight);

      centerCv = await domtoimage.toCanvas(clone, {
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

      wrap.remove();
    }

    // Merge header + center
    const W = Math.max(tourneyCv ? tourneyCv.width : 0, centerCv.width);
    const headerH = tourneyCv ? tourneyCv.height : 0;
    const H = headerH + centerCv.height;

    const final = document.createElement('canvas');
    final.width  = W;
    final.height = H;
    const ctx = final.getContext('2d');
    if (tourneyCv) ctx.drawImage(tourneyCv, 0, 0, W, headerH);
    ctx.drawImage(centerCv, 0, headerH, W, centerCv.height);

    if (type === 'png') {
      final.toBlob(blob => {
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
      const dataUrl = final.toDataURL('image/png');
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
