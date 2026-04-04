/* Live3C — ui-tournament.js */
import { getRoundName, advanceWinner } from './tournament.js';

export const WIN_IMAGE_URL = '';

export const BALL_SVG = `<svg class="sched-ball-icon" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ballGrad" cx="38%" cy="32%" r="60%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#f0a500"/>
      <stop offset="100%" stop-color="#8a5a00"/>
    </radialGradient>
    <radialGradient id="shineGrad" cx="38%" cy="28%" r="35%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="30" cy="30" r="28" fill="url(#ballGrad)"/>
  <ellipse cx="24" cy="22" rx="10" ry="7" fill="url(#shineGrad)"/>
  <circle cx="30" cy="30" r="9" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="30" y="35" text-anchor="middle" font-family="'Barlow Condensed',sans-serif" font-size="10" font-weight="900" fill="rgba(255,255,255,0.9)">3C</text>
</svg>`;

/**
 * @typedef {object} BracketUIApi
 * @property {object} S — state có bracket, isAdmin
 * @property {() => void} pushHistory
 * @property {() => void} saveState
 * @property {() => void} supaPushDebounced
 * @property {(r:number,mi:number,pk:string) => void} [setWinner]
 */

function makeMatchPlayer(player, score, pKey, isWinner, r, mi, S, bracketApi) {
  const el = document.createElement('div');
  el.className = 'mp' + (isWinner ? ' winner' : '') + ' ' + pKey + '-slot';
  el.id = `match-${r}-${mi}-${pKey}`;

  const info = document.createElement('div');
  info.className = 'mp-info';

  const topRow = document.createElement('div');
  topRow.className = 'mp-top';

  const nameEl = document.createElement('span');
  nameEl.className = 'mn';
  nameEl.textContent = player ? player.name : '—';
  topRow.appendChild(nameEl);

  if (player && player.rank) {
    const rankEl = document.createElement('span');
    rankEl.className = 'mp-rank';
    rankEl.textContent = player.rank;
    topRow.appendChild(rankEl);
  }

  info.appendChild(topRow);

  if (player && player.unit) {
    const unitEl = document.createElement('div');
    unitEl.className = 'mp-unit';
    unitEl.textContent = player.unit;
    info.appendChild(unitEl);
  }

  const scoreEl = document.createElement('input');
  scoreEl.type = 'text';
  scoreEl.className = 'ms';
  scoreEl.value = score || '';
  scoreEl.onclick = (e) => e.stopPropagation();
  scoreEl.onchange = (e) => updateScore(S, r, mi, pKey, e, bracketApi);

  el.appendChild(info);
  el.appendChild(scoreEl);

  if (S.isAdmin) {
    el.onclick = () => setWinner(r, mi, pKey, bracketApi);
  }

  return el;
}

function updateScore(S, r, mi, pk, e, bracketApi) {
  if (!S.isAdmin) return;
  if (pk === 'p1') S.bracket[r][mi].s1 = e.target.value;
  else S.bracket[r][mi].s2 = e.target.value;
  bracketApi.saveState();
  bracketApi.supaPushDebounced();
}

export function setWinner(r, mi, pk, bracketApi) {
  const { S, pushHistory, saveState, supaPushDebounced, renderBracket, renderSchedule } = bracketApi;
  if (!S.isAdmin) return;
  pushHistory();
  const m = S.bracket[r][mi];
  const w = pk === 'p1' ? m.p1 : m.p2;
  if (!w) return;

  const winEl = document.getElementById(`match-${r}-${mi}-${pk}`);
  const loseEl = document.getElementById(`match-${r}-${mi}-${pk === 'p1' ? 'p2' : 'p1'}`);
  if (winEl) {
    winEl.classList.remove('winner-flash');
    void winEl.offsetWidth;
    winEl.classList.add('winner-flash');
  }
  if (loseEl) loseEl.classList.add('loser-dim');

  setTimeout(() => {
    advanceWinner(S.bracket, r, mi, w.id);
    renderBracketInternal(S, bracketApi);
    const schedPanel = document.getElementById('schedule-panel');
    if (schedPanel && schedPanel.classList.contains('active')) renderSchedule();
    saveState();
    supaPushDebounced();

    const isFinal = r === S.bracket.length - 1;
    showWinnerPopup(w, m, r, mi, isFinal, S);
  }, 220);
}

