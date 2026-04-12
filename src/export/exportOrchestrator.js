export async function exportBracket(type) {
  const btn = document.querySelector('#bracket-export-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }

  try {
    if (typeof domtoimage === 'undefined') throw new Error('dom-to-image-more not loaded');

    const tourney = document.querySelector('#tourney-bar');
    const center  = document.querySelector('#center-panel');
    if (!center) throw new Error('#center-panel not found');

    const isBracket = center.classList.contains('bracket-active') ||
                      !!center.querySelector('#bracket-container, .bracket-container, [id*="bracket-wrap"]');

    const bgColor = isBracket ? '#3d0000' : 'transparent';
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:fixed;left:-99999px;top:0;z-index:-1;display:flex;flex-direction:column;min-width:1400px;background:${bgColor};`;

    if (tourney) {
      const t = tourney.cloneNode(true);
      t.style.cssText += ';position:relative;width:100%;flex-shrink:0;';
      wrap.appendChild(t);
    }

    const centerClone = center.cloneNode(true);

    if (isBracket) {
      centerClone.style.cssText = 'position:relative;width:100%;overflow:visible;height:auto;max-height:none;flex:1;';
    } else {
      centerClone.style.cssText = 'position:relative;width:100%;overflow:visible;height:auto;max-height:none;flex:1;';
      centerClone.querySelectorAll('*').forEach(el => {
        const cs = window.getComputedStyle(el);
        if (cs.overflowY === 'scroll' || cs.overflowY === 'auto' ||
            cs.overflow === 'scroll' || cs.overflow === 'auto') {
          el.style.overflow = 'visible';
          el.style.height = 'auto';
          el.style.maxHeight = 'none';
        }
      });
    }

    wrap.appendChild(centerClone);
    document.body.appendChild(wrap);

    void wrap.offsetWidth;
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 400));

    const W = Math.max(wrap.scrollWidth, wrap.offsetWidth, 1400);
    const H = Math.max(wrap.scrollHeight, wrap.offsetHeight, 800);
    wrap.style.width = W + 'px';
    wrap.style.height = H + 'px';
    void wrap.offsetWidth;
    await new Promise(r => requestAnimationFrame(r));

    console.log('[Export] bracket:', isBracket, 'size:', W, 'x', H);

    const dataUrl = await domtoimage.toPng(wrap, {
      width: W, height: H,
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

    if (type === 'png') {
      const a = document.createElement('a');
      a.download = 'bracket.png';
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const jsPDF = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
      if (!jsPDF) throw new Error('jsPDF not loaded');
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
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
