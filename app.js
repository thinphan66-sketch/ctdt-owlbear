import OBR, { buildShape, buildText } from "https://esm.sh/@owlbear-rodeo/sdk@3.0.0";
import { MONSTER_LIBRARY, STATUS_LIST, ELEMENTAL_REACTIONS } from "./monsters.js";

const NS = "com.ctdt.tracker";
const META_KEY = `${NS}/unit`;
const OVERLAY_KEY = `${NS}/overlayOf`;
const TELEGRAPH_KEY = `${NS}/telegraphOf`;
const ROOM_LOG_KEY = `${NS}/combatLog`;
const ROOM_TURN_KEY = `${NS}/turnState`;

let isObr = false;
let role = "GM";
let playerName = "DM";
let activeTab = "combat";
let units = [];          // [{ id, name, isPc, color, init, hp, maxHp, ll, maxLl, cy, lc, pn, stagger, maxStagger, dt, maxDt, extraLbl, extraVal, resist, maxResist, phase2At, hiddenHp, monsterId, actions:{m,b,r}, statuses:[] }]
let selectedId = null;
let turnState = { round: 1, activeId: null };
let combatLog = [];
let reactionBanner = "";
let monsterSearch = "";
let showAdvancedStats = false;

// Dice tab local form
const diceForm = { stat: "KH", val: 4, bonus: 0, casterStat: 4, dcMode: "dynamic", customDc: 14 };

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

// ============================================================================
// INIT: OWLBEAR RODEO 2.0 OR OFFLINE DEMO FALLBACK
// ============================================================================
async function init() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
      document.getElementById("tab-combat").classList.toggle("hidden", activeTab !== "combat");
      document.getElementById("tab-dice").classList.toggle("hidden", activeTab !== "dice");
      document.getElementById("tab-monsters").classList.toggle("hidden", activeTab !== "monsters");
      render();
    });
  });

  if (OBR.isAvailable) {
    OBR.onReady(async () => {
      isObr = true;
      role = await OBR.player.getRole();
      playerName = await OBR.player.getName();
      document.getElementById("role-badge").textContent = role === "GM" ? "👑 DM (Owlbear)" : `🎭 ${playerName}`;

      await loadFromRoomAndScene();

      OBR.scene.items.onChange(items => {
        parseUnitsFromItems(items);
        render();
      });

      OBR.room.onMetadataChange(meta => {
        if (Array.isArray(meta[ROOM_LOG_KEY])) combatLog = meta[ROOM_LOG_KEY];
        if (meta[ROOM_TURN_KEY]) turnState = meta[ROOM_TURN_KEY];
        render();
      });

      OBR.player.onChange(p => {
        if (p.selection && p.selection.length === 1) {
          const hit = units.find(u => u.id === p.selection[0]);
          if (hit && selectedId !== hit.id) {
            selectedId = hit.id;
            render();
          }
        }
      });

      render();
    });
  } else {
    // Offline Demo Mode so DM can test immediately before uploading to GitHub Pages
    isObr = false;
    role = "GM";
    playerName = "DM (Xem thử)";
    document.getElementById("role-badge").textContent = "🧪 Chế độ Xem Thử";
    units = [
      makeUnitData({ id: "demo-pc1", name: "Thạch Sơn (PC)", isPc: true, color: "#319795", init: 16, maxHp: 29, pn: 3, maxLl: 13, cy: 2, maxStagger: 0, hiddenHp: false }),
      makeUnitData({ id: "demo-m1", name: "Huyết Căn Độc Thi Non", isPc: false, color: "#c53030", init: 14, maxHp: 28, pn: 2, maxStagger: 4, maxLl: 0, monsterId: "m-docthi", hiddenHp: true }),
      makeUnitData({ id: "demo-boss", name: "Mini-Boss TRẦM ĐỘC", isPc: false, color: "#805ad5", init: 15, maxHp: 48, pn: 2, maxStagger: 6, maxLl: 20, phase2At: 24, resistPoints: 2, monsterId: "m-tramdoc", hiddenHp: true })
    ];
    selectedId = "demo-boss";
    turnState = { round: 1, activeId: "demo-pc1" };
    combatLog = [{ time: nowTime(), text: "Chế độ Xem Thử sẵn sàng! Khi dán link vào Owlbear Rodeo, mọi nút sẽ đồng bộ trực tiếp lên bản đồ.", type: "info" }];
    render();
  }
}