function makeHalfRoundCol(r, side, totalRounds, S, bracketApi) {
  const col = document.createElement('div');
  col.className = 'round-col';
  col.id = `round-col-${r}-${side}`;

  const lbl = document.createElement('div');
  lbl.className = 'round-label';
  lbl.textContent = getRoundName(r, totalRounds);
  col.appendChild(lbl);

  const matchesWrap = document.createElement('div');
  matchesWrap.style.cssText = 'display:flex;flex-direction:column;justify-content:space-around;flex:1;';

  const allMatches = S.bracket[r];
  const half = allMatches.length / 2;
  const startMi = side === 'left' ? 0 : half;
  const endMi = side === 'left' ? half : allMatches.length;

  for (let mi = startMi; mi < endMi; mi++) {
    const m = allMatches[mi];
    const bx = document.createElement('div');
    bx.className = 'mb';
    bx.id = `mb-${r}-${mi}`;
    const w1 = m.winner && m.p1 && m.winner.id === m.p1.id;
    const w2 = m.winner && m.p2 && m.winner.id === m.p2.id;
    bx.appendChild(makeMatchPlayer(m.p1, m.s1, 'p1', w1, r, mi, S, bracketApi));
    bx.appendChild(makeMatchPlayer(m.p2, m.s2, 'p2', w2, r, mi, S, bracketApi));

    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:4px 0;';
    wrap.appendChild(bx);
    matchesWrap.appendChild(wrap);
  }

  col.appendChild(matchesWrap);
  return col;
}

function makeFinalCol(r, S, bracketApi) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';

  const lbl = document.createElement('div');
  lbl.className = 'champion-label';
  lbl.textContent = '🏆 CHUNG KẾT';
  wrap.appendChild(lbl);

  const m = S.bracket[r][0];
  const fBox = document.createElement('div');
  fBox.className = 'mb finals-match' + (m.winner ? ' has-winner' : '');
  fBox.id = `mb-${r}-0`;

  const w1 = m.winner && m.p1 && m.winner.id === m.p1.id;
  const w2 = m.winner && m.p2 && m.winner.id === m.p2.id;
  fBox.appendChild(makeMatchPlayer(m.p1, m.s1, 'p1', w1, r, 0, S, bracketApi));
  fBox.appendChild(makeMatchPlayer(m.p2, m.s2, 'p2', w2, r, 0, S, bracketApi));

  if (m.winner) {
    const champDiv = document.createElement('div');
    champDiv.style.cssText =
      'padding:8px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);';
    champDiv.className = 'champ-reveal';
    champDiv.innerHTML = `
      <div style="font-family:var(--font-display);font-size:10px;letter-spacing:1.5px;opacity:0.4;margin-bottom:2px;text-transform:uppercase;">Vô Địch</div>
      <div style="font-family:var(--font-display);font-size:20px;font-weight:900;color:var(--accent);text-shadow:0 0 20px var(--accent);">🏆 ${m.winner.name}</div>
    `;
    fBox.appendChild(champDiv);
  }

  wrap.appendChild(fBox);
  return wrap;
}

/**
 * @param {object} bracket — mảng vòng đấu (S.bracket)
 * @param {Element|string|null} container — TODO: phần tử mount; hiện bỏ qua, vẫn dùng #bracket-columns như tournament.html
 * @param {BracketUIApi} bracketApi
 */
export function renderBracket(bracket, container, bracketApi) {
  void container;
  if (!bracketApi?.S) {
    console.error('renderBracket: bracketApi.S is required');
    return;
  }
  bracketApi.S.bracket = bracket;
  renderBracketInternal(bracketApi.S, bracketApi);
}

/**
 * @param {object} S
 * @param {BracketUIApi} bracketApi
 */
export function renderBracketInternal(S, bracketApi) {
  const el = document.getElementById('bracket-columns');
  el.innerHTML = '';
  const rounds = S.bracket.length;
  if (rounds === 0) return;

  if (rounds === 1) {
    el.appendChild(makeFinalCol(0, S, bracketApi));
    setTimeout(() => drawBracketLines(S), 80);
    checkBracketTabVisibility(S, bracketApi);
    return;
  }

  const finalRound = rounds - 1;

  const leftSide = document.createElement('div');
  leftSide.className = 'bracket-side left-side';

  const rightSide = document.createElement('div');
  rightSide.className = 'bracket-side right-side';

  const centerDiv = document.createElement('div');
  centerDiv.className = 'bracket-center';

  for (let r = 0; r < finalRound; r++) {
    leftSide.appendChild(makeHalfRoundCol(r, 'left', rounds, S, bracketApi));
  }

  for (let r = 0; r < finalRound; r++) {
    rightSide.appendChild(makeHalfRoundCol(r, 'right', rounds, S, bracketApi));
  }

  centerDiv.appendChild(makeFinalCol(finalRound, S, bracketApi));

  el.appendChild(leftSide);
  el.appendChild(centerDiv);
  el.appendChild(rightSide);

  setTimeout(() => drawBracketLines(S), 80);
  checkBracketTabVisibility(S, bracketApi);
}

