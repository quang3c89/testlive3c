# CURSOR PROMPT V2 — Fix Large Tournament Module
# Đọc kỹ toàn bộ trước khi sửa. Làm từng BUG một, xong báo cáo rồi mới sang bug tiếp.
# KHÔNG sửa gì ngoài danh sách này. KHÔNG refactor bracket renderer gốc.

---

## PHÂN TÍCH CODE HIỆN TẠI (đọc trước khi làm)

Hệ thống dùng:
- `large-tournament.js` — module riêng, export `globalThis.Live3CLargeTournament`
- `tournament.html` — inline module script, hàm `renderLargeTournamentShell()` render toàn bộ UI giải lớn
- State lưu trong `globalThis.Live3CLargeTournament.getLargeTournamentState()`
- Palette màu lấy từ `getLargeContrastPalette()` — hiện đang trả về màu cứng không theo theme

**Vấn đề gốc rễ đã xác định từ code:**
1. `getLargeContrastPalette()` dùng `mixHex(bg, '#ffffff', 0.88)` tạo màu trắng sữa cứng — không follow CSS vars
2. Bracket bảng bị đẩy xuống vì `bracketContainer.style.minHeight = '0'` bị ghi đè sau khi render
3. `updateConfigPreview()` có nhưng `attachConfigListeners()` không được gọi khi mở modal
4. `renderLargeTournamentShell()` không có debounce — gọi nhiều lần liên tiếp gây lag
5. Tab Tổng quan: groupCards hardcode màu `rgba(255,255,255,0.96)` thay vì theo theme
6. Bốc thăm: `spinWheel()` không check `currentLargeGroupId` — bốc vào bracket chính thay vì bracket bảng
7. Preview: `largeTournamentTab === 'admin-preview'` có nhưng hàm render không được gọi đúng
8. Lịch: filter buttons không có active state visual rõ ràng

---

## BUG 1 — HEADER/PANEL MÀU TRẮNG SỮA KHÔNG THEO THEME

**File:** `tournament.html` — hàm `getLargeContrastPalette()`

**Vấn đề:** Hàm này tính màu từ `--bracket-bg` nhưng trả về `lightBg = mixHex(bg, '#ffffff', 0.88)` — luôn ra màu trắng sữa bất kể theme tối hay sáng.

**Fix — Thay toàn bộ hàm `getLargeContrastPalette()`:**

```javascript
function getLargeContrastPalette() {
  const root = getComputedStyle(document.documentElement);
  
  // Lấy đúng CSS variables của theme hiện tại
  const bg = root.getPropertyValue('--bg').trim() || '#0f172a';
  const card = root.getPropertyValue('--card').trim() || '#1a1f2e';
  const text = root.getPropertyValue('--text').trim() || '#e6edf3';
  const border = root.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.12)';
  const accent = root.getPropertyValue('--accent').trim() || '#f0a500';
  const accent2 = root.getPropertyValue('--accent2').trim() || '#e05a2b';
  const bracketBg = root.getPropertyValue('--bracket-bg').trim() || bg;

  // Detect light vs dark mode dựa trên luminance của bg
  const rgb = hexToRgb(card);
  const luminance = rgb ? (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255 : 0;
  const isLight = luminance > 0.5;

  return {
    panelBg: isLight
      ? `linear-gradient(135deg, ${mixHex(card, '#f8fafc', 0.3)}, ${mixHex(card, '#f1f5f9', 0.2)})`
      : `linear-gradient(135deg, ${card}, ${mixHex(card, '#000000', 0.2)})`,
    panelBorder: border,
    bg: card,
    text: text,
    textMuted: isLight ? mixHex(text, '#000000', 0.4) : mixHex(text, '#ffffff', 0.5),
    border: border,
    accent: accent,
    accent2: accent2,
    activeBg: `linear-gradient(135deg, ${accent}, ${accent2})`,
    activeFg: getContrastTextColor(accent),
    surfaceBorder: border,
  };
}
```

**Sau khi fix hàm palette, sửa tiếp trong `renderLargeTournamentShell()`:**

Tìm tất cả chỗ set style cứng màu trắng cho các panel và thay bằng CSS variables:

