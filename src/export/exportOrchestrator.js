export async function exportBracket(type) {
  const btn = document.querySelector('#bracket-export-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }

  try {
    // Find the center panel that contains everything visible
    const target = 
      document.querySelector('#center-panel') ||
      document.querySelector('.center-panel') ||
      document.querySelector('#bracket-container') ||
      document.querySelector('.bracket-wrapper') ||
      document.body;

    console.log('[Export] target:', target?.id || target?.className);
    console.log('[Export] size:', target?.scrollWidth, 'x', target?.scrollHeight);

    const W = Math.max(target.scrollWidth, target.offsetWidth, window.innerWidth);
    const H = Math.max(target.scrollHeight, target.offsetHeight, window.innerHeight);

    // Use dom-to-image-more directly on live element
    if (typeof domtoimage === 'undefined') {
      throw new Error('dom-to-image-more not loaded');
    }

    const dataUrl = await domtoimage.toPng(target, {
      width: W,
      height: H,
      bgcolor: null,
      filter: (node) => {
        // Skip export button itself
        if (node.id === 'bracket-export-btn') return false;
        if (node.classList?.contains('export-menu')) return false;
        return true;
      }
    });

    if (type === 'png') {
      const a = document.createElement('a');
      a.download = 'bracket.png';
      a.href = dataUrl;
      a.click();
    } else {
      // PDF
      if (typeof jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        throw new Error('jsPDF not loaded');
      }
      const jsPDF = window.jsPDF || jspdf.jsPDF;
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
      
      const pdf = new jsPDF({ 
        orientation: W > H ? 'landscape' : 'portrait',
        unit: 'px', 
        format: [W, H] 
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, W, H);
      pdf.save('bracket.pdf');
    }

  } catch(err) {
    console.error('[Export] Failed:', err);
    alert('Export lỗi: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
    if (typeof globalThis.closeExportMenu === 'function') globalThis.closeExportMenu();
    if (typeof globalThis.closeBracketExportMenu === 'function') globalThis.closeBracketExportMenu();
  }
}

window.exportBracket = exportBracket;
