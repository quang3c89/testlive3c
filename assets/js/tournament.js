/* Live3C — tournament.js */

export const THEMES = {
  'aurora-navy': {
    name: 'Ocean Fire',
    bg: '#025959',
    card: '#A0D9D9',
    text: '#0b1f1f',
    accent: '#F28705',
    accent2: '#F23005',
    sL: 'rgba(255,255,255,0.18)',
    sD: 'rgba(0,0,0,0.42)',
    r: '12px',
    nc: '#0b1f1f',
    uc: '#134646',
    rc: '#F23005',
    tb: '#025959',
    border: 'rgba(11,31,31,0.25)',
    dot1: '#F28705',
    dot2: '#F23005',
  },
  'midnight-coral': {
    name: 'Urban Steel',
    bg: '#526373',
    card: '#C9C9D1',
    text: '#000000',
    accent: '#D6A549',
    accent2: '#000000',
    sL: 'rgba(255,255,255,0.14)',
    sD: 'rgba(0,0,0,0.45)',
    r: '12px',
    nc: '#000000',
    uc: '#30363d',
    rc: '#D6A549',
    tb: '#526373',
    border: 'rgba(0,0,0,0.24)',
    dot1: '#D6A549',
    dot2: '#000000',
  },
  'plum-ice': {
    name: 'Mystic Bloom',
    bg: '#73263A',
    card: '#796AD9',
    text: '#fff7ee',
    accent: '#F2845C',
    accent2: '#F2CB05',
    sL: 'rgba(255,255,255,0.12)',
    sD: 'rgba(0,0,0,0.48)',
    r: '12px',
    nc: '#fff7ee',
    uc: '#ffe2cf',
    rc: '#F2CB05',
    tb: '#73263A',
    border: 'rgba(255,255,255,0.22)',
    dot1: '#F2845C',
    dot2: '#F2CB05',
  },
  'forest-neon': {
    name: 'Solar Blaze',
    bg: '#36688D',
    card: '#BDA589',
    text: '#1f2024',
    accent: '#F3CD05',
    accent2: '#F49F05',
    sL: 'rgba(255,255,255,0.14)',
    sD: 'rgba(0,0,0,0.44)',
    r: '12px',
    nc: '#1f2024',
    uc: '#2f3036',
    rc: '#F49F05',
    tb: '#36688D',
    border: 'rgba(31,32,36,0.24)',
    dot1: '#F3CD05',
    dot2: '#F49F05',
  },
  'royal-ember': {
    name: 'Royal Ember',
    bg: '#12152b',
    card: '#202748',
    text: '#fbfcff',
    accent: '#f59e0b',
    accent2: '#ef4444',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.65)',
    r: '13px',
    nc: '#ffffff',
    uc: '#d7dcef',
    rc: '#f7bf52',
    tb: '#1a2140',
    border: 'rgba(255,255,255,0.16)',
    dot1: '#f59e0b',
    dot2: '#ef4444',
  },
  'arctic-sky': {
    name: 'Arctic Sky',
    bg: '#0d1d2f',
    card: '#16334f',
    text: '#f4fbff',
    accent: '#7dd3fc',
    accent2: '#a78bfa',
    sL: 'rgba(255,255,255,0.06)',
    sD: 'rgba(0,0,0,0.6)',
    r: '12px',
    nc: '#ffffff',
    uc: '#cfe2f2',
    rc: '#9ad9fb',
    tb: '#132b44',
    border: 'rgba(255,255,255,0.16)',
    dot1: '#7dd3fc',
    dot2: '#a78bfa',
  },
  'rose-graphite': {
    name: 'Rose Graphite',
    bg: '#19141f',
    card: '#2b2233',
    text: '#fff8fd',
    accent: '#fb7185',
    accent2: '#22d3ee',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.67)',
    r: '12px',
    nc: '#ffffff',
    uc: '#e2d7e6',
    rc: '#fda4af',
    tb: '#251d2c',
    border: 'rgba(255,255,255,0.14)',
    dot1: '#fb7185',
    dot2: '#22d3ee',
  },
  'teal-sand': {
    name: 'Teal Sand',
    bg: '#0f2223',
    card: '#1a3839',
    text: '#f7fffe',
    accent: '#2dd4bf',
    accent2: '#f59e0b',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.64)',
    r: '12px',
    nc: '#ffffff',
    uc: '#d3ebe8',
    rc: '#f8c86f',
    tb: '#173233',
    border: 'rgba(255,255,255,0.15)',
    dot1: '#2dd4bf',
    dot2: '#f59e0b',
  },
  'violet-flame': {
    name: 'Violet Flame',
    bg: '#16132b',
    card: '#252044',
    text: '#faf8ff',
    accent: '#a78bfa',
    accent2: '#f97316',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.67)',
    r: '12px',
    nc: '#ffffff',
    uc: '#dbd5f0',
    rc: '#c4b5fd',
    tb: '#201b3a',
    border: 'rgba(255,255,255,0.15)',
    dot1: '#a78bfa',
    dot2: '#f97316',
  },
  'carbon-lime': {
    name: 'Carbon Lime',
    bg: '#121717',
    card: '#1f2828',
    text: '#f8fffb',
    accent: '#84cc16',
    accent2: '#38bdf8',
    sL: 'rgba(255,255,255,0.05)',
    sD: 'rgba(0,0,0,0.68)',
    r: '12px',
    nc: '#ffffff',
    uc: '#d7e6df',
    rc: '#b9e769',
    tb: '#1a2222',
    border: 'rgba(255,255,255,0.14)',
    dot1: '#84cc16',
    dot2: '#38bdf8',
  },
};

