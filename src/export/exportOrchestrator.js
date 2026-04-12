import { downloadAsPNG } from './pngExporter.js';
import { downloadAsPDF } from './pdfExporter.js';

function closeExportMenuSafe() {
  if (typeof globalThis.closeExportMenu === 'function') globalThis.closeExportMenu();
  if (typeof globalThis.closeBracketExportMenu === 'function') globalThis.closeBracketExportMenu();
}

export async function exportBracket(type) {
  if (type !== 'png' && type !== 'pdf') throw new Error('Invalid type');

  const exportBtn = document.querySelector('#bracket-export-btn');
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.classList.add('loading');
  }

  const bracketEl = document.querySelector('#bracket-container');
  const headerEl = document.querySelector('.tournament-header, #tournament-header, .bracket-header, header.site-header');

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

  void wrapper.offsetWidth;
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));

  const W = Math.max(wrapper.scrollWidth, wrapper.offsetWidth, 800);
  const H = Math.max(wrapper.scrollHeight, wrapper.offsetHeight, 600);
  wrapper.style.width = W + 'px';
  wrapper.style.height = H + 'px';

  void wrapper.offsetWidth;
  await new Promise((r) => requestAnimationFrame(r));

  console.log('[Export] wrapper size:', W, 'x', H);

  try {
    let canvas;

    if (typeof domtoimage !== 'undefined') {
      console.log('[Export] using dom-to-image-more');
      const blob = await domtoimage.toBlob(wrapper, {
        width: W,
        height: H,
        bgcolor: '#00388D',
        style: { margin: '0', padding: '0' },
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
        },
      });
    } else {
      throw new Error('No capture library available');
    }

    if (type === 'png') await downloadAsPNG(canvas);
    else await downloadAsPDF(canvas);
  } catch (err) {
    console.error('[Export] Failed:', err);
  } finally {
    wrapper.remove();
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.classList.remove('loading');
    }
    closeExportMenuSafe();
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