function makeUnitData(opts) {
  return {
    id: opts.id,
    name: opts.name || "Đơn vị",
    isPc: !!opts.isPc,
    color: opts.color || (opts.isPc ? "#319795" : "#c53030"),
    init: opts.init ?? 12,
    hp: opts.hp ?? opts.maxHp ?? 20,
    maxHp: opts.maxHp ?? 20,
    ll: opts.ll ?? opts.maxLl ?? 0,
    maxLl: opts.maxLl ?? 0,
    cy: opts.cy ?? (opts.isPc ? 2 : 0),
    lc: opts.lc ?? 0,
    pn: opts.pn ?? 1,
    stagger: opts.stagger ?? opts.maxStagger ?? 0,
    maxStagger: opts.maxStagger ?? 0,
    dt: opts.dt ?? 6,
    maxDt: 10,
    extraLbl: opts.extraLbl || "PT",
    extraVal: opts.extraVal ?? 0,
    resist: opts.resist ?? opts.resistPoints ?? 0,
    maxResist: opts.maxResist ?? opts.resistPoints ?? 0,
    phase2At: opts.phase2At ?? 0,
    hiddenHp: opts.hiddenHp ?? !opts.isPc,
    monsterId: opts.monsterId || null,
    actions: opts.actions || { m: false, b: false, r: false },
    statuses: opts.statuses || []
  };
}

async function loadFromRoomAndScene() {
  const meta = await OBR.room.getMetadata();
  if (Array.isArray(meta[ROOM_LOG_KEY])) combatLog = meta[ROOM_LOG_KEY];
  if (meta[ROOM_TURN_KEY]) turnState = meta[ROOM_TURN_KEY];
  const items = await OBR.scene.items.getItems();
  parseUnitsFromItems(items);
}

function parseUnitsFromItems(items) {
  const tracked = [];
  for (const it of items) {
    if (it.metadata && it.metadata[META_KEY]) {
      const u = Object.assign({}, it.metadata[META_KEY], { id: it.id });
      tracked.push(u);
    }
  }
  tracked.sort((a, b) => (b.init || 0) - (a.init || 0));
  units = tracked;
  if (!units.find(u => u.id === selectedId)) {
    selectedId = units[0]?.id || null;
  }
}

// ============================================================================
// OWLBEAR SYNC HELPERS (TOKEN OVERLAYS, LOG, TELEGRAPH, SPAWN)
// ============================================================================
async function pushLog(text, type = "info", secret = false) {
  const entry = { time: nowTime(), text, type, secret };
  combatLog = [entry, ...combatLog].slice(0, 30);
  if (isObr) {
    await OBR.room.setMetadata({ [ROOM_LOG_KEY]: combatLog });
    if (!secret && (type === "crit" || type === "fumble" || type === "react")) {
      OBR.notification.show(text, type === "fumble" ? "ERROR" : "INFO");
    }
  }
  render();
}

async function saveTurnState() {
  if (isObr) {
    await OBR.room.setMetadata({ [ROOM_TURN_KEY]: turnState });
  }
  render();
}

async function updateUnit(unitId, mutatorFn) {
  const u = units.find(x => x.id === unitId);
  if (!u) return;
  const prevStagger = u.stagger;
  const prevHp = u.hp;
  mutatorFn(u);
  u.hp = Math.max(0, Math.min(u.maxHp, u.hp));
  u.ll = Math.max(0, Math.min(Math.max(u.maxLl, u.ll), u.ll));
  u.cy = Math.max(0, Math.min(6, u.cy));
  u.lc = Math.max(0, u.lc);
  u.stagger = Math.max(0, Math.min(u.maxStagger, u.stagger));
  u.dt = Math.max(0, Math.min(10, u.dt));

  // Auto alerts for Stagger Break & Boss Phase 2
  if (u.maxStagger > 0 && prevStagger > 0 && u.stagger === 0) {
    await pushLog(`💥 ${u.name} VỠ THẾ! (-50% PN · Mất Reaction · Mở CHÍ MẠNG ×1.5!)`, "crit");
  }
  if (u.phase2At > 0 && prevHp > u.phase2At && u.hp <= u.phase2At && u.hp > 0) {
    await pushLog(`🔥 ${u.name} tụt ≤ ${u.phase2At} Máu → KÍCH HOẠT PHASE 2!`, "fumble", true);
  }

  if (isObr) {
    await OBR.scene.items.updateItems([unitId], items => {
      for (const it of items) {
        it.metadata[META_KEY] = u;
      }
    });
    await syncTokenOverlayOnMap(u);
  }
  render();
}

