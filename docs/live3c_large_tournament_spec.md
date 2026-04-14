# Live3c — Large Tournament Module Spec
> Paste toàn bộ file này vào Cursor. Đây là spec đầy đủ để implement module giải lớn (>64 người).

---

## 1. TỔNG QUAN FLOW

```
Khi admin nhập số VĐV:
  ≤ 64 người  →  Giữ nguyên bracket hiện tại (KHÔNG thay đổi gì)
  > 64 người  →  Kích hoạt Large Tournament Module (module mới, tách biệt)
```

**Nguyên tắc cốt lõi:**
- Module cũ (`≤64`) và module mới (`>64`) **KHÔNG chia sẻ code render bracket**.
- Module mới wrap module cũ: mỗi bảng trong module mới dùng lại bracket renderer hiện tại.
- Không refactor code bracket cũ — chỉ thêm lớp mới bên ngoài.

---

## 2. TRIGGER — KHI NÀO CHUYỂN MODULE

### Điểm trigger: Nút "Cỡ Bracket" hiện tại

**Thay đổi cần làm ở nút "Cỡ Bracket" hiện tại:**

```
Khi admin nhập số VĐV vào ô "Số lượng":
  - Nếu số ≤ 64:
      → Hiển thị bracket bình thường như cũ
      → Thêm badge thông báo: "Chế độ giải nhỏ (≤64 người)"
  
  - Nếu số > 64:
      → Hiển thị thông báo:
        "Giải có [N] người vượt giới hạn 64. 
         Chuyển sang chế độ Giải Lớn để chia bảng và quản lý nhiều ngày."
      → Nút: [Chuyển sang Giải Lớn] + [Huỷ]
      → Nếu bấm "Chuyển sang Giải Lớn": khởi động Large Tournament Module
      → Nếu bấm "Huỷ": đóng modal, không làm gì
```

**UI thông báo giới hạn (≤64):**
```
┌─────────────────────────────────────────────┐
│  Cỡ Bracket                                 │
│                                             │
│  Số lượng VĐV: [____]                       │
│                                             │
│  ⚠ Tối đa 64 người cho chế độ này.         │
│    Nhập >64 để chuyển sang Giải Lớn.        │
│                                             │
│  [Tạo bracket]  [Huỷ]                       │
└─────────────────────────────────────────────┘
```

---

## 3. LARGE TOURNAMENT MODULE — KIẾN TRÚC

### 3.1 Data Model

```javascript
// State object cho Large Tournament
const largeTournamentState = {
  totalPlayers: 80,        // Tổng số VĐV
  totalDays: 3,            // Số ngày thi đấu
  advancePerGroup: 4,      // Số người top mỗi bảng lên bracket chính
  
  groups: [
    {
      id: 'A',
      name: 'Bảng A',
      playerCount: 20,     // Số VĐV trong bảng
      bracketSize: 32,     // Lũy thừa 2 gần nhất >= playerCount
      byeCount: 12,        // bracketSize - playerCount
      day: 1,              // Ngày thi đấu bảng này
      players: [],         // Mảng VĐV (dùng lại player object hiện tại)
      matches: [],         // Dùng lại match object hiện tại
      advancedPlayers: [], // Top N người đã xác nhận vào bracket chính
      status: 'pending'    // 'pending' | 'active' | 'done'
    },
    // ... các bảng khác
  ],
  
  mainBracket: {
    bracketSize: 32,       // nextPow2(groups.length * advancePerGroup)
    byeCount: 0,
    players: [],           // Gộp từ advancedPlayers của các bảng
    matches: [],
    status: 'locked'       // 'locked' (chờ vòng loại) | 'active' | 'done'
  }
}
```

### 3.2 Hàm tính toán cốt lõi