export function drawBracketLines(S) {
  const svg = document.getElementById('bracket-lines');
  const cont = document.getElementById('bracket-container');
  svg.innerHTML = '';

  const cw = cont.scrollWidth;
  const ch = cont.scrollHeight;
  svg.setAttribute('width', cw);
  svg.setAttribute('height', ch);
  svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);

  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f0a500';
  const rounds = S.bracket.length;
  const contRect = cont.getBoundingClientRect();

  function px(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      left: r.left - contRect.left + cont.scrollLeft,
      right: r.right - contRect.left + cont.scrollLeft,
      top: r.top - contRect.top + cont.scrollTop,
      bottom: r.bottom - contRect.top + cont.scrollTop,
      midY: r.top + r.height / 2 - contRect.top + cont.scrollTop,
      midX: r.left + r.width / 2 - contRect.left + cont.scrollLeft,
      width: r.width,
      height: r.height,
    };
  }

  function makePath(d, winner) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', accent);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    if (winner) {
      path.setAttribute('stroke-width', '2');
      path.setAttribute('opacity', '0.75');
      path.setAttribute('stroke-dasharray', '8 4');
      path.style.animation = 'flowl 1.2s linear infinite';
      path.style.filter = `drop-shadow(0 0 4px ${accent})`;
    } else {
      path.setAttribute('stroke-width', '1.2');
      path.setAttribute('opacity', '0.2');
      path.setAttribute('stroke-dasharray', '4 6');
    }
    return path;
  }

  for (let r = 0; r < rounds - 1; r++) {
    const mc = S.bracket[r].length;
    for (let mi = 0; mi < mc; mi++) {
      const srcEl = document.getElementById(`mb-${r}-${mi}`);
      const parentMi = Math.floor(mi / 2);
      const dstEl = document.getElementById(`mb-${r + 1}-${parentMi}`);
      if (!srcEl || !dstEl) continue;

      const src = px(srcEl);
      const dst = px(dstEl);
      if (!src || !dst) continue;

      const hasWinner = !!S.bracket[r][mi].winner;

      const isLeftSide = src.midX < dst.midX;

      let sx, ex, sy, dy, mx;
      if (isLeftSide) {
        sx = src.right;
        ex = dst.left;
        sy = src.midY;
        dy = dst.midY;
        mx = sx + (ex - sx) * 0.5;
      } else {
        sx = src.left;
        ex = dst.right;
        sy = src.midY;
        dy = dst.midY;
        mx = sx + (ex - sx) * 0.5;
      }

      const d = `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${dy} L ${ex} ${dy}`;
      svg.appendChild(makePath(d, hasWinner));
    }
  }
}

export function makeMatchCard(m, matchNum, roundIdx, matchIdx, animDelay, ballSvg = BALL_SVG) {
  const p1 = m.p1;
  const p2 = m.p2;
  const hasP1 = !!p1;
  const hasP2 = !!p2;
  const hasWinner = !!m.winner;
  const p1IsWinner = hasWinner && p1 && m.winner.id === p1.id;
  const p2IsWinner = hasWinner && p2 && m.winner.id === p2.id;

  const p1NameCls = !hasP1 ? 'empty-name' : p1IsWinner ? 'left-name' : '';
  const p2NameCls = !hasP2 ? 'empty-name' : p2IsWinner ? 'right-name' : '';

  return `
      <div class="sched-match${hasWinner ? ' has-winner' : ''}" style="animation-delay:${animDelay}ms" data-round="${roundIdx}" data-match="${matchIdx}">
        <div class="sched-match-header">
          <span class="sched-match-num">MATCH ${matchNum}</span>
          <span class="sched-match-status${hasWinner ? ' done' : ''}">${hasWinner ? '✓ KẾT THÚC' : 'CHỜ THI ĐẤU'}</span>
        </div>
        <div class="sched-match-body">
          <div class="sched-player left">
            <div class="sched-name-row">
              <span class="sched-name ${p1NameCls}" title="${hasP1 ? p1.name : 'TBD'}">${hasP1 ? p1.name : 'TBD'}</span>
              ${hasP1 && p1.rank ? `<span class="sched-rank">${p1.rank}</span>` : ''}
            </div>
            ${hasP1 && p1.unit ? `<div class="sched-unit">${p1.unit}</div>` : ''}
            ${p1IsWinner ? `<span class="sched-winner-badge">🏆 THẮNG</span>` : ''}
          </div>
          <div class="sched-vs-col">
            ${ballSvg}
          </div>
          <div class="sched-player right">
            <div class="sched-name-row">
              ${hasP2 && p2.rank ? `<span class="sched-rank">${p2.rank}</span>` : ''}
              <span class="sched-name ${p2NameCls}" title="${hasP2 ? p2.name : 'TBD'}">${hasP2 ? p2.name : 'TBD'}</span>
            </div>
            ${hasP2 && p2.unit ? `<div class="sched-unit">${p2.unit}</div>` : ''}
            ${p2IsWinner ? `<span class="sched-winner-badge">🏆 THẮNG</span>` : ''}
          </div>
        </div>
      </div>`;
}