async function syncTokenOverlayOnMap(u) {
  if (!isObr) return;
  const all = await OBR.scene.items.getItems();
  const token = all.find(i => i.id === u.id);
  if (!token) return;

  // Remove old overlay attached to this token
  const oldIds = all.filter(i => i.metadata && i.metadata[OVERLAY_KEY] === u.id).map(i => i.id);
  if (oldIds.length) await OBR.scene.items.deleteItems(oldIds);

  const dpi = await OBR.scene.grid.getDpi();
  const barW = dpi * 0.92;
  const pct = u.maxHp > 0 ? Math.max(0, Math.min(1, u.hp / u.maxHp)) : 0;
  const bx = token.position.x - barW / 2;
  const by = token.position.y - dpi * 0.62;

  const bgBar = buildShape()
    .width(barW).height(14)
    .shapeType("RECTANGLE")
    .fillColor("#0f131c").fillOpacity(0.88)
    .strokeColor("#d4a853").strokeWidth(1.5)
    .position({ x: bx, y: by })
    .attachedTo(u.id).layer("ATTACHMENT").disableHit(true).locked(true)
    .metadata({ [OVERLAY_KEY]: u.id })
    .build();

  const hpColor = pct > 0.5 ? "#48bb78" : pct > 0.3 ? "#ed8936" : "#e55360";
  const hpBar = buildShape()
    .width(Math.max(4, barW * pct)).height(14)
    .shapeType("RECTANGLE")
    .fillColor(hpColor).fillOpacity(0.95).strokeOpacity(0)
    .position({ x: bx, y: by })
    .attachedTo(u.id).layer("ATTACHMENT").disableHit(true).locked(true)
    .metadata({ [OVERLAY_KEY]: u.id })
    .build();

  const hpTxt = u.hiddenHp ? (pct > 0.5 ? "Khỏe" : pct > 0.3 ? "Bị thương" : pct > 0 ? "Trọng thương" : "Gục") : `${u.hp}/${u.maxHp}`;
  const extraParts = [];
  if (u.lc > 0) extraParts.push(`LC:${u.lc}`);
  if (u.maxStagger > 0) extraParts.push(u.stagger === 0 ? "VỠ THẾ!" : `Thế:${u.stagger}`);
  const lbl = `${hpTxt}${extraParts.length ? " | " + extraParts.join(" ") : ""}`;

  const txtItem = buildText()
    .plainText(lbl)
    .fontSize(13).fontWeight(700).fillColor("#ffffff")
    .position({ x: bx, y: by - 19 })
    .attachedTo(u.id).layer("ATTACHMENT").disableHit(true).locked(true)
    .metadata({ [OVERLAY_KEY]: u.id })
    .build();

  await OBR.scene.items.addItems([bgBar, hpBar, txtItem]);
}

async function attachSelectedOwlbearToken() {
  if (!isObr) {
    const id = "demo-pc-" + Date.now();
    const u = makeUnitData({ id, name: "Tân Nhân Vật (PC)", isPc: true, maxHp: 23, maxLl: 15, pn: 1, init: 14 });
    units.push(u);
    selectedId = id;
    render();
    return;
  }
  const sel = await OBR.player.getSelection();
  if (!sel || sel.length === 0) {
    OBR.notification.show("Hãy click chọn 1 Token trên bản đồ Owlbear trước!", "WARNING");
    return;
  }
  const items = await OBR.scene.items.getItems(sel);
  for (const it of items) {
    if (it.metadata && it.metadata[META_KEY]) continue;
    const nm = it.text?.plainText || it.name || "Nhân Vật";
    const u = makeUnitData({ id: it.id, name: nm, isPc: true, maxHp: 23, maxLl: 15, pn: 1, init: 14, hiddenHp: false });
    await OBR.scene.items.updateItems([it.id], list => { list[0].metadata[META_KEY] = u; });
    await syncTokenOverlayOnMap(u);
    selectedId = it.id;
  }
  await pushLog(`✅ Đã gắn bảng chỉ số Cửu Trọng Đạo Tháp lên Token đang chọn!`);
}

async function spawnMonster(monsterId) {
  const m = MONSTER_LIBRARY.find(x => x.id === monsterId);
  if (!m) return;
  const count = units.filter(u => u.monsterId === monsterId).length + 1;
  const label = count > 1 ? `${m.name} #${count}` : m.name;

  if (!isObr) {
    const id = "demo-" + Date.now();
    const u = makeUnitData({
      id, name: label, isPc: false, color: m.color, init: 12,
      maxHp: m.maxHp, pn: m.pn, maxStagger: m.maxStagger, maxLl: m.maxLl,
      phase2At: m.phase2At || 0, resistPoints: m.resistPoints || 0,
      monsterId: m.id, hiddenHp: true
    });
    units.push(u);
    selectedId = id;
    activeTab = "combat";
    await pushLog(`👹 Đã thả [${label}] lên bàn (Máu ${m.maxHp} · PN ${m.pn} · Thế ${m.maxStagger}).`);
    return;
  }

  const dpi = await OBR.scene.grid.getDpi();
  const tf = await OBR.viewport.getTransform();
  const cx = (-tf.position.x + 400) / (tf.scale || 1);
  const cy = (-tf.position.y + 300) / (tf.scale || 1);

  const token = buildShape()
    .width(dpi * 0.9).height(dpi * 0.9)
    .shapeType("CIRCLE")
    .fillColor(m.color).fillOpacity(0.92)
    .strokeColor("#ffffff").strokeWidth(3)
    .position({ x: cx, y: cy })
    .layer("CHARACTER")
    .build();

  const u = makeUnitData({
    id: token.id, name: label, isPc: false, color: m.color, init: 12,
    maxHp: m.maxHp, pn: m.pn, maxStagger: m.maxStagger, maxLl: m.maxLl,
    phase2At: m.phase2At || 0, resistPoints: m.resistPoints || 0,
    monsterId: m.id, hiddenHp: true
  });
  token.metadata[META_KEY] = u;
  token.name = label;

  await OBR.scene.items.addItems([token]);
  await syncTokenOverlayOnMap(u);
  selectedId = token.id;
  await pushLog(`👹 DM vừa thả [${label}] lên bản đồ Owlbear!`, "info", true);
}