```javascript
// Thay dòng này:
tabContent.style.background = `linear-gradient(180deg, ...)`;

// Bằng:
tabContent.style.background = 'var(--card)';
tabContent.style.border = `1px solid var(--border)`;
tabContent.style.color = 'var(--text)';

// Tương tự cho phaseBar và tabBar:
phaseBar.style.background = 'var(--card)';
phaseBar.style.border = `1px solid var(--border)`;
tabBar.style.background = 'var(--card)';
tabBar.style.border = `1px solid var(--border)`;
```

**Trong phần groupCards của tab overview, thay:**
```javascript
// Thay màu cứng:
background:rgba(255,255,255,0.96)

// Bằng:
background:var(--card, #1a1f2e)
```

---

## BUG 2 — BRACKET BẢNG BỊ ĐẨY XUỐNG DƯỚI

**File:** `tournament.html` — hàm `mountLargeGroupBracket()` và `renderLargeTournamentShell()`

**Vấn đề:** Sau khi `renderBracket()` chạy, hàm set lại `bracketContainer.style.display = ''` nhưng container vẫn bị push xuống vì `large-tournament-root` dùng `padding:12px` và `bracketContainer` nằm ngoài root div.

**Cấu trúc HTML cần hiểu:**
```
#center-panel
  ├── #large-tournament-root  ← large UI render ở đây
  └── #bracket-container      ← bracket gốc, bị show/hide
```

**Fix trong `mountLargeGroupBracket()`:**

```javascript
function mountLargeGroupBracket(groupId) {
  const state = getLargeCurrentState();
  if (!state) return;
  const group = state.groups.find((g) => String(g.id) === String(groupId));
  if (!group) return;

  const header = document.getElementById('large-group-header');
  const byeAlert = document.getElementById('large-group-bye-alert');
  const footer = document.getElementById('large-group-footer');
  if (!header || !byeAlert || !footer) return;

  header.textContent = `${group.name} · ${group.playerCount} VĐV · Bracket ${group.bracketSize} · Ngày ${group.day}`;
  
  if (group.byeCount > 0) {
    byeAlert.style.display = '';
    byeAlert.textContent = `${group.byeCount} bye — phân cho ${group.byeCount} VĐV seed cao nhất`;
  } else {
    byeAlert.style.display = 'none';
  }
  footer.textContent = `Top ${state.advancePerGroup} người ${group.name} → Bracket chính`;

  // QUAN TRỌNG: render bracket vào container TRONG large-tournament-root
  // Không dùng #bracket-container gốc mà tạo div riêng bên trong tabContent
  const tabContent = document.getElementById('large-tab-content');
  if (!tabContent) return;

  // Tạo hoặc reuse bracket embed div
  let bracketEmbed = document.getElementById('large-bracket-embed');
  if (!bracketEmbed) {
    bracketEmbed = document.createElement('div');
    bracketEmbed.id = 'large-bracket-embed';
    bracketEmbed.style.cssText = 'width:100%;overflow-x:auto;margin-top:10px;';
    tabContent.appendChild(bracketEmbed);
  }
  bracketEmbed.innerHTML = '';

  // Render bracket trực tiếp vào embed div
  const oldBracket = S.bracket;
  const oldSize = S.bracketSize;

  S.bracket = group.matches;
  S.bracketSize = group.bracketSize;

  // Tạo container bracket tạm trong embed
  const tempCols = document.createElement('div');
  tempCols.id = 'large-bracket-cols-temp';
  tempCols.className = 'bracket-cols';
  tempCols.style.cssText = 'justify-content:center;min-height:0;padding:12px;';
  bracketEmbed.appendChild(tempCols);

  // Render vào temp container
  const originalContainer = document.getElementById('bracket-columns');
  const originalParent = originalContainer ? originalContainer.parentNode : null;
  
  // Tạm thời redirect render vào temp
  if (originalContainer) {
    originalContainer.style.display = 'none';
  }
  
  // Render bracket đơn giản bằng hàm buildBracketHTML
  bracketEmbed.innerHTML = buildInlineBracketHTML(group.matches, group.bracketSize, state.advancePerGroup, group.name);

  S.bracket = oldBracket;
  S.bracketSize = oldSize;

  if (originalContainer) {
    originalContainer.style.display = '';
  }

  const action = document.getElementById('large-group-actions');
  if (action && S.isAdmin) {
    action.innerHTML = `<button class="mbtn pri" type="button" onclick="openLargeAdvanceConfirm('${group.id}')">Xác nhận top ${state.advancePerGroup}</button>`;
  }
}
```