```javascript
// Tính lũy thừa 2 gần nhất >= n
function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Tự động chia bảng từ tổng số VĐV và giới hạn/bảng
function autoSplitGroups(totalPlayers, maxPerGroup = 20) {
  let numGroups = Math.ceil(totalPlayers / maxPerGroup);
  if (numGroups < 2) numGroups = 2;
  
  const base = Math.floor(totalPlayers / numGroups);
  const extra = totalPlayers % numGroups;
  
  return Array.from({ length: numGroups }, (_, i) => ({
    id: 'ABCDEFGH'[i],
    playerCount: base + (i < extra ? 1 : 0),
    bracketSize: nextPow2(base + (i < extra ? 1 : 0)),
    byeCount: nextPow2(base + (i < extra ? 1 : 0)) - (base + (i < extra ? 1 : 0)),
    day: Math.floor(i / numGroups * (totalDays - 1)) + 1
  }));
}

// Validate advance count
function validateAdvanceCount(advancePerGroup, groups) {
  const minGroupSize = Math.min(...groups.map(g => g.playerCount));
  return Math.min(advancePerGroup, minGroupSize);
}

// Tính mainBracket size
function calcMainBracket(groups, advancePerGroup) {
  const totalAdvance = groups.length * advancePerGroup;
  return {
    totalAdvance,
    bracketSize: nextPow2(totalAdvance),
    byeCount: nextPow2(totalAdvance) - totalAdvance
  };
}
```

---

## 4. UI LAYOUT — TAB STRUCTURE

### 4.1 Khi Large Tournament Module active, replace toàn bộ UI hiện tại bằng:

```
┌──────────────────────────────────────────────────────────────┐
│ [Tên giải] · 80 VĐV · 4 bảng · 3 ngày          [Chia sẻ]   │
├──────────────────────────────────────────────────────────────┤
│ Phase bar:  ● Vòng loại  ›  ○ Bracket chính  ›  ○ Chung kết │
├──────────────────────────────────────────────────────────────┤
│ [Tổng quan] [Bảng A] [Bảng B] [Bảng C] [Bảng D]            │
│             [Bracket chính 🔒] [Lịch] [Admin ⚙]            │
└──────────────────────────────────────────────────────────────┘
```

**Quy tắc tab:**
- Số tab Bảng A/B/C... = số bảng được tính tự động
- Tab "Bracket chính" có icon 🔒 và disabled cho đến khi tất cả bảng status = 'done'
- Khi tất cả bảng done → tab "Bracket chính" tự unlock, hiện badge "Sẵn sàng"
- Tab "Admin" chỉ hiện khi user có quyền admin (đã có logic auth của bạn)

### 4.2 Tab Tổng quan

Hiển thị:
- 4 stat cards: Tổng VĐV / Số bảng / Tổng trận / Số ngày
- Grid card từng bảng: tên bảng, số VĐV, ngày thi đấu, trạng thái (Chờ / Đang đánh / Xong), Top N → Bracket chính
- Thanh tiến độ: bao nhiêu % trận đã xong
- Flow text: "Ngày 1–2: Vòng loại 4 bảng. Ngày 3: Bracket chính 16 người."

### 4.3 Tab Bảng A / B / C / D

Mỗi tab là **bracket renderer hiện tại** (giữ nguyên code) với:
- Header: "Bảng A · 20 VĐV · Bracket 32 · Ngày 1"
- Alert nếu có bye: "12 bye — phân cho 12 VĐV seed cao nhất"
- Bracket render như bình thường (tái dùng component hiện tại)
- Footer: "Top 4 người bảng A → Bracket chính"
- Nút "Xác nhận top 4" (chỉ admin thấy) → mở modal chọn 4 người advance

### 4.4 Tab Bracket chính

Khi locked:
```
┌────────────────────────────────────┐
│  🔒 Bracket chính chưa sẵn sàng   │
│  Cần hoàn thành: Bảng B, Bảng D   │
│  (Bảng A ✓, Bảng C ✓)             │
└────────────────────────────────────┘
```

Khi unlocked:
- Header: "Bracket chính · 16 VĐV · Ngày 3"
- Grid nguồn: "Bảng A: 4 người · Bảng B: 4 người · Bảng C: 4 người · Bảng D: 4 người"
- Bracket render (dùng lại component hiện tại, size = mainBracket.bracketSize)
- Seeding rule: Top 1 mỗi bảng chia vào 4 nhánh khác nhau (không gặp nhau trước bán kết)

