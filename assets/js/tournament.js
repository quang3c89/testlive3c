/* Live3C — tournament.js */

export const THEMES = {
  'navy-gold': {
    name: 'Navy Gold',
    bg: '#071629',
    card: '#10263f',
    text: '#f7f9fc',
    accent: '#ffd447',
    accent2: '#d72638',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.6)',
    r: '12px',
    nc: '#ffffff',
    uc: '#d6e2f2',
    rc: '#ffd447',
    tb: '#0b2038',
    border: 'rgba(255,255,255,0.16)',
    dot1: '#ffd447',
    dot2: '#071629',
  },
  'marine-sunset': {
    name: 'Marine Sunset',
    bg: '#0a1d35',
    card: '#133154',
    text: '#f7fbff',
    accent: '#ffcf4a',
    accent2: '#e63946',
    sL: 'rgba(255,255,255,0.06)',
    sD: 'rgba(0,0,0,0.58)',
    r: '12px',
    nc: '#ffffff',
    uc: '#cfdcef',
    rc: '#ffcf4a',
    tb: '#102743',
    border: 'rgba(255,255,255,0.16)',
    dot1: '#e63946',
    dot2: '#0a1d35',
  },
  'deep-ocean': {
    name: 'Deep Ocean',
    bg: '#061426',
    card: '#0f2a46',
    text: '#f3f8ff',
    accent: '#f4c542',
    accent2: '#cc2936',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.64)',
    r: '10px',
    nc: '#ffffff',
    uc: '#c2d5ee',
    rc: '#f4c542',
    tb: '#0b1f38',
    border: 'rgba(255,255,255,0.14)',
    dot1: '#f4c542',
    dot2: '#061426',
  },
  'royal-crimson': {
    name: 'Royal Crimson',
    bg: '#0c1f3b',
    card: '#16365c',
    text: '#f9fbff',
    accent: '#ffd34e',
    accent2: '#d72638',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.62)',
    r: '14px',
    nc: '#ffffff',
    uc: '#dbe6f6',
    rc: '#ffd34e',
    tb: '#112c4b',
    border: 'rgba(255,255,255,0.18)',
    dot1: '#d72638',
    dot2: '#0c1f3b',
  },
  'night-arena': {
    name: 'Night Arena',
    bg: '#081326',
    card: '#122b4a',
    text: '#f4f9ff',
    accent: '#ffcf45',
    accent2: '#c81d32',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.65)',
    r: '11px',
    nc: '#ffffff',
    uc: '#cadbf0',
    rc: '#ffcf45',
    tb: '#0d2240',
    border: 'rgba(255,255,255,0.15)',
    dot1: '#ffcf45',
    dot2: '#081326',
  },
  'classic-3c': {
    name: 'Classic 3C',
    bg: '#091a31',
    card: '#123257',
    text: '#ffffff',
    accent: '#ffd447',
    accent2: '#d72638',
    sL: 'rgba(255,255,255,0.06)',
    sD: 'rgba(0,0,0,0.6)',
    r: '12px',
    nc: '#ffffff',
    uc: '#d6e1f1',
    rc: '#ffd447',
    tb: '#0f2746',
    border: 'rgba(255,255,255,0.17)',
    dot1: '#ffd447',
    dot2: '#091a31',
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