**Thêm hàm `buildInlineBracketHTML()` — render bracket nhỏ inline (không dùng SVG lines):**

```javascript
function buildInlineBracketHTML(matches, bracketSize, advancePerGroup, groupName) {
  if (!Array.isArray(matches) || !matches.length) {
    return '<div style="padding:20px;text-align:center;opacity:0.5;font-size:12px;">Bracket chưa được tạo. Cần bốc thăm trước.</div>';
  }

  const rounds = matches;
  let html = '<div style="display:flex;gap:4px;overflow-x:auto;padding:8px 4px;align-items:flex-start;">';

  rounds.forEach((roundMatches, rIdx) => {
    const roundName = getRoundName(rIdx, rounds.length);
    html += `<div style="display:flex;flex-direction:column;min-width:140px;">`;
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text);opacity:0.5;text-align:center;padding:4px 0 8px;">${roundName}</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:6px;padding:0 4px;">`;

    roundMatches.forEach((m, mIdx) => {
      const p1 = m?.p1;
      const p2 = m?.p2;
      const w1 = m?.winner && p1 && m.winner.id === p1.id;
      const w2 = m?.winner && p2 && m.winner.id === p2.id;
      const isByeM = isByeMatch(m);

      html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;overflow:hidden;">`;
      
      if (isByeM) {
        const pass = (p1 && !p1.isBye) ? p1 : p2;
        html += `<div style="padding:6px 10px;font-size:10px;font-weight:700;color:var(--accent);">${pass?.name || '—'} <span style="font-size:9px;opacity:0.5;">(BYE)</span></div>`;
      } else {
        html += `<div style="padding:5px 10px;font-size:10px;${w1 ? 'font-weight:700;color:var(--accent);' : 'color:var(--text);opacity:0.8;'}border-bottom:1px solid var(--border);">${p1?.name || '—'} ${m.s1 !== undefined && m.s1 !== '' ? `<span style="float:right;font-weight:700;">${m.s1}</span>` : ''}</div>`;
        html += `<div style="padding:5px 10px;font-size:10px;${w2 ? 'font-weight:700;color:var(--accent);' : 'color:var(--text);opacity:0.8;'}">${p2?.name || '—'} ${m.s2 !== undefined && m.s2 !== '' ? `<span style="float:right;font-weight:700;">${m.s2}</span>` : ''}</div>`;
      }
      html += `</div>`;
    });

    html += `</div></div>`;

    if (rIdx < rounds.length - 1) {
      html += `<div style="display:flex;align-items:center;padding:0 2px;color:var(--text);opacity:0.3;font-size:16px;padding-top:22px;">›</div>`;
    }
  });

  html += '</div>';
  return html;
}
```

**Đồng thời trong `renderLargeTournamentShell()`, khi tab là group, KHÔNG set `bracketContainer.style.display = ''`:**
```javascript
// Tìm đoạn này trong renderLargeTournamentShell:
} else if (largeTournamentTab.startsWith('group-')) {
    bracketContainer.style.display = 'none'; // ← LUÔN HIDE bracket container gốc
    schedulePanel.classList.remove('active');
    // ... rest of code
```

---

## BUG 3 — CONFIG REALTIME KHÔNG CẬP NHẬT + LAG KHI ÁP DỤNG

**File:** `tournament.html`

**Vấn đề 1:** `attachConfigListeners()` có trong code nhưng không được gọi khi mở modal.

**Fix — Trong hàm `openLargeTournamentAdminConfig()`, thêm `attachConfigListeners()` ở cuối:**
```javascript
function openLargeTournamentAdminConfig(totalPlayers) {
  // ... existing code ...
  
  openModal('large-admin-modal');
  
  // THÊM DÒNG NÀY — gọi sau khi modal đã hiện:
  setTimeout(() => {
    attachConfigListeners();
    updateConfigPreview(); // render preview ngay lập tức
  }, 50);
}
```

**Vấn đề 2:** `attachConfigListeners()` dùng `dataset.bound` để tránh bind nhiều lần, nhưng khi modal đóng/mở lại DOM không bị recreate nên bind vẫn còn — OK. Nhưng `updateConfigPreview()` gọi `renderGroupsPreview()` và `renderAdvanceSummary()` đang tìm sai container ID.

**Fix `updateConfigPreview()`:**
```javascript
function updateConfigPreview() {
  const total = parseInt(document.getElementById('large-total-players')?.value, 10) || 80;
  const perGroup = parseInt(document.getElementById('large-max-per-group')?.value, 10) || 20;
  const adv = parseInt(document.getElementById('large-advance-per-group')?.value, 10) || 4;
  
  // Đọc ngày từ hidden input (được set bởi pickLargeTournamentDay)
  const days = parseInt(document.getElementById('large-total-days')?.value, 10) || 3;
  
  const data = calcGroupsPreview(total, perGroup, days, adv);
  
  // Render vào đúng container trong modal
  const groupPreview = document.getElementById('large-admin-preview');
  if (groupPreview) {
    groupPreview.innerHTML = data.groups.map((g) => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);margin-bottom:6px;">
        <div>
          <b style="font-size:12px;color:var(--text);">Bảng ${g.name}</b>
          <div style="font-size:11px;color:var(--text);opacity:0.7;margin-top:2px;">
            ${g.size} VĐV · Bracket ${g.bracketSize} · Ngày ${g.day}
          </div>
        </div>
        <span style="font-size:11px;color:var(--text);opacity:0.6;">BYE: ${g.byes}</span>
      </div>
    `).join('');
  }
  
  const advPreview = document.getElementById('large-admin-main-preview');
  if (advPreview) {
    const bye = data.mainByes;
    advPreview.innerHTML = `
      <div style="font-size:12px;color:var(--text);line-height:1.8;">
        <b>${data.groups.length} bảng × Top ${adv}</b> = 
        <b style="color:var(--accent);">${data.totalAdv} người</b> → Bracket 
        <b>${data.mainBracket} slot</b>
        ${bye > 0 
          ? `<span style="color:#f59e0b;"> · ${bye} bye</span>` 
          : '<span style="color:#22c55e;"> · Không bye</span>'}
      </div>
    `;
  }
}
```

**Vấn đề 3:** Khi bấm "Áp dụng cấu hình", hàm `applyLargeTournamentConfig()` gọi `renderLargeTournamentShell()` đồng bộ nhưng state chưa kịp cập nhật — gây render cấu hình cũ.

**Fix `applyLargeTournamentConfig()`:**
```javascript
async function applyLargeTournamentConfig() {
  // Đọc giá trị từ form
  const totalPlayers = parseInt(document.getElementById('large-total-players')?.value, 10) || 80;
  const maxPerGroup = parseInt(document.getElementById('large-max-per-group')?.value, 10) || 20;
  const totalDays = parseInt(document.getElementById('large-total-days')?.value, 10) || 3;
  const advancePerGroup = parseInt(document.getElementById('large-advance-per-group')?.value, 10) || 4;

  if (!globalThis.Live3CLargeTournament?.updateLargeTournamentConfig) return;

  // Cập nhật state trước
  const state = globalThis.Live3CLargeTournament.updateLargeTournamentConfig({
    totalPlayers, maxPerGroup, totalDays, advancePerGroup,
  });

  const synced = syncLargeTournamentPlayersFromRegistration(state);
  
  try { 
    localStorage.setItem('live3c_large_v1', JSON.stringify(synced)); 
  } catch (e) {}
  
  isLargeTournamentMode = true;
  largeTournamentTab = synced.groups?.length ? `group-${synced.groups[0].id}` : 'overview';
  saveState();
  closeModal('large-admin-modal');

  // Đợi một tick rồi render để đảm bảo state đã settle
  await new Promise(r => setTimeout(r, 50));
  renderLargeTournamentShell();

  // Push lên Supabase sau (không block UI)
  if (CURRENT_TOURNAMENT_ID && S.supaUrl && S.supaKey) {
    supaFetch(`tournaments?id=eq.${CURRENT_TOURNAMENT_ID}`, 'PATCH', {
      settings: {
        ...((await supaFetch(`tournaments?id=eq.${CURRENT_TOURNAMENT_ID}&select=settings`, 'GET'))?.[0]?.settings || {}),
        large_tournament_config: synced
      }
    }).catch(err => console.error('Push error:', err));
  }

  showToast(`✅ Đã áp dụng: ${synced.totalPlayers} VĐV · ${synced.groups.length} bảng · ${synced.totalDays} ngày`, 'ok');
}
```

---

## BUG 4 — XEM NHANH PREVIEW KHÔNG HOẠT ĐỘNG

**Vấn đề:** Tab `admin-preview` có trong switch case nhưng `tabContent.innerHTML` bị set thành text rỗng thay vì gọi đúng hàm preview.

**Fix — trong `renderLargeTournamentShell()`, thay đoạn `admin-preview`:**
```javascript
} else if (largeTournamentTab === 'admin-preview') {
  bracketContainer.style.display = 'none';
  schedulePanel.classList.remove('active');
  
  const state = getLargeCurrentState();
  if (!state) return;
  
  const groups = Array.isArray(state.groups) ? state.groups : [];
  const totalAdv = groups.length * state.advancePerGroup;
  
  // Dùng lại nextPow2 để tính
  function np2(n) { let p=1; while(p<n) p*=2; return p; }
  const mainBk = np2(totalAdv || 2);
  const mainBye = mainBk - totalAdv;
  
  tabContent.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="padding:12px;border-radius:12px;background:var(--card);border:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--text);opacity:0.6;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;">Tổng quan cấu trúc</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${[
            { label: 'Tổng VĐV', val: state.totalPlayers },
            { label: 'Số bảng', val: groups.length },
            { label: 'Người/bảng advance', val: state.advancePerGroup },
            { label: 'Ngày thi đấu', val: state.totalDays },
            { label: 'Bracket chính', val: mainBk + ' slot' },
            { label: 'Bye bracket chính', val: mainBye > 0 ? mainBye : 'Không có' },
          ].map(x => `<div style="padding:10px 14px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid var(--border);text-align:center;min-width:100px;">
            <div style="font-size:20px;font-weight:700;color:var(--accent);">${x.val}</div>
            <div style="font-size:10px;color:var(--text);opacity:0.6;margin-top:3px;">${x.label}</div>
          </div>`).join('')}
        </div>
      </div>
      
      <div style="font-size:11px;font-weight:700;color:var(--text);opacity:0.6;letter-spacing:.06em;text-transform:uppercase;margin-top:4px;">Chi tiết các bảng</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
        ${groups.map((g, i) => {
          const colors = ['#f0a500','#3b82f6','#22c55e','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];
          const c = colors[i % colors.length];
          return `<div style="padding:12px;border-radius:12px;background:var(--card);border:1px solid var(--border);border-top:3px solid ${c};">
            <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;">${g.name}</div>
            <div style="font-size:18px;font-weight:700;color:${c};line-height:1;">${g.playerCount}</div>
            <div style="font-size:10px;color:var(--text);opacity:0.6;margin-top:4px;">VĐV · Bracket ${g.bracketSize}</div>
            <div style="font-size:10px;color:var(--text);opacity:0.6;">${g.byeCount} bye · Ngày ${g.day}</div>
            <div style="margin-top:8px;font-size:10px;font-weight:600;color:${c};">↑ Top ${state.advancePerGroup} → chính</div>
          </div>`;
        }).join('')}
      </div>
      
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button class="mbtn" type="button" onclick="largeTournamentTab='admin';renderLargeTournamentShell()">← Quay lại Admin</button>
        <button class="mbtn pri" type="button" onclick="openLargeTournamentAdminConfig(${state.totalPlayers})">Chỉnh cấu hình</button>
      </div>
    </div>
  `;
}
```

**Đồng thời trong tab Admin, nút "Xem nhanh preview" cần trỏ đúng:**
```javascript
// Trong tabContent của tab 'admin', sửa nút:
<button class="mbtn" type="button" onclick="largeTournamentTab='admin-preview'; renderLargeTournamentShell()">Xem nhanh preview</button>
```

---

## BUG 5 — BỐC THĂM CHƯA ÁP DỤNG CHO TỪNG BẢNG

**Vấn đề:** `spinWheel()` → `flyPlayer()` → `commitPlayer()` luôn ghi vào `S.bracket` (bracket chính) thay vì bracket của bảng đang active.

**Fix — Thêm context bảng vào quá trình bốc thăm.**

**Bước 5a: Thêm group indicator khi đang ở tab bảng:**

Tìm đoạn render header wheel control (gần `#left-panel`), thêm dropdown chọn bảng khi large tournament mode:

```javascript
// Tạo hàm mới:
function updateSpinGroupContext() {
  const indicator = document.getElementById('spin-group-indicator');
  if (!indicator) return;
  
  if (!isLargeTournamentMode) {
    indicator.style.display = 'none';
    return;
  }
  
  const state = getLargeCurrentState();
  if (!state || !Array.isArray(state.groups)) {
    indicator.style.display = 'none';
    return;
  }
  
  indicator.style.display = '';
  const currentGid = largeTournamentTab.startsWith('group-') 
    ? largeTournamentTab.replace('group-', '') 
    : null;
  
  indicator.innerHTML = `
    <div style="font-size:10px;color:var(--text);opacity:0.6;margin-bottom:4px;">Bốc thăm cho:</div>
    <select id="spin-group-select" style="width:100%;padding:4px 8px;border-radius:7px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:11px;font-family:inherit;" onchange="setSpinGroupContext(this.value)">
      ${state.groups.map(g => `<option value="${g.id}" ${String(g.id) === String(currentGid) ? 'selected' : ''}>${g.name}</option>`).join('')}
    </select>
  `;
  
  if (currentGid) {
    currentSpinGroupId = currentGid;
  } else if (!currentSpinGroupId) {
    currentSpinGroupId = state.groups[0]?.id;
  }
}

let currentSpinGroupId = null;

function setSpinGroupContext(groupId) {
  currentSpinGroupId = groupId;
}
```

**Bước 5b: Thêm `<div id="spin-group-indicator">` trong HTML, ngay bên dưới `.ctrl-row`:**
```html
<div id="spin-group-indicator" style="display:none;padding:4px 2px 6px;"></div>
```

**Bước 5c: Gọi `updateSpinGroupContext()` khi switch tab bảng:**

Trong `switchLargeTournamentTab()`:
```javascript
function switchLargeTournamentTab(tab) {
  largeTournamentTab = tab;
  renderLargeTournamentShell();
  updateSpinGroupContext(); // ← thêm dòng này
}
```

**Bước 5d: Sửa `commitPlayer()` để ghi vào bracket bảng thay vì bracket chính:**

```javascript
function commitPlayer(player, slot) {
  // Nếu đang ở large tournament mode, ghi vào bracket của bảng
  if (isLargeTournamentMode && currentSpinGroupId) {
    const state = globalThis.Live3CLargeTournament?.getLargeTournamentState?.();
    if (state) {
      const groups = state.groups.map(g => {
        if (String(g.id) !== String(currentSpinGroupId)) return g;
        
        // Clone matches và cập nhật slot
        const matches = JSON.parse(JSON.stringify(g.matches || []));
        if (matches[slot.r] && matches[slot.r][slot.m]) {
          matches[slot.r][slot.m][slot.pKey] = { ...player, drawn: true, isBye: false };
        }
        
        // Cập nhật players.drawn
        const players = (g.players || []).map(p => 
          p.id === player.id ? { ...p, drawn: true } : p
        );
        
        return { ...g, matches, players };
      });
      
      globalThis.Live3CLargeTournament.updateLargeTournamentConfig({ groups });
      try { 
        localStorage.setItem('live3c_large_v1', JSON.stringify(
          globalThis.Live3CLargeTournament.getLargeTournamentState()
        )); 
      } catch(e) {}
      
      // Đánh dấu drawn trong S.players để wheel không quay lại
      S.players.forEach(p => { if (p.id === player.id) p.drawn = true; });
      
      renderLargeTournamentShell();
      renderPlayers();
      drawWheel();
      saveState();
      supaPushDebounced();
      return;
    }
  }
  
  // Fallback: mode cũ — ghi vào S.bracket
  S.players.forEach(p => { if (p.id === player.id) p.drawn = true; });
  S.bracket[slot.r][slot.m][slot.pKey] = { ...player, drawn: true, isBye: false };
  syncRound1ByesToRound2();
  renderBracket();
  renderPlayers();
  if (currentBracketTab === 'register') renderRegisterCards();
  drawWheel();
  saveState();
  supaPushDebounced();
}
```

**Bước 5e: Sửa `findNextSlot()` và `ensureDrawPlan()` để tìm slot trong bracket bảng:**

```javascript
function findNextSlotInGroup(groupId) {
  const state = globalThis.Live3CLargeTournament?.getLargeTournamentState?.();
  if (!state) return null;
  const group = state.groups.find(g => String(g.id) === String(groupId));
  if (!group || !Array.isArray(group.matches) || !group.matches[0]) return null;
  
  const r0 = group.matches[0];
  for (let m = 0; m < r0.length; m++) {
    if (!r0[m].p1 || r0[m].p1.isBye) return { r: 0, m, pKey: 'p1' };
    if (!r0[m].p2 || r0[m].p2.isBye) return { r: 0, m, pKey: 'p2' };
  }
  return null;
}

// Trong spinWheel(), thêm logic lấy slot từ bảng:
function spinWheel() {
  if (S.isSpinning) return;
  if (!S.isAdmin) return;
  
  // Xác định slot target
  let targetSlot;
  if (isLargeTournamentMode && currentSpinGroupId) {
    targetSlot = findNextSlotInGroup(currentSpinGroupId);
    if (!targetSlot) {
      showToast(`🏁 Bảng ${currentSpinGroupId} đã bốc hết!`);
      return;
    }
  } else {
    // ... existing slot finding logic
    ensureDrawPlan();
    const planItem = consumeDrawPlanItem();
    if (!planItem) { showToast('🏆 Bracket đã đầy!'); return; }
    targetSlot = planItem.slot;
  }
  
  // ... rest of spinWheel with targetSlot
}
```

---

## BUG 6 — LỊCH: FILTER BUTTONS THIẾU ACTIVE STATE + THIẾU BORDER

**File:** `tournament.html` — hàm `renderLargeScheduleTab()`

**Fix CSS cho buttons trong lịch — thêm vào `<style>` trong `tournament.html`:**

```css
/* Schedule filter buttons */
.sch-filter-day-btn,
.sch-filter-group-btn {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
  transition: all 0.15s;
  opacity: 0.7;
}

.sch-filter-day-btn:hover,
.sch-filter-group-btn:hover {
  opacity: 1;
  border-color: var(--accent);
}

.sch-filter-day-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  opacity: 1;
  box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 40%, transparent);
}

.sch-filter-group-btn.active {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.5);
  color: #fff;
  opacity: 1;
}

/* Schedule item row */
.sch-item-row {
  display: grid;
  grid-template-columns: 58px 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
  margin-bottom: 5px;
  transition: background 0.12s;
}

.sch-item-row:hover {
  background: rgba(255,255,255,0.05);
}

.sch-item-row.live-row {
  border-color: rgba(34,197,94,0.45);
  background: rgba(34,197,94,0.06);
}
```

**Fix hàm `renderLargeScheduleTab()` — dùng class mới:**

```javascript
function renderLargeScheduleTab() {
  const box = document.getElementById('large-tab-content');
  if (!box) return;
  const state = getLargeCurrentState();
  if (!state) return;

  const days = Array.from({ length: Math.max(2, Number(state.totalDays) || 3) }, (_, i) => i + 1);
  const groups = (state.groups || []).map((g) => g.name);
  const groupFilters = ['Tất cả bảng', ...groups, 'Bracket chính'];

  const items = buildLargeScheduleItems();
  const selectedDay = Number(box.getAttribute('data-filter-day') || 0);
  const selectedGroup = box.getAttribute('data-filter-group') || 'all';

  const filtered = items.filter((x) => {
    const dayOk = selectedDay ? x.day === selectedDay : true;
    const groupOk = selectedGroup === 'all' || selectedGroup === 'Tất cả bảng' ? true : x.group === selectedGroup;
    return dayOk && groupOk;
  });

  // Render filter rows với class mới
  const dayBtns = [
    `<button class="sch-filter-day-btn ${!selectedDay ? 'active' : ''}" onclick="setLargeScheduleFilterDay(0)">Tất cả</button>`,
    ...days.map(d => `<button class="sch-filter-day-btn ${selectedDay === d ? 'active' : ''}" onclick="setLargeScheduleFilterDay(${d})">Ngày ${d}</button>`)
  ].join('');

  const groupBtns = groupFilters.map(g => {
    const val = g === 'Tất cả bảng' ? 'all' : g;
    const isActive = (val === 'all' && (selectedGroup === 'all' || selectedGroup === 'Tất cả bảng')) 
      || selectedGroup === g;
    return `<button class="sch-filter-group-btn ${isActive ? 'active' : ''}" onclick="setLargeScheduleFilterGroup('${val.replace(/'/g,"\\'")}')"> ${g}</button>`;
  }).join('');

  const rows = filtered.length ? filtered.map(x => {
    const tagColors = {
      'Bảng A': '#2d5c3e', 'Bảng B': '#163a72', 'Bảng C': '#6e4a0a',
      'Bảng D': '#3a2070', 'Bracket chính': '#7c3aed',
    };
    const tagColor = tagColors[x.group] || '#555';
    
    return `<div class="sch-item-row ${x.status === 'playing' ? 'live-row' : ''}">
      <b style="font-size:11px;color:var(--text);opacity:0.7;">${x.time}</b>
      <span style="font-size:12px;color:var(--text);${x.status === 'done' ? 'text-decoration:line-through;opacity:0.6;' : ''}">${x.text}</span>
      <span style="font-size:10px;padding:3px 9px;border-radius:999px;border:1px solid ${tagColor};background:${tagColor}22;color:var(--text);white-space:nowrap;">${x.group}</span>
      ${x.status === 'playing' 
        ? '<span style="font-size:10px;padding:2px 7px;border-radius:999px;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.45);color:#4ade80;">LIVE</span>'
        : x.status === 'done'
          ? '<span style="font-size:10px;opacity:0.5;color:var(--text);">✓ Xong</span>'
          : '<span style="font-size:10px;opacity:0.4;color:var(--text);">Chờ</span>'}
    </div>`;
  }).join('') 
  : `<div style="padding:20px;text-align:center;font-size:12px;opacity:0.5;color:var(--text);">Không có trận theo bộ lọc này.</div>`;

  box.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${dayBtns}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${groupBtns}</div>
      <div style="display:flex;flex-direction:column;gap:0;padding:4px 0;">${rows}</div>
    </div>
  `;
}
```