### 4.5 Tab Lịch thi đấu

Hai filter row:
```
Row 1 (filter ngày): [Tất cả] [Ngày 1] [Ngày 2] [Ngày 3]
Row 2 (filter bảng): [Tất cả bảng] [Bảng A] [Bảng B] [Bảng C] [Bảng D] [Bracket chính]
```

Mỗi trận hiển thị:
```
08:00 | Nguyễn A vs Trần B | [Bảng A] | → Bracket
```
- Tag màu theo bảng (A=xanh lá, B=xanh dương, C=cam, D=tím, Bracket chính=màu đặc biệt)
- Trận đang live: nền highlight nhẹ + badge "LIVE"
- Trận xong: gạch chân tên + link "Kết quả"

### 4.6 Tab Admin

```
Section 1: Cấu hình cơ bản
  - Tổng VĐV: [input number]
  - Giới hạn người/bảng: [input number, default 20]
  - Số ngày: [2] [3] [4] [5] toggle pills
  - [Tự động chia đều] button

Section 2: Phân bổ bảng (hiện sau khi chọn xong section 1)
  List từng bảng:
  ● Bảng A — 20 VĐV — Bracket 32 — Ngày 1  [Sửa]
  ● Bảng B — 20 VĐV — Bracket 32 — Ngày 1  [Sửa]
  ● Bảng C — 20 VĐV — Bracket 32 — Ngày 2  [Sửa]
  ● Bảng D — 20 VĐV — Bracket 32 — Ngày 2  [Sửa]
  
  Click [Sửa]: inline edit số VĐV và ngày thi đấu của bảng đó

Section 3: Advance setting
  "Top bao nhiêu người/bảng vào bracket chính?"
  Slider: 1 ——●—— 8   [4 người]
  Preview: "4 bảng × 4 người = 16 người → Bracket 16 (không có bye)"

Section 4: Nút hành động
  [Áp dụng cấu hình] [Reset về mặc định]
```

---

## 5. SEEDING VÀ BYE LOGIC

### 5.1 Bye trong bracket bảng

```javascript
// Khi bracketSize > playerCount, có bye
// Phân bye cho các slot cuối của bracket (vị trí seed thấp)
// VĐV seed 1 (hạt giống) KHÔNG bao giờ có bye ở vòng 1 với BYE
// BYE được đặt ở vị trí đối diện với VĐV seed thấp nhất

function assignByes(players, bracketSize) {
  // Sắp xếp players theo seed (seed cao nhất = số nhỏ nhất)
  // Điền BYE vào các slot trống cuối bracket
  const slots = new Array(bracketSize).fill(null);
  players.forEach((p, i) => slots[i] = p);
  // slots[playerCount..bracketSize-1] = BYE
  return slots;
}
```

### 5.2 Seeding trong bracket chính

```javascript
// Nguyên tắc: Top 1 mỗi bảng không gặp nhau trước bán kết
// Với 4 bảng × 4 người = 16 người → bracket 16:
// Nhánh 1: Top1-A, Top2-B, Top3-C, Top4-D
// Nhánh 2: Top1-B, Top2-A, Top3-D, Top4-C  
// Nhánh 3: Top1-C, Top2-D, Top3-A, Top4-B
// Nhánh 4: Top1-D, Top2-C, Top3-B, Top4-A

// Bye trong bracket chính (nếu có):
// Phân bye cho Top 1 của bảng có seed cao nhất
```

---

## 6. VISUAL DESIGN — SOFT UI STYLE

Giữ nguyên phong cách soft UI đang có. Các token màu bổ sung cho bảng:

