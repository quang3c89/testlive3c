/* Live3C — tournament.js */

export const THEMES = {
  'carbon-gold': {
    name: 'Carbon Gold',
    bg: '#0d1117',
    card: '#161b22',
    text: '#e6edf3',
    accent: '#f0a500',
    accent2: '#e05a2b',
    sL: 'rgba(255,255,255,0.04)',
    sD: 'rgba(0,0,0,0.6)',
    r: '10px',
    nc: '#e6edf3',
    uc: '#8b949e',
    rc: '#f0a500',
    tb: '#0d1117',
    border: 'rgba(255,255,255,0.08)',
    dot1: '#f0a500',
    dot2: '#0d1117',
  },
  'royal-blue': {
    name: 'Royal Blue',
    bg: '#eef2ff',
    card: '#ffffff',
    text: '#1e1b4b',
    accent: '#4f46e5',
    accent2: '#7c3aed',
    sL: '#fff',
    sD: 'rgba(79,70,229,0.2)',
    r: '12px',
    nc: '#1e1b4b',
    uc: '#6366f1',
    rc: '#4f46e5',
    tb: '#4f46e5',
    border: 'rgba(79,70,229,0.15)',
    dot1: '#4f46e5',
    dot2: '#eef2ff',
  },
  'green-arena': {
    name: 'Green Arena',
    bg: '#f0fdf4',
    card: '#ffffff',
    text: '#14532d',
    accent: '#16a34a',
    accent2: '#15803d',
    sL: '#fff',
    sD: 'rgba(22,163,74,0.15)',
    r: '10px',
    nc: '#14532d',
    uc: '#4ade80',
    rc: '#16a34a',
    tb: '#14532d',
    border: 'rgba(22,163,74,0.2)',
    dot1: '#16a34a',
    dot2: '#f0fdf4',
  },
  'coral-sport': {
    name: 'Coral Sport',
    bg: '#fff5f5',
    card: '#ffffff',
    text: '#7f1d1d',
    accent: '#dc2626',
    accent2: '#f97316',
    sL: '#fff',
    sD: 'rgba(220,38,38,0.15)',
    r: '14px',
    nc: '#7f1d1d',
    uc: '#ef4444',
    rc: '#dc2626',
    tb: '#dc2626',
    border: 'rgba(220,38,38,0.15)',
    dot1: '#dc2626',
    dot2: '#fff5f5',
  },
  'midnight-pro': {
    name: 'Midnight Pro',
    bg: '#06070d',
    card: '#0e1017',
    text: '#cdd4e0',
    accent: '#38bdf8',
    accent2: '#818cf8',
    sL: 'rgba(56,189,248,0.04)',
    sD: 'rgba(0,0,0,0.7)',
    r: '8px',
    nc: '#e0f2fe',
    uc: '#7dd3fc',
    rc: '#38bdf8',
    tb: '#06070d',
    border: 'rgba(56,189,248,0.12)',
    dot1: '#38bdf8',
    dot2: '#06070d',
  },
};

/** Gốc HTML: genBracket(size) — size là lũy thừa 2 */
export function generateBracket(players) {
  let raw;
  if (typeof players === 'number') raw = players;
  else if (Array.isArray(players)) raw = players.length;
  else raw = 16;
  if (isNaN(raw) || raw < 2) raw = 4;
  const size = Math.pow(2, Math.ceil(Math.log2(raw)));
  const rounds = Math.log2(size);
  const br = [];
  for (let r = 0; r < rounds; r++) {
    const ms = [];
    const mc = size / Math.pow(2, r + 1);
    for (let m = 0; m < mc; m++) ms.push({ p1: null, p2: null, s1: '', s2: '', winner: null });
    br.push(ms);
  }
  return br;
}

export function getRoundName(r, totalRounds) {
  const fromEnd = totalRounds - 1 - r;
  if (fromEnd === 0) return 'CHUNG KẾT';
  if (fromEnd === 1) return 'BÁN KẾT';
  if (fromEnd === 2) return 'TỨ KẾT';
  return `VÒNG ${r + 1}`;
}

/**
 * Logic thuần từ setWinner (tournament.html): gán winner và đẩy lên vòng sau.
 * @param {Array} bracket - S.bracket
 * @returns {boolean}
 */
export function advanceWinner(bracket, roundIdx, matchIdx, winnerId) {
  const m = bracket[roundIdx][matchIdx];
  const w = m.p1?.id === winnerId ? m.p1 : m.p2?.id === winnerId ? m.p2 : null;
  if (!w) return false;
  m.winner = w;
  const nr = roundIdx + 1;
  const nm = Math.floor(matchIdx / 2);
  if (nr < bracket.length) {
    const np = matchIdx % 2 === 0 ? 'p1' : 'p2';
    bracket[nr][nm][np] = w;
    bracket[nr][nm].winner = null;
  }
  return true;
}

/**
 * @param {string} themeId
 * @param {object} appState - có .theme, .tbBg (optional)
 * @param {{ saveState?: () => void, drawWheel?: () => void, drawBracketLines?: () => void }} hooks
 */
export function applyTheme(themeId, appState, hooks = {}) {
  const t = THEMES[themeId] || THEMES['carbon-gold'];
  appState.theme = themeId;
  const r = document.documentElement;
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--card', t.card);
  r.style.setProperty('--text', t.text);
  r.style.setProperty('--accent', t.accent);
  r.style.setProperty('--accent2', t.accent2);
  r.style.setProperty('--shadow-light', t.sL);
  r.style.setProperty('--shadow-dark', t.sD);
  r.style.setProperty('--radius', t.r);
  r.style.setProperty('--name-color', t.nc);
  r.style.setProperty('--unit-color', t.uc);
  r.style.setProperty('--rank-color', t.rc);
  r.style.setProperty('--tb-bg', appState.tbBg || t.tb);
  r.style.setProperty('--border', t.border);
  r.style.setProperty('--glow', t.accent + '33');
  document.querySelectorAll('.ot-head').forEach((el) => {
    el.style.background = t.bg;
  });
  hooks.saveState?.();
  if (hooks.drawWheel) setTimeout(hooks.drawWheel, 50);
  if (hooks.drawBracketLines) setTimeout(hooks.drawBracketLines, 80);
}

/**
 * Xuất PNG bracket (gốc: exportImage('center-panel','bracket')).
 * Cần thư viện html2canvas global (như tournament.html).
 */
export function exportBracketImage(onError) {
  const el = document.getElementById('center-panel');
  if (!el) return;
  const h2c = globalThis.html2canvas;
  if (typeof h2c !== 'function') {
    (onError || console.error)(new Error('html2canvas not loaded'));
    return;
  }
  h2c(el, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    scale: 2,
    useCORS: true,
  })
    .then((canvas) => {
      const a = document.createElement('a');
      a.download = `live3c_bracket_${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    })
    .catch((err) => {
      (onError || console.error)(err);
    });
}