async function toggleTelegraphZone(unitId, radiusCells) {
  const u = units.find(x => x.id === unitId);
  if (!u) return;
  if (!isObr) {
    await pushLog(`🔴 [TELEGRAPH] Vẽ vùng báo trước bán kính ${radiusCells} Ô quanh ${u.name}!`, "fumble");
    return;
  }
  const all = await OBR.scene.items.getItems();
  const old = all.filter(i => i.metadata && i.metadata[TELEGRAPH_KEY] === unitId).map(i => i.id);
  if (old.length) await OBR.scene.items.deleteItems(old);
  if (radiusCells === 0) {
    await pushLog(`🧹 Đã xóa vùng báo trước của ${u.name}.`);
    return;
  }
  const token = all.find(i => i.id === unitId);
  if (!token) return;
  const dpi = await OBR.scene.grid.getDpi();
  const diameter = radiusCells * 2 * dpi;
  const zone = buildShape()
    .width(diameter).height(diameter)
    .shapeType("CIRCLE")
    .fillColor("#e53e3e").fillOpacity(0.24)
    .strokeColor("#ff6b6b").strokeWidth(4)
    .position({ x: token.position.x, y: token.position.y })
    .attachedTo(unitId).layer("DRAWING").disableHit(true)
    .metadata({ [TELEGRAPH_KEY]: unitId })
    .build();
  await OBR.scene.items.addItems([zone]);
  await pushLog(`🔴 [TELEGRAPH] Báo trước vùng nổ ${radiusCells} Ô quanh ${u.name}! Cả đội né hoặc ngắt chiêu!`, "fumble");
}

// ============================================================================
// 5-STEP CANON DAMAGE CALCULATOR & STATUS / ELEMENTAL REACTIONS
// ============================================================================
async function applyFiveStepDamage(unitId) {
  const u = units.find(x => x.id === unitId);
  if (!u) return;
  const raw = parseInt(document.getElementById("dmg-raw")?.value, 10) || 0;
  if (raw <= 0) return;

  const mult = parseFloat(document.getElementById("dmg-mult")?.value || "1");
  const pierce = !!document.getElementById("dmg-pierce")?.checked;
  const effPn = pierce ? 0 : (u.maxStagger > 0 && u.stagger === 0 ? Math.floor(u.pn / 2) : u.pn);

  const afterMult = Math.ceil(raw * mult);
  let afterPn = Math.max(1, afterMult - effPn);
  let lcAbsorb = 0;
  let hpDmg = afterPn;

  if (u.lc > 0) {
    lcAbsorb = Math.min(u.lc, afterPn);
    hpDmg = afterPn - lcAbsorb;
  }

  await updateUnit(unitId, target => {
    target.lc -= lcAbsorb;
    target.hp -= hpDmg;
  });

  const tag = mult === 1.5 ? " [CM ×1.5]" : mult === 2 ? " [SONG THẬP ×2.0]" : mult === 0.5 ? " [Chống Đỡ ×0.5]" : mult === 0.4 ? " [Parry ×0.4]" : "";
  await pushLog(
    `⚔️ ${u.name} nhận ${raw} ST${tag} → -${effPn} PN${lcAbsorb ? ` → LC chặn ${lcAbsorb}` : ""} → mất ${hpDmg} Máu!`,
    mult >= 1.5 ? "crit" : "info"
  );
}

async function toggleStatus(unitId, statusId) {
  const u = units.find(x => x.id === unitId);
  if (!u) return;
  const has = u.statuses.includes(statusId);
  let triggered = null;

  await updateUnit(unitId, target => {
    if (has) {
      target.statuses = target.statuses.filter(s => s !== statusId);
    } else {
      // Check 9 Elemental Reactions
      for (const rx of ELEMENTAL_REACTIONS) {
        if ((rx.a === statusId && target.statuses.includes(rx.b)) || (rx.b === statusId && target.statuses.includes(rx.a))) {
          triggered = rx;
          break;
        }
      }
      target.statuses.push(statusId);
    }
  });

  if (triggered) {
    reactionBanner = `✨ PHẢN ỨNG NGUYÊN TỐ [${triggered.name}]: ${triggered.desc}`;
    await pushLog(`✨ ${u.name} kích Phản Ứng [${triggered.name}]: ${triggered.desc}`, "react");
  }
}