```css
:root {
  /* Màu cho từng bảng — dùng nhất quán xuyên suốt app */
  --group-A: #2d5c3e;  /* Xanh lá đậm */
  --group-A-bg: #e3f0e8;
  --group-A-txt: #1a3824;
  
  --group-B: #163a72;  /* Xanh dương đậm */
  --group-B-bg: #e3edf7;
  --group-B-txt: #0c2448;
  
  --group-C: #6e4a0a;  /* Cam đậm */
  --group-C-bg: #fdf1dc;
  --group-C-txt: #44300a;
  
  --group-D: #3a2070;  /* Tím đậm */
  --group-D-bg: #eceaf8;
  --group-D-txt: #221444;
  
  --group-E: #7a1a1a;  /* Đỏ đậm */
  --group-E-bg: #fae8e8;
  --group-E-txt: #4a0e0e;
  
  --group-F: #0a5c5c;  /* Xanh ngọc đậm */
  --group-F-bg: #dcf5f5;
  --group-F-txt: #063838;
  
  /* Bracket chính */
  --main-bracket: #3a2070;
  --main-bracket-bg: #eceaf8;
  --main-bracket-txt: #221444;
}
```

**Bracket match box — style cụ thể:**
```css
.bk-match {
  background: var(--surface);
  border-radius: 9px;
  border: 1px solid rgba(0,0,0,0.07);
  overflow: hidden;
  transition: border-color 0.15s;
}
.bk-match:hover { border-color: rgba(45, 92, 62, 0.35); cursor: pointer; }
.bk-match.live  { border-color: rgba(45, 92, 62, 0.5); background: var(--group-A-bg); }
.bk-match.done  { opacity: 0.65; }
.bk-match.bye   { opacity: 0.38; border-style: dashed; cursor: default; }

.bk-player {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 9px;
  font-size: 11px;
  color: var(--txt-secondary);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.bk-player:last-child { border-bottom: none; }
.bk-player.winner    { color: var(--group-A-txt); font-weight: 500; }
.bk-player.bye-slot  { color: var(--txt-tertiary); font-style: italic; }
.bk-player.advancing { color: var(--main-bracket-txt); font-weight: 500; }
```

**Phase bar style:**
```css
.phase-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 20px;
  background: var(--surface-2);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  overflow-x: auto;
}
.phase-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  color: var(--txt-tertiary);
  transition: all 0.15s;
}
.phase-item.active {
  background: var(--surface);
  color: var(--txt);
  border: 1px solid rgba(0,0,0,0.1);
}
.phase-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
}
```

---

## 7. TRẠNG THÁI VÀ TRANSITIONS

### Trạng thái của từng bảng:

| Status | Hiển thị | Tab style |
|--------|----------|-----------|
| `pending` | Chưa bắt đầu · N VĐV | Bình thường |
| `active` | Đang thi đấu · X/Y trận | Tab có dot nhấp nháy |
| `done` | Xong · Top 4 đã chọn | Tab có ✓ |

### Trạng thái bracket chính:

| Condition | Hiển thị |
|-----------|----------|
| Chưa đủ bảng done | 🔒 Tab disabled + "Cần hoàn thành: Bảng B, D" |
| Tất cả bảng done, chưa confirm | "Sẵn sàng tạo bracket" + nút "Tạo bracket chính" |
| Bracket chính đã tạo | Hiện bracket bình thường |

---

## 8. MODAL XÁC NHẬN ADVANCE (Admin only)

Khi admin bấm "Xác nhận top N" trong tab Bảng X:

```
┌──────────────────────────────────────────────┐
│  Chọn 4 người vào Bracket chính — Bảng A     │
│                                              │
│  ○ 1. Nguyễn Văn An      (Hạt giống)        │
│  ○ 2. Trần Minh Bảo                         │
│  ○ 3. Lê Thanh Cường                        │
│  ○ 4. Hoàng Sơn                             │
│  ─────────────────────────────────────────  │
│  ○ 5. Vũ Quang Huy                          │
│  ○ 6. Phạm Đức Dũng                         │
│  ...                                         │
│                                              │
│  Đã chọn: 0 / 4 người                       │
│                                              │
│  [Xác nhận]  [Huỷ]                          │
└──────────────────────────────────────────────┘
```

