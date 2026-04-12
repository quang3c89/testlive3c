<<<<<<< HEAD
export async function exportBracket(type) {
  const btn = document.querySelector('#bracket-export-btn');
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }

  try {
    if (typeof domtoimage === 'undefined') throw new Error('dom-to-image-more not loaded');

    const tourney = document.querySelector('#tourney-bar');
    const center  = document.querySelector('#center-panel');
    if (!center) throw new Error('#center-panel not found');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:-99999px;top:0;z-index:-1;display:flex;flex-direction:column;background:#3d0000;min-width:1400px;';

    if (tourney) {
      const t = tourney.cloneNode(true);
      t.style.cssText += ';width:100%;flex-shrink:0;';
      wrap.appendChild(t);
    }

    const centerClone = center.cloneNode(true);

    // Fix all elements — remove overflow clipping, restore colors
    centerClone.querySelectorAll('*').forEach(el => {
      el.style.removeProperty('overflow');
      el.style.removeProperty('max-height');
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
      // Fix muted/transparent colors
      const cs = window.getComputedStyle(el);
      if (cs.opacity && parseFloat(cs.opacity) < 0.5) {
        el.style.opacity = '1';
      }
    });

    centerClone.style.cssText = 'position:relative;width:100%;overflow:visible;height:auto;max-height:none;flex:1;background:#3d0000;';
    wrap.appendChild(centerClone);

    // Inject color fix stylesheet
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      * { opacity: 1 !important; }
      [class*="player"], [class*="register"], [class*="item"], 
      [class*="row"], [class*="card"], [class*="cell"] {
        color: #ffffff !important;
        background-color: #001E5C !important;
      }
      [class*="schedule"], [class*="match"], [class*="game"] {
        color: #ffffff !important;
        background-color: #002878 !important;
        display: block !important;
        visibility: visible !important;
      }
    `;
    wrap.appendChild(styleEl);

    document.body.appendChild(wrap);
    void wrap.offsetWidth;
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 300));

    const W = Math.max(wrap.scrollWidth, wrap.offsetWidth, 1400);
    const H = Math.max(wrap.scrollHeight, wrap.offsetHeight);
    wrap.style.width = W + 'px';
    wrap.style.height = H + 'px';
    void wrap.offsetWidth;
    await new Promise(r => requestAnimationFrame(r));

    console.log('[Export] capturing', W, 'x', H);

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

=======
import { downloadAsPNG } from './pngExporter.js';
import { downloadAsPDF } from './pdfExporter.js';

function closeExportMenuSafe() {
  if (typeof globalThis.closeExportMenu === 'function') globalThis.closeExportMenu();
  if (typeof globalThis.closeBracketExportMenu === 'function') globalThis.closeBracketExportMenu();
}

export async function exportBracket(type) {
  if (type !== 'png' && type !== 'pdf') throw new Error("Invalid type");

  const exportBtn = document.querySelector('#bracket-export-btn');
  if (exportBtn) { exportBtn.disabled = true; exportBtn.classList.add('loading'); }

  // Find bracket wrapper — include header + bracket
  const bracketEl = document.querySelector('#bracket-container');
  const headerEl = document.querySelector('.tournament-header, #tournament-header, .bracket-header, header.site-header');
  
  // Create a wrapper that includes header + bracket
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-99999px;top:0;z-index:-1;background:#00388D;';
  
  if (headerEl) {
    const h = headerEl.cloneNode(true);
    h.style.cssText += ';position:relative;width:100%;';
    wrapper.appendChild(h);
  }
  
  if (bracketEl) {
    const b = bracketEl.cloneNode(true);
    b.style.cssText += ';position:relative;width:100%;overflow:visible;';
    wrapper.appendChild(b);
  }
  
  document.body.appendChild(wrapper);
  
  // Force layout
  void wrapper.offsetWidth;
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  const W = Math.max(wrapper.scrollWidth, wrapper.offsetWidth, 800);
  const H = Math.max(wrapper.scrollHeight, wrapper.offsetHeight, 600);
  wrapper.style.width = W + 'px';
  wrapper.style.height = H + 'px';
  
  void wrapper.offsetWidth;
  await new Promise(r => requestAnimationFrame(r));

  console.log('[Export] wrapper size:', W, 'x', H);

  try {
    let canvas;
    
    // Try dom-to-image-more first (handles modern CSS)
    if (typeof domtoimage !== 'undefined') {
      console.log('[Export] using dom-to-image-more');
      const blob = await domtoimage.toBlob(wrapper, {
        width: W,
        height: H,
        bgcolor: '#00388D',
        style: { margin: '0', padding: '0' }
      });
      canvas = await blobToCanvas(blob, W, H);
    } else if (typeof html2canvas === 'function') {
      console.log('[Export] using html2canvas');
      canvas = await html2canvas(wrapper, {
        scale: 2,
        width: W,
        height: H,
        windowWidth: W,
        windowHeight: H,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#00388D',
        logging: false,
        onclone: (doc) => {
          const s = doc.createElement('style');
          s.textContent = `
            *, *::before, *::after {
              animation: none !important;
              transition: none !important;
              filter: none !important;
              backdrop-filter: none !important;
            }
          `;
          doc.head.appendChild(s);
        }
      });
    } else {
      throw new Error('No capture library available');
    }

    if (type === 'png') await downloadAsPNG(canvas);
    else await downloadAsPDF(canvas);

>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
  } catch(err) {
    console.error('[Export] Failed:', err);
    alert('Export lỗi: ' + err.message);
  } finally {
<<<<<<< HEAD
    const btn2 = document.querySelector('#bracket-export-btn');
    if (btn2) { btn2.disabled = false; btn2.classList.remove('loading'); }
    if (typeof globalThis.closeExportMenu === 'function') globalThis.closeExportMenu();
    if (typeof globalThis.closeBracketExportMenu === 'function') globalThis.closeBracketExportMenu();
=======
    wrapper.remove();
    if (exportBtn) { exportBtn.disabled = false; exportBtn.classList.remove('loading'); }
    closeExportMenuSafe();
>>>>>>> d0c57a0 (fix(bracket-bg-export): ensure bracket background fills large layouts and stabilize export pipeline wiring)
  }
}

async function blobToCanvas(blob, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = url;
  });
}

window.exportBracket = exportBracket;