async function nextTurn() {
  if (!units.length) return;
  const idx = units.findIndex(u => u.id === turnState.activeId);
  let nextIdx = idx + 1;
  if (nextIdx >= units.length) {
    nextIdx = 0;
    turnState.round += 1;
  }
  const nextU = units[nextIdx];
  turnState.activeId = nextU.id;
  selectedId = nextU.id;

  await updateUnit(nextU.id, t => {
    t.actions = { m: false, b: false, r: false };
  });
  await saveTurnState();

  const dots = STATUS_LIST.filter(s => s.dot && nextU.statuses.includes(s.id)).map(s => `${s.icon} ${s.label} (${s.dot})`);
  const dotMsg = dots.length ? ` | ⚠️ Đầu lượt dính: ${dots.join(", ")}` : "";
  await pushLog(`🕒 Vòng ${turnState.round} — Tới lượt ${nextU.name}${dotMsg}`);
}

// ============================================================================
// 2D10 SHARED ROLLER & DYNAMIC DC
// ============================================================================
async function roll2d10() {
  const d1 = Math.floor(Math.random() * 10) + 1;
  const d2 = Math.floor(Math.random() * 10) + 1;
  const total = d1 + d2 + (diceForm.val || 0) + (diceForm.bonus || 0);
  const dc = diceForm.dcMode === "dynamic" ? (10 + (diceForm.casterStat || 0)) : (diceForm.customDc || 14);

  let tag = total >= dc ? `✅ ĐẠT (vs DC ${dc})` : `❌ TRƯỢT (vs DC ${dc})`;
  let logType = "info";
  if (d1 === 10 && d2 === 10) {
    tag = "🔥 SONG THẬP — ĐẠI THÀNH (×2.0 ST)!";
    logType = "crit";
  } else if (d1 === 1 && d2 === 1) {
    tag = "💀 SONG NHẤT — SƠ HỞ!";
    logType = "fumble";
  }

  const msg = `🎲 ${playerName} tung 2d10 [${d1}+${d2}] + ${diceForm.stat}(${diceForm.val})${diceForm.bonus ? ` + ${diceForm.bonus}` : ""} = ${total} → ${tag}`;
  await pushLog(msg, logType);
}

// ============================================================================
// RENDER UI (3 COMPACT TABS)
// ============================================================================
function render() {
  renderCombatTab();
  renderDiceTab();
  renderMonstersTab();
}