export function renderSchedule(S) {
  const container = document.getElementById('schedule-columns');
  const subtitle = document.getElementById('schedule-subtitle');
  if (!container) return;
  container.innerHTML = '';

  const bracket = S.bracket;
  if (!bracket || bracket.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;opacity:0.3;font-family:var(--font-mono);font-size:11px;padding:40px;">Chưa có dữ liệu bốc thăm</div>';
    return;
  }

  let totalMatchCount = 0;
  let filledRounds = 0;
  bracket.forEach((round) => {
    const hasAny = round.some((m) => m.p1 || m.p2);
    if (hasAny) {
      filledRounds++;
      totalMatchCount += round.length;
    }
  });

  if (totalMatchCount === 0) {
    container.innerHTML =
      '<div style="text-align:center;opacity:0.3;font-family:var(--font-mono);font-size:11px;padding:40px;">Chưa có dữ liệu bốc thăm</div>';
    return;
  }

  const rounds = bracket.length;
  let globalMatchNum = 1;

  if (subtitle) subtitle.textContent = `${filledRounds} vòng · ${totalMatchCount} trận đấu`;

  bracket.forEach((round, rIdx) => {
    const hasAny = round.some((m) => m.p1 || m.p2);
    if (!hasAny) return;

    const section = document.createElement('div');
    section.className = 'sched-round-section';

    const rnLabel = document.createElement('div');
    rnLabel.className = 'sched-round-label';
    rnLabel.textContent = getRoundName(rIdx, rounds).toUpperCase();
    section.appendChild(rnLabel);

    const colsWrap = document.createElement('div');
    colsWrap.className = 'schedule-columns';

    const half = Math.ceil(round.length / 2);
    const leftMatches = round.slice(0, half);
    const rightMatches = round.slice(half);

    const leftCol = document.createElement('div');
    leftCol.className = 'schedule-col';
    leftMatches.forEach((m, i) => {
      const num = globalMatchNum++;
      leftCol.insertAdjacentHTML('beforeend', makeMatchCard(m, num, rIdx, i, i * 50));
    });
    colsWrap.appendChild(leftCol);

    if (rightMatches.length > 0) {
      const divider = document.createElement('div');
      divider.className = 'schedule-divider';
      colsWrap.appendChild(divider);

      const rightCol = document.createElement('div');
      rightCol.className = 'schedule-col';
      rightMatches.forEach((m, i) => {
        const num = globalMatchNum++;
        rightCol.insertAdjacentHTML(
          'beforeend',
          makeMatchCard(m, num, rIdx, half + i, (i + half) * 50)
        );
      });
      colsWrap.appendChild(rightCol);
    }

    section.appendChild(colsWrap);
    container.appendChild(section);
  });
}