- Default: pre-select top 4 dựa trên kết quả bracket (người thắng nhiều nhất)
- Admin có thể override bằng cách chọn tay
- Sau khi xác nhận: bảng status → 'done', advancedPlayers được ghi vào state

---

## 9. DATA PERSISTENCE

Dùng lại cơ chế Supabase sync hiện tại. Thêm vào schema:

```sql
-- Thêm cột vào bảng tournaments hiện tại
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS
  large_tournament_config JSONB DEFAULT NULL;

-- large_tournament_config schema:
-- {
--   "totalPlayers": 80,
--   "totalDays": 3,
--   "advancePerGroup": 4,
--   "groups": [
--     { "id": "A", "playerCount": 20, "bracketSize": 32, "day": 1, "status": "done", "advancedPlayerIds": ["uuid1","uuid2","uuid3","uuid4"] },
--     ...
--   ],
--   "mainBracket": { "status": "locked", "bracketSize": 16 }
-- }
```

Khi `large_tournament_config` là null → dùng module cũ (≤64 người).
Khi không null → dùng Large Tournament Module.

---

## 10. CHECKLIST IMPLEMENTATION

**Phase 1 — Trigger & Warning (1-2 ngày):**
- [ ] Thêm validation vào modal "Cỡ Bracket" hiện tại
- [ ] Hiển thị thông báo giới hạn khi ≤64
- [ ] Hiển thị prompt "Chuyển sang Giải Lớn" khi >64
- [ ] Nút chuyển module → init `largeTournamentState`

**Phase 2 — Admin Config UI (2-3 ngày):**
- [ ] Tab Admin với 3 section (config cơ bản, phân bổ bảng, advance setting)
- [ ] `autoSplitGroups()` function
- [ ] `calcMainBracket()` function
- [ ] Realtime preview khi admin thay đổi config

**Phase 3 — Navigation & Overview (2 ngày):**
- [ ] Phase bar component
- [ ] Dynamic tab generation theo số bảng
- [ ] Tab Tổng quan với stat cards và group grid
- [ ] Trạng thái tab (pending/active/done/locked)

**Phase 4 — Bracket render từng bảng (2-3 ngày):**
- [ ] Wrap bracket renderer hiện tại vào group context
- [ ] Bye logic và hiển thị
- [ ] Modal "Xác nhận top N advance"
- [ ] Cập nhật group status → 'done'

**Phase 5 — Bracket chính (2-3 ngày):**
- [ ] Unlock bracket chính khi tất cả bảng done
- [ ] Seeding logic (top 1 mỗi bảng vào 4 nhánh khác nhau)
- [ ] Render bracket chính với nguồn VĐV từ các bảng

**Phase 6 — Lịch thi đấu (1-2 ngày):**
- [ ] Schedule view với filter ngày + filter bảng
- [ ] Tag màu theo bảng
- [ ] LIVE indicator

**Phase 7 — Persistence (1-2 ngày):**
- [ ] Thêm `large_tournament_config` vào Supabase schema
- [ ] Load/save full state
- [ ] Detect mode khi load (large vs small)

---

## 11. GHI CHÚ QUAN TRỌNG CHO CURSOR

1. **Không động vào bracket renderer cũ.** Chỉ import/reuse nó.
2. **Tất cả màu sắc dùng CSS variables** đã định nghĩa ở Section 6, không hardcode hex trong JS.
3. **Soft UI style:** border-radius lớn (12-14px), không có shadow đậm, nền kem `#f4f2ee`, card trắng nổi nhẹ.
4. **Mobile:** Tab Bảng scroll ngang nếu nhiều bảng. Bracket scroll ngang trong container, không scale toàn trang.
5. **Admin-only actions** (Xác nhận advance, Sửa cấu hình) phải check auth trước khi render — dùng lại auth logic hiện tại.
6. **Large Tournament Module là một JS module riêng** (`large-tournament.js`), import vào `tournament.html`. Không viết inline script.