function renderCombatTab() {
  const el = document.getElementById("tab-combat");
  const u = units.find(x => x.id === selectedId) || null;
  const isGm = role === "GM";
  const mRef = u?.monsterId ? MONSTER_LIBRARY.find(m => m.id === u.monsterId) : null;

  el.innerHTML = `
    <div class="card">
      <div class="card-head">
        <span>🕒 Vòng ${turnState.round} · Thứ Tự Lượt (${units.length})</span>
        <div class="row">
          ${isGm ? `<button class="btn-xs btn-qi" id="btn-attach">+ Gắn Token</button>` : ""}
          <button class="btn-xs btn-gold" id="btn-next-turn">Qua Lượt ▶</button>
        </div>
      </div>
      ${units.length ? units.map(item => {
        const hideNum = !isGm && item.hiddenHp;
        const hpDisp = hideNum ? (item.hp > item.maxHp * 0.5 ? "Khỏe" : item.hp > 0 ? "Bị thương" : "Gục") : `${item.hp}/${item.maxHp}`;
        return `
          <div class="token-item ${item.id === selectedId ? "selected" : ""} ${item.id === turnState.activeId ? "active-turn" : ""}" data-select="${item.id}">
            <div class="row">
              <span class="token-dot" style="background:${item.color}"></span>
              <div>
                <div class="token-name">${esc(item.name)}</div>
                <div class="token-mini">Máu: <strong>${hpDisp}</strong> · PN ${item.pn}${item.maxStagger ? ` · Thế ${item.stagger}/${item.maxStagger}` : ""}${item.lc ? ` · LC ${item.lc}` : ""}</div>
              </div>
            </div>
            <div class="token-mini">KĐ: <strong>${item.init}</strong></div>
          </div>
        `;
      }).join("") : '<div class="token-mini">Chưa có Token nào. Click chọn 1 Token trên Owlbear rồi bấm <strong>+ Gắn Token</strong>, hoặc thả quái từ tab <strong>Quái & Log</strong>!</div>'}
    </div>

    ${reactionBanner ? `<div class="alert-banner alert-react">${esc(reactionBanner)}</div>` : ""}

    ${u ? `
      <div class="card">
        <div class="card-head">
          <span>🎯 ${esc(u.name)}</span>
          <div class="row">
            ${isGm ? `<label style="font-size:11px;color:var(--muted);cursor:pointer;"><input type="checkbox" id="chk-hide-hp" ${u.hiddenHp ? "checked" : ""}/> Ẩn máu</label>` : ""}
            <input type="number" id="inp-init" value="${u.init}" title="Khởi Động" style="width:48px;padding:2px 4px;" />
          </div>
        </div>

        ${u.maxStagger > 0 && u.stagger === 0 ? `<div class="alert-banner alert-stagger">💥 VỠ THẾ! (-50% PN · Mất Reaction · Mở CHÍ MẠNG ×1.5!)</div>` : ""}
        ${isGm && u.phase2At > 0 && u.hp <= u.phase2At && u.hp > 0 ? `<div class="alert-banner alert-phase2">🔥 BOSS ĐÃ TỤT ≤ ${u.phase2At} MÁU — KÍCH HOẠT PHASE 2!</div>` : ""}

        <div class="row" style="margin-bottom:8px;">
          <label class="chip ${u.actions.m ? "on" : ""}"><input type="checkbox" data-act="m" ${u.actions.m ? "checked" : ""} style="display:none;"/> ${u.actions.m ? "✓" : "○"} Main</label>
          <label class="chip ${u.actions.b ? "on" : ""}"><input type="checkbox" data-act="b" ${u.actions.b ? "checked" : ""} style="display:none;"/> ${u.actions.b ? "✓" : "○"} Bonus</label>
          <label class="chip ${u.actions.r ? "on" : ""}"><input type="checkbox" data-act="r" ${u.actions.r ? "checked" : ""} style="display:none;"/> ${u.actions.r ? "✓" : "○"} Reaction</label>
          <button class="btn-xs" id="btn-toggle-adv" style="margin-left:auto;">${showAdvancedStats ? "▲ Gọn" : "▼ ĐT / Kháng Kiếp"}</button>
        </div>

        ${renderStatRow("❤️ Máu", `${u.hp}/${u.maxHp}`, "hp", [-5, -1, 1, 5])}
        ${renderStatRow("💧 Linh Lực", `${u.ll}/${u.maxLl}`, "ll", [-2, -1, 1, 2])}
        ${renderStatRow("🔥 Chiến Ý", `${u.cy}/6`, "cy", [-1, 1])}
        ${renderStatRow("🛡️ Lá Chắn", `${u.lc}`, "lc", [-5, -1, 1, 5])}
        ${u.maxStagger > 0 ? renderStatRow("⚡ Thanh Thế", `${u.stagger}/${u.maxStagger}`, "stagger", [-2, -1, 1, u.maxStagger]) : ""}
        ${showAdvancedStats ? `
          ${renderStatRow("🧠 Đạo Tâm", `${u.dt}/10`, "dt", [-1, 1])}
          ${renderStatRow("🔰 Phòng Ngự", `${u.pn}`, "pn", [-1, 1])}
          ${u.maxResist > 0 ? renderStatRow("👑 Kháng Kiếp", `${u.resist}/${u.maxResist}`, "resist", [-1, 1]) : ""}
          ${renderStatRow("✨ Bể Phụ", `${u.extraVal}`, "extraVal", [-1, 1])}
        ` : ""}
      </div>

      <!-- 5-STEP DAMAGE CALCULATOR -->
      <div class="card">
        <div class="card-head"><span>💥 Tính Sát Thương 5 Bước (Auto-Hit)</span></div>
        <div class="row">
          <input type="number" id="dmg-raw" value="8" min="1" placeholder="ST thô" />
          <select id="dmg-mult" style="flex:1;">
            <option value="1">Bình thường (×1.0)</option>
            <option value="1.5">Chí Mạng (×1.5)</option>
            <option value="2">Song Thập (×2.0)</option>
            <option value="0.5">Chống Đỡ (×0.5)</option>
            <option value="0.4">Parry (×0.4)</option>
          </select>
          <label style="font-size:11.5px;"><input type="checkbox" id="dmg-pierce"/> Xuyên PN</label>
          <button class="btn-red" id="btn-apply-dmg">Trừ ST</button>
        </div>
      </div>

      <!-- STATUSES & TELEGRAPH -->
      <div class="card">
        <div class="card-head">
          <span>🧪 Trạng Thái & 9 Phản Ứng</span>
          ${isGm ? `
            <div class="row">
              <button class="btn-xs btn-red" data-tele="2">🔴 Vùng 2Ô</button>
              <button class="btn-xs btn-red" data-tele="3">🔴 Vùng 3Ô</button>
              <button class="btn-xs" data-tele="0">Xóa</button>
            </div>
          ` : ""}
        </div>
        <div class="chip-wrap">
          ${STATUS_LIST.map(st => `
            <span class="chip ${u.statuses.includes(st.id) ? "on" : ""}" data-st="${st.id}">${st.icon} ${st.label}</span>
          `).join("")}
        </div>
      </div>

      ${isGm && mRef ? `
        <div class="card">
          <div class="card-head"><span>📜 Kỹ Năng Quái (Chỉ DM Thấy)</span></div>
          <div class="token-mini" style="margin-bottom:6px;">${esc(mRef.stats)} · AI: ${esc(mRef.ai)}</div>
          ${mRef.skills.map((sk, i) => `
            <div class="stat-row">
              <div style="flex:1;padding-right:6px;">
                <div style="font-weight:700;font-size:12px;color:var(--qi);">${esc(sk.name)}</div>
                <div class="token-mini">${esc(sk.text)}</div>
              </div>
              <button class="btn-xs btn-gold" data-useskill="${i}">Dùng</button>
            </div>
          `).join("")}
        </div>
      ` : ""}
    ` : ""}
  `;

  // Bind events
  el.querySelectorAll("[data-select]").forEach(node => {
    node.addEventListener("click", () => { selectedId = node.dataset.select; reactionBanner = ""; render(); });
  });
  document.getElementById("btn-attach")?.addEventListener("click", attachSelectedOwlbearToken);
  document.getElementById("btn-next-turn")?.addEventListener("click", nextTurn);
  document.getElementById("btn-toggle-adv")?.addEventListener("click", () => { showAdvancedStats = !showAdvancedStats; render(); });
  document.getElementById("btn-apply-dmg")?.addEventListener("click", () => u && applyFiveStepDamage(u.id));
  document.getElementById("chk-hide-hp")?.addEventListener("change", e => u && updateUnit(u.id, t => { t.hiddenHp = e.target.checked; }));
  document.getElementById("inp-init")?.addEventListener("change", e => u && updateUnit(u.id, t => { t.init = parseInt(e.target.value, 10) || 0; }));

  el.querySelectorAll("[data-step]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [field, delta] = btn.dataset.step.split(":");
      if (u) updateUnit(u.id, t => { t[field] = (t[field] || 0) + parseInt(delta, 10); });
    });
  });
  el.querySelectorAll("[data-act]").forEach(chk => {
    chk.addEventListener("change", () => {
      const k = chk.dataset.act;
      if (u) updateUnit(u.id, t => { t.actions[k] = chk.checked; });
    });
  });
  el.querySelectorAll("[data-st]").forEach(ch => {
    ch.addEventListener("click", () => u && toggleStatus(u.id, ch.dataset.st));
  });
  el.querySelectorAll("[data-tele]").forEach(btn => {
    btn.addEventListener("click", () => u && toggleTelegraphZone(u.id, parseInt(btn.dataset.tele, 10)));
  });
  el.querySelectorAll("[data-useskill]").forEach(btn => {
    btn.addEventListener("click", () => {
      const sk = mRef?.skills[parseInt(btn.dataset.useskill, 10)];
      if (sk && u) {
        pushLog(`👹 ${u.name} dùng [${sk.name}]: ${sk.text}`, sk.telegraph ? "fumble" : "info");
        if (sk.telegraph) toggleTelegraphZone(u.id, sk.telegraph);
      }
    });
  });
}