export function nextPowerOfTwo(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 2) return 4;
  return Math.pow(2, Math.ceil(Math.log2(v)));
}

/** Seed order chuẩn để phân bố đối xứng trái/phải */
export function generateSeedOrder(size) {
  let order = [1, 2];
  while (order.length < size) {
    const nextSize = order.length * 2;
    const next = [];
    order.forEach((seed) => {
      next.push(seed);
      next.push(nextSize + 1 - seed);
    });
    order = next;
  }
  return order;
}

/** Gốc HTML: genBracket(size) — nhận mọi số, tự quy chuẩn 2^k */
export function generateBracket(players) {
  let raw;
  if (typeof players === 'number') raw = players;
  else if (Array.isArray(players)) raw = players.length;
  else raw = 16;
  const size = nextPowerOfTwo(raw);
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

/**
 * Tạo bracket chuẩn dữ liệu từ danh sách người chơi bất kỳ N.
 * - Tự tính BYE theo 2^k
 * - Phân bổ theo seed order đối xứng
 * - Tự động propagate BYE lên các vòng sau
 */
export function generateBracketFromPlayers(players = []) {
  const list = Array.isArray(players) ? players.filter(Boolean) : [];
  const n = Math.max(2, list.length);
  const size = nextPowerOfTwo(n);
  const bracket = generateBracket(size);
  const seedOrder = generateSeedOrder(size);

  const seededSlots = seedOrder.map((seed) => {
    const p = list[seed - 1];
    if (p) return { ...p, seed, isBye: false };
    return { id: `bye_${seed}`, name: 'BYE', unit: '', rank: '', seed, isBye: true };
  });

  for (let m = 0; m < bracket[0].length; m++) {
    bracket[0][m].p1 = seededSlots[m * 2] || null;
    bracket[0][m].p2 = seededSlots[m * 2 + 1] || null;
  }

  // Propagate BYE chỉ 1 bước: từ vòng hiện tại lên đúng vòng kế tiếp
  // (không auto-chain qua nhiều vòng để tránh line chạy một mạch đến cuối)
  const r = 0;
  if (bracket[r] && bracket[r + 1]) {
    for (let mi = 0; mi < bracket[r].length; mi++) {
      const match = bracket[r][mi];
      const p1 = match.p1;
      const p2 = match.p2;
      const p1Bye = !!p1?.isBye;
      const p2Bye = !!p2?.isBye;

      if (!p1 && !p2) continue;
      if (p1 && p2 && !p1Bye && !p2Bye) continue;

      let autoWinner = null;
      if (p1 && (!p2 || p2Bye) && !p1Bye) autoWinner = p1;
      if (p2 && (!p1 || p1Bye) && !p2Bye) autoWinner = p2;
      if (!autoWinner) continue;

      match.winner = autoWinner;
      const nr = r + 1;
      const nm = Math.floor(mi / 2);
      const np = mi % 2 === 0 ? 'p1' : 'p2';
      bracket[nr][nm][np] = autoWinner;
      bracket[nr][nm].winner = null;
    }
  }

  return bracket;
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
  const fallbackTheme = THEMES['aurora-navy'] || Object.values(THEMES)[0];
  const t = THEMES[themeId] || fallbackTheme;
  appState.theme = themeId;
  const r = document.documentElement;
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--card', t.card);
  r.style.setProperty('--text', t.text);
  r.style.setProperty('--accent', t.accent);
  r.style.setProperty('--accent2', t.accent2);
  /* Sync new design tokens so tournament theme switch also affects global/base layers */
  r.style.setProperty('--c-bg', t.bg);
  r.style.setProperty('--c-surface', t.card);
  r.style.setProperty('--c-surface2', t.tb || t.card);
  r.style.setProperty('--c-ink', t.text);
  r.style.setProperty('--c-ink2', t.uc || t.text);
  r.style.setProperty('--c-gold', t.accent);
  r.style.setProperty('--c-red', t.accent2);
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