export function showWinnerPopup(winner, match, roundIdx, matchIdx, isFinal, S) {
  const totalRounds = S.bracket.length;
  const roundLabel = isFinal
    ? '🏆 CHUNG KẾT — VÔ ĐỊCH!'
    : getRoundName(roundIdx, totalRounds).toUpperCase();

  const imgWrap = document.getElementById('wp-img-wrap');
  if (WIN_IMAGE_URL) {
    imgWrap.innerHTML = `<img class="wp-img" id="wp-img" src="${WIN_IMAGE_URL}" alt="winner">`;
  } else {
    imgWrap.innerHTML = `<div class="wp-img-placeholder" id="wp-img-placeholder">${isFinal ? '👑' : '🏆'}</div>`;
  }

  document.getElementById('wp-round-label').textContent = roundLabel;
  document.getElementById('wp-name').textContent = winner.name;
  document.getElementById('wp-unit').textContent = winner.unit || '';
  const rankWrap = document.getElementById('wp-rank-wrap');
  rankWrap.innerHTML = winner.rank ? `<span class="wp-rank-badge">${winner.rank}</span>` : '';

  const scoreBox = document.getElementById('wp-score');
  const s1 = match.s1;
  const s2 = match.s2;
  if (s1 || s2) {
    const p1IsWinner = match.p1 && winner.id === match.p1.id;
    document.getElementById('wp-s1-name').textContent = match.p1 ? match.p1.name : '—';
    document.getElementById('wp-s2-name').textContent = match.p2 ? match.p2.name : '—';
    document.getElementById('wp-s1-val').textContent = s1 || '—';
    document.getElementById('wp-s2-val').textContent = s2 || '—';
    document.getElementById('wp-s1-val').className = 'wp-score-val ' + (p1IsWinner ? 'win' : 'lose');
    document.getElementById('wp-s2-val').className = 'wp-score-val ' + (!p1IsWinner ? 'win' : 'lose');
    scoreBox.style.display = '';
  } else {
    scoreBox.style.display = 'none';
  }

  const popup = document.getElementById('winner-popup');
  popup.classList.add('show');
  requestAnimationFrame(() => launchParticles(isFinal));
}

export function closeWinnerPopup() {
  document.getElementById('winner-popup').classList.remove('show');
  stopParticles();
}

let particleRAF = null;
let particleCtx = null;
let particles = [];

export function launchParticles(intense) {
  const canvas = document.getElementById('wp-particle-canvas');
  if (!canvas) return;
  const box = canvas.parentElement.parentElement;
  canvas.width = box.offsetWidth;
  canvas.height = box.offsetHeight;
  particleCtx = canvas.getContext('2d');

  const count = intense ? 120 : 60;
  const colors = ['#f0a500', '#e05a2b', '#ffffff', '#ffd700', '#ff6b35', '#fff176'];
  particles = Array.from({ length: count }, () => ({
    x: canvas.width * Math.random(),
    y: canvas.height * 0.3 + Math.random() * 40,
    vx: (Math.random() - 0.5) * 6,
    vy: -4 - Math.random() * 6,
    size: 3 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.3,
    alpha: 1,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    gravity: 0.18 + Math.random() * 0.12,
    decay: 0.012 + Math.random() * 0.012,
  }));

  function tick() {
    if (!particleCtx) return;
    particleCtx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach((p) => {
      if (p.alpha <= 0) return;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rot += p.rotV;
      p.alpha -= p.decay;
      particleCtx.save();
      particleCtx.globalAlpha = Math.max(0, p.alpha);
      particleCtx.translate(p.x, p.y);
      particleCtx.rotate(p.rot);
      particleCtx.fillStyle = p.color;
      if (p.shape === 'rect') {
        particleCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        particleCtx.beginPath();
        particleCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        particleCtx.fill();
      }
      particleCtx.restore();
    });
    if (alive) particleRAF = requestAnimationFrame(tick);
    else stopParticles();
  }
  stopParticles();
  particleRAF = requestAnimationFrame(tick);
}

export function stopParticles() {
  if (particleRAF) {
    cancelAnimationFrame(particleRAF);
    particleRAF = null;
  }
  particleCtx = null;
  particles = [];
  const canvas = document.getElementById('wp-particle-canvas');
  if (canvas && canvas.getContext) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * @param {object} S
 * @param {{ switchBracketTab?: (tab: string) => void }} [bracketApiOrOpts] — có thể truyền bracketApi nếu gắn switchBracketTab
 */
export function checkBracketTabVisibility(S, bracketApiOrOpts = {}) {
  const switchBracketTab = bracketApiOrOpts.switchBracketTab;
  const tabBar = document.getElementById('bracket-tab-bar');
  if (!tabBar) return;
  const r0 = S.bracket && S.bracket[0];
  const hasDrawn = r0 && r0.some((m) => m.p1 || m.p2);
  if (hasDrawn) {
    tabBar.classList.add('visible');
  } else {
    tabBar.classList.remove('visible');
    const schedulePanel = document.getElementById('schedule-panel');
    if (schedulePanel && schedulePanel.classList.contains('active')) {
      switchBracketTab?.('bracket');
    }
  }
}

/**
 * Tạo bracketApi cho renderBracket / setWinner (gọi sau khi có S và các hàm persist).
 */
export function createBracketApi(S, handlers) {
  const api = {
    S,
    pushHistory: handlers.pushHistory,
    saveState: handlers.saveState,
    supaPushDebounced: handlers.supaPushDebounced,
    renderBracket: () => renderBracketInternal(S, api),
    renderSchedule: () => renderSchedule(S),
  };
  return api;
}