function renderStatRow(label, display, field, steps) {
  return `
    <div class="stat-row">
      <span class="stat-lbl">${label}</span>
      <span class="stat-val">${display}</span>
      <div class="stepper">
        ${steps.map(d => `<button class="btn-xs" data-step="${field}:${d}">${d > 0 ? "+" + d : d}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderDiceTab() {
  const el = document.getElementById("tab-dice");
  const effDc = diceForm.dcMode === "dynamic" ? (10 + (diceForm.casterStat || 0)) : (diceForm.customDc || 14);

  el.innerHTML = `
    <div class="card">
      <div class="card-head"><span>🎲 Tung 2d10 & Luật DC Động (Chung Cả Phòng)</span></div>
      <div class="row" style="margin-bottom:8px;">
        <select id="d-stat">
          ${["KH", "CK", "TT", "NN"].map(s => `<option ${diceForm.stat === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <label style="font-size:11.5px;">Chỉ số:</label>
        <input type="number" id="d-val" value="${diceForm.val}" />
        <label style="font-size:11.5px;">Cộng thêm:</label>
        <input type="number" id="d-bonus" value="${diceForm.bonus}" />
      </div>

      <div class="row" style="margin-bottom:10px;">
        <select id="d-dcmode">
          <option value="dynamic" ${diceForm.dcMode === "dynamic" ? "selected" : ""}>DC Động (10 + CS thi triển)</option>
          <option value="fixed" ${diceForm.dcMode === "fixed" ? "selected" : ""}>DC Môi Trường</option>
        </select>
        ${diceForm.dcMode === "dynamic"
          ? `<label style="font-size:11.5px;">CS người ra chiêu:</label><input type="number" id="d-caster" value="${diceForm.casterStat}" />`
          : `<label style="font-size:11.5px;">DC:</label><input type="number" id="d-customdc" value="${diceForm.customDc}" />`}
      </div>

      <div class="row between">
        <span style="font-size:12px;color:var(--qi);">Mục tiêu cần đạt: <strong>DC ${effDc}</strong></span>
        <button class="btn-gold" id="btn-roll-now">🎲 Tung 2d10 Ngay</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><span>📜 Lịch Sử Tung Xúc Xắc & Chiến Đấu</span></div>
      ${renderLogList()}
    </div>
  `;

  document.getElementById("d-stat")?.addEventListener("change", e => { diceForm.stat = e.target.value; });
  document.getElementById("d-val")?.addEventListener("input", e => { diceForm.val = parseInt(e.target.value, 10) || 0; });
  document.getElementById("d-bonus")?.addEventListener("input", e => { diceForm.bonus = parseInt(e.target.value, 10) || 0; });
  document.getElementById("d-dcmode")?.addEventListener("change", e => { diceForm.dcMode = e.target.value; renderDiceTab(); });
  document.getElementById("d-caster")?.addEventListener("input", e => { diceForm.casterStat = parseInt(e.target.value, 10) || 0; renderDiceTab(); });
  document.getElementById("d-customdc")?.addEventListener("input", e => { diceForm.customDc = parseInt(e.target.value, 10) || 14; renderDiceTab(); });
  document.getElementById("btn-roll-now")?.addEventListener("click", roll2d10);
}

function renderMonstersTab() {
  const el = document.getElementById("tab-monsters");
  const isGm = role === "GM";
  const q = monsterSearch.trim().toLowerCase();
  const list = MONSTER_LIBRARY.filter(m => !q || (m.name + " " + m.tier).toLowerCase().includes(q));

  el.innerHTML = `
    ${isGm ? `
      <div class="card">
        <div class="card-head"><span>👹 Thư Viện Quái Tầng 1 (Thả 1 Cú Click)</span></div>
        <input type="text" id="m-search" value="${esc(monsterSearch)}" placeholder="🔍 Tìm tên quái (Độc Thi, Trầm Độc, Sói...)" style="width:100%;margin-bottom:8px;" />
        <div style="max-height:250px;overflow-y:auto;">
          ${list.map(m => `
            <div class="stat-row">
              <div style="flex:1;padding-right:6px;">
                <div style="font-weight:700;font-size:12.5px;">${esc(m.name)}</div>
                <div class="token-mini">${esc(m.tier)} · Máu ${m.maxHp} · PN ${m.pn}${m.maxStagger ? ` · Thế ${m.maxStagger}` : ""}</div>
              </div>
              <button class="btn-xs btn-gold" data-spawn="${m.id}">+ Thả</button>
            </div>
          `).join("")}
        </div>
      </div>
    ` : `<div class="card"><div class="token-mini">🔒 Thư viện quái vật chỉ hiển thị với DM.</div></div>`}

    <div class="card">
      <div class="card-head">
        <span>📜 Combat Log (${combatLog.length})</span>
        ${isGm ? `<button class="btn-xs" id="btn-clear-log">Xóa Log</button>` : ""}
      </div>
      ${renderLogList()}
    </div>
  `;

  document.getElementById("m-search")?.addEventListener("input", e => { monsterSearch = e.target.value; renderMonstersTab(); });
  el.querySelectorAll("[data-spawn]").forEach(btn => {
    btn.addEventListener("click", () => spawnMonster(btn.dataset.spawn));
  });
  document.getElementById("btn-clear-log")?.addEventListener("click", async () => {
    combatLog = [];
    if (isObr) await OBR.room.setMetadata({ [ROOM_LOG_KEY]: [] });
    render();
  });
}

function renderLogList() {
  const isGm = role === "GM";
  const visible = combatLog.filter(l => isGm || !l.secret);
  if (!visible.length) return '<div class="token-mini">Chưa có diễn biến nào.</div>';
  return `<div class="log-box">${visible.map(l => `
    <div class="log-entry ${l.type || ""} ${l.secret ? "secret" : ""}">
      <span class="log-time">[${esc(l.time)}]</span>${l.secret ? "🔒 " : ""}${esc(l.text)}
    </div>
  `).join("")}</div>`;
}

init();