---

## BUG 7 — LỖI CODE KHÁC (bonus — fix nếu có thời gian)

**7a. `renderLargeTournamentShell()` được gọi liên tiếp nhiều lần gây chớp UI:**
```javascript
// Thêm debounce ở đầu file (sau các biến global):
let _renderLargeDebounceTimer = null;
const renderLargeTournamentShellDebounced = () => {
  clearTimeout(_renderLargeDebounceTimer);
  _renderLargeDebounceTimer = setTimeout(renderLargeTournamentShell, 30);
};

// Thay tất cả chỗ gọi renderLargeTournamentShell() bằng renderLargeTournamentShellDebounced()
// Ngoại trừ trong applyLargeTournamentConfig() giữ nguyên await
```

**7b. `mountLargeMainBracket()` set `S.bracket = main.matches` và `S.bracketSize` rồi gọi `renderBracket()` — sau đó restore, nhưng nếu có lỗi thì S.bracket bị sai mãi:**
```javascript
// Bọc trong try-finally:
try {
  S.bracket = main.matches;
  S.bracketSize = main.bracketSize || 2;
  renderBracket();
} finally {
  S.bracket = oldBracket;
  S.bracketSize = oldSize;
  S.isAdmin = oldIsAdmin;
}
```

**7c. `syncLargeTournamentPlayersFromRegistration()` reset toàn bộ players của bảng mỗi lần gọi — mất kết quả bốc thăm:**
```javascript
// Thêm guard: chỉ sync nếu bảng chưa có players
groups.forEach((g, idx) => {
  // Nếu bảng đã có players và đã bốc thăm một phần, giữ nguyên
  const existingPlayers = g.players || [];
  const hasDrawnPlayers = existingPlayers.some(p => p.drawn);
  if (hasDrawnPlayers) return; // ← THÊM DÒNG NÀY
  
  // ... rest of sync logic
});
```

---

## THỨ TỰ LÀM

1. Bug 1 (màu theme) — quan trọng nhất, ảnh hưởng toàn bộ visual
2. Bug 2 (bracket vị trí) — ảnh hưởng core feature
3. Bug 3 (config realtime) — UX quan trọng
4. Bug 6 (lịch style) — dễ làm, impact cao
5. Bug 4 (preview) — medium
6. Bug 5 (bốc thăm bảng) — phức tạp nhất, làm cuối
7. Bug 7 (code quality) — nếu còn thời gian

**Sau mỗi bug, chạy thử và báo cáo trước khi làm bug tiếp.**
