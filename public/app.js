import { DEVICES } from "./devices.js";
import { DEFAULT_CONFIG, LIGHT_ICONS, SCENE_ICONS } from "./config-defaults.js";
import { sunTimes } from "./sun.js";

// =====================================================================
// Utilidades
// =====================================================================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clamp5 = (n) => Math.max(0, Math.min(100, Math.round(n / 5) * 5));
const clone = (o) => JSON.parse(JSON.stringify(o));
const vibrate = (ms = 6) => navigator.vibrate?.(ms);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const BY_ID = Object.fromEntries(DEVICES.map((d) => [d.id, d]));
const DAY_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAY_NAME = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TZ = "America/Sao_Paulo";

// =====================================================================
// Ícones
// =====================================================================
const P = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  bulb: P('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.1 1 1.85V16h5v-.25c0-.75.4-1.4 1-1.85A6 6 0 0 0 12 3Z"/>'),
  spot: P('<path d="M4 5h16l-3.5 6h-9z"/><path d="M9 15l-1.5 4M12 15v5M15 15l1.5 4"/>'),
  pendant: P('<path d="M12 2v6"/><path d="M4.5 15a7.5 7 0 0 1 15 0z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>'),
  strip: P('<rect x="3" y="9" width="18" height="6" rx="3"/><path d="M7 12h.01M12 12h.01M17 12h.01M7 5v2M12 4v3M17 5v2M7 17v2M12 17v3M17 17v2"/>'),
  sign: P('<rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M7.5 13.5l2-5 2 5M8.2 12h2.6M14 8.5v5h3"/><path d="M8 21h8"/>'),
  chandelier: P('<path d="M12 2v5M4.5 10a7.5 3 0 0 0 15 0M4.5 10v3M12 10v4M19.5 10v3"/><circle cx="4.5" cy="15" r="1.6"/><circle cx="12" cy="16" r="1.6"/><circle cx="19.5" cy="15" r="1.6"/>'),
  lamp: P('<path d="M8 3h8l2.5 7h-13z"/><path d="M12 10v10M8 21h8"/>'),
  panel: P('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 8h10M7 12h6M8 20h8M12 16v4"/>'),
  star: P('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'),
  sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: P('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  store: P('<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5"/>'),
  lock: P('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  sparkle: P('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  coffee: P('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'),
  users: P('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
  eye: P('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  half: P('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
  power: P('<path d="M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0"/>'),
  gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  heart: P('<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2 0 3.4 1.1 4.4 2.5 1-1.4 2.4-2.5 4.4-2.5 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20z"/>'),
  close: P('<path d="M6 6l12 12M18 6L6 18"/>'),
  edit: P('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>'),
  trash: P('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  up: P('<path d="M6 15l6-6 6 6"/>'),
  down: P('<path d="M6 9l6 6 6-6"/>'),
  check: P('<path d="M5 12l5 5L20 7"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  pin: P('<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  back: P('<path d="M15 6l-6 6 6 6"/>'),
  camera: P('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  play: P('<path d="M7 4.5v15l12-7.5z"/>'),
  tablet: P('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M11 18h2"/>'),
  sunrise: P('<path d="M17 18a5 5 0 0 0-10 0M12 2v6M4.2 10.2l1.4 1.4M2 18h2M20 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/>'),
  sunset: P('<path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.2 10.2l1.4 1.4M2 18h2M20 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4"/>'),
};
const icon = (k) => ICON[k] || ICON.bulb;

// =====================================================================
// Estado
// =====================================================================
const saved = store.get("hm.states.v2", {});
const state = Object.fromEntries(DEVICES.map((d) => [d.id, { level: saved[d.id]?.level ?? null }]));
const touched = {}; // id -> ms do último comando local (status não sobrescreve por 8 s)
const seq = {};
let cfg = clone(DEFAULT_CONFIG);
let demo = new URLSearchParams(location.search).has("demo");
let storageOk = false;
let pin = store.get("hm.pin", "");
let filter = store.get("hm.filter", "all");
const local = store.get("hm.local", { panel: false });

const L = (d) => {
  const o = cfg.lights[d.id] || {};
  const rooms = cfg.rooms.map((r) => r.key);
  const room = rooms.includes(o.room) ? o.room : rooms.includes(d.group) ? d.group : rooms[0];
  return { id: d.id, name: o.name || d.name, icon: o.icon || d.icon || "bulb", room, fav: !!o.fav };
};
const lights = () => DEVICES.map(L);
const level = (id) => state[id].level ?? 0;
const isOn = (id) => level(id) > 0;
const roomLights = (key) => lights().filter((l) => l.room === key);
const avg = (ids) => (ids.length ? clamp5(ids.reduce((a, id) => a + level(id), 0) / ids.length) : 0);
const stateText = (id, lv = state[id].level) => (lv === null ? "Sem status" : lv === 0 ? "Desligado" : `${lv}%`);

function persistStates() {
  store.set("hm.states.v2", Object.fromEntries(DEVICES.map((d) => [d.id, { level: state[d.id].level }])));
}

// =====================================================================
// API
// =====================================================================
async function api(path, opts = {}) {
  if (demo) {
    await new Promise((r) => setTimeout(r, 150));
    return { ok: true };
  }
  const headers = { ...(pin ? { "x-app-pin": pin } : {}), ...(opts.body ? { "content-type": "application/json" } : {}) };
  const res = await fetch(path, { ...opts, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (res.status === 401) { askPin(); throw new Error("PIN necessário"); }
  if (!data.ok) throw new Error(data.error || `Falha (HTTP ${data.status || res.status})`);
  return data;
}

// Envia nível para uma luz (atualização otimista + desfaz se falhar)
async function setLevel(id, lv, { quiet = false } = {}) {
  lv = clamp5(lv);
  const prev = state[id].level;
  state[id].level = lv;
  touched[id] = Date.now();
  const my = (seq[id] = (seq[id] || 0) + 1);
  paintLight(id, { pending: true });
  try {
    await api(`/api/command?id=${id}&valor=${lv}`);
    persistStates();
    return true;
  } catch (e) {
    if (seq[id] === my) state[id].level = prev;
    if (!quiet) toast(`${L(BY_ID[id]).name}: ${e.message}`, true);
    return false;
  } finally {
    if (seq[id] === my) paintLight(id);
  }
}

// Várias luzes (ambiente, teste de cena) — 4 por vez para não sobrecarregar a central
async function setMany(levels) {
  const entries = Object.entries(levels);
  let fail = 0;
  for (let i = 0; i < entries.length; i += 4) {
    const r = await Promise.all(entries.slice(i, i + 4).map(([id, lv]) => setLevel(+id, lv, { quiet: true })));
    fail += r.filter((x) => !x).length;
  }
  if (fail) toast(`${fail} luz(es) não responderam`, true);
}

async function runScene(scene) {
  const card = $(`.scene[data-scene="${CSS.escape(scene.id)}"]`);
  card?.classList.add("running");
  vibrate(12);
  for (const [id, lv] of Object.entries(scene.levels)) {
    if (!state[id]) continue;
    state[id].level = lv;
    touched[id] = Date.now();
  }
  paintAll();
  try {
    if (demo || !storageOk) await setMany(scene.levels);
    else await api(`/api/scene?id=${encodeURIComponent(scene.id)}`, { method: "POST" });
    toast(`${scene.name} ✓`);
    persistStates();
  } catch (e) {
    toast(`${scene.name}: ${e.message}`, true);
    Object.keys(touched).forEach((k) => delete touched[k]);
    refresh(true);
  } finally {
    card?.classList.remove("running");
  }
}

async function saveConfig(next, msg = "Salvo") {
  try {
    if (demo || !storageOk) {
      store.set("hm.cfg.local", next);
      cfg = next;
    } else {
      const r = await api("/api/config", { method: "PUT", body: JSON.stringify(next) });
      cfg = r.config;
    }
    renderAll();
    if (msg) toast(msg);
    return true;
  } catch (e) {
    toast(e.message, true);
    return false;
  }
}

async function loadConfig() {
  if (demo) {
    cfg = store.get("hm.cfg.local", clone(DEFAULT_CONFIG));
    return;
  }
  try {
    const r = await api("/api/config");
    storageOk = r.storage !== false;
    cfg = storageOk ? r.config : store.get("hm.cfg.local", r.config);
  } catch {
    cfg = store.get("hm.cfg.local", clone(DEFAULT_CONFIG));
  }
}

// =====================================================================
// Status (modo econômico: 3 s ativo → 5 s → 10 s → parado em 2º plano)
// =====================================================================
let refreshing = false;
async function refresh(silent = false) {
  if (refreshing || demo || !$("#pinBox").hidden) return;
  refreshing = true;
  $("#conn").classList.add("busy");
  try {
    const data = await api("/api/status");
    let known = 0;
    for (const [id, st] of Object.entries(data.states || {})) {
      if (!state[id] || st.level === null || st.level === undefined) continue;
      known++;
      if (Date.now() - (touched[id] || 0) < 8000) continue;
      state[id].level = st.level;
    }
    persistStates();
    paintAll();
    setConn(known ? "ok" : "err", known ? "Conectado" : "Sem status da central");
  } catch (e) {
    setConn("err", "Sem conexão");
    if (!silent) toast(e.message, true);
  } finally {
    refreshing = false;
    $("#conn").classList.remove("busy");
  }
}

const POLL = [
  { idle: 2 * 60_000, every: 3000 },
  { idle: 10 * 60_000, every: 5000 },
  { idle: Infinity, every: 10_000 },
];
let lastActivity = Date.now();
let pollTimer = null;
const pollDelay = () => POLL.find((p) => Date.now() - lastActivity < p.idle).every;
function schedulePoll(ms) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    if (document.visibilityState === "visible") await refresh(true);
    if (document.visibilityState === "visible") schedulePoll(pollDelay());
  }, ms);
}
function bumpActivity() {
  const wasSlow = pollDelay() > POLL[0].every;
  lastActivity = Date.now();
  if (wasSlow && pollTimer !== null) schedulePoll(0);
}
["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((ev) => window.addEventListener(ev, bumpActivity, { passive: true }));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (local.panel) keepAwake(true);
  if (pollTimer === null) return;
  lastActivity = Date.now();
  schedulePoll(0);
});

// =====================================================================
// Renderização
// =====================================================================
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function setConn(kind, text) {
  $("#conn").className = `dot ${kind}`;
  $("#connText").textContent = text;
}

function renderAll() {
  $("#greeting").textContent = greeting();
  renderScenes();
  renderChips();
  renderContent();
}

function sceneActive(s) {
  const e = Object.entries(s.levels);
  return e.length > 0 && e.every(([id, lv]) => state[id] && state[id].level !== null && Math.abs(state[id].level - lv) <= 5);
}

function renderScenes() {
  $("#scenes").innerHTML =
    cfg.scenes
      .map((s) => `<button class="scene glass" data-scene="${esc(s.id)}">
        <span class="s-ico">${icon(s.icon)}</span><span class="s-name">${esc(s.name)}</span></button>`)
      .join("") +
    `<button class="scene glass add" data-new-scene><span class="s-ico">${ICON.plus}</span><span class="s-name">Nova cena</span></button>`;
}

function renderChips() {
  const hasFav = lights().some((l) => l.fav);
  if (filter === "fav" && !hasFav) filter = "all";
  if (!["all", "fav"].includes(filter) && !cfg.rooms.some((r) => r.key === filter)) filter = "all";
  const chips = [
    { key: "all", name: "Todos" },
    ...(hasFav ? [{ key: "fav", name: "Favoritos", ico: ICON.heart }] : []),
    ...cfg.rooms.filter((r) => roomLights(r.key).length),
  ];
  $("#chips").innerHTML = chips
    .map((c) => `<button class="chip glass ${filter === c.key ? "active" : ""}" data-filter="${esc(c.key)}">${c.ico || ""}${esc(c.name)}</button>`)
    .join("");
}

const tileHTML = (l) => `<button class="tile glass" data-id="${l.id}"></button>`;

function roomHTML(r) {
  const ls = r ? roomLights(r.key) : [];
  if (!ls.length) return "";
  return `<section class="room" data-room="${esc(r.key)}">
    <div class="room-head">
      <div><h3>${esc(r.name)}</h3><small data-room-count></small></div>
      <div class="room-ctrl">
        <div class="hslider" data-room-slider="${esc(r.key)}" role="slider" tabindex="0" aria-label="Brilho de ${esc(r.name)}" aria-valuemin="0" aria-valuemax="100">
          <div class="fill"></div><div class="lbl">${ICON.sun}<span data-v></span></div>
        </div>
        <button class="switch warm" role="switch" data-room-switch="${esc(r.key)}" aria-label="Ligar ou desligar ${esc(r.name)}"></button>
      </div>
    </div>
    <div class="grid">${ls.map(tileHTML).join("")}</div>
  </section>`;
}

function renderContent() {
  const favs = lights().filter((l) => l.fav);
  let html = "";
  if (filter === "fav") {
    html = `<section class="room"><div class="grid">${favs.map(tileHTML).join("")}</div></section>`;
  } else if (filter === "all") {
    if (favs.length) html += `<section class="room"><div class="room-head"><div><h3>Favoritos</h3></div></div><div class="grid">${favs.map(tileHTML).join("")}</div></section>`;
    html += cfg.rooms.map(roomHTML).join("");
  } else {
    html = roomHTML(cfg.rooms.find((r) => r.key === filter));
  }
  $("#content").innerHTML = html || `<p class="empty">Nenhuma luz aqui ainda.</p>`;
  $$("[data-room-slider]").forEach((el) => {
    const key = el.dataset.roomSlider;
    bindSlider(el, {
      axis: "x",
      get: () => avg(roomLights(key).map((l) => l.id)),
      preview: (v) => paintRoomSlider(el, v),
      commit: (v) => setMany(Object.fromEntries(roomLights(key).map((l) => [l.id, v]))),
    });
  });
  paintAll();
}

function paintLight(id, { preview, pending, skipAgg } = {}) {
  const l = L(BY_ID[id]);
  const lv = preview ?? state[id].level;
  const on = (lv ?? 0) > 0;
  $$(`.tile[data-id="${id}"]`).forEach((el) => {
    el.classList.toggle("on", on);
    el.classList.toggle("pending", !!pending);
    el.style.setProperty("--lv", on ? (lv / 100).toFixed(2) : 0);
    el.setAttribute("aria-pressed", String(on));
    el.setAttribute("aria-label", `${l.name}, ${stateText(id, lv)}`);
    el.innerHTML = `
      <div class="tile-top"><span class="ico">${icon(l.icon)}</span>${l.fav ? `<span class="fav">${ICON.heart}</span>` : ""}</div>
      <div><div class="tile-name">${esc(l.name)}</div><div class="tile-state">${stateText(id, lv)}</div></div>
      <span class="bar" style="width:${on ? lv : 0}%"></span>`;
  });
  if (preview === undefined && !skipAgg) paintAggregates();
  if (sheetCtx?.type === "light" && sheetCtx.id === id && !sheetCtx.dragging) paintLightSheet();
}

function paintRoomSlider(el, v) {
  $(".fill", el).style.width = `${v}%`;
  $("[data-v]", el).textContent = v ? `${v}%` : "Apagado";
  el.setAttribute("aria-valuenow", v);
}

function paintAggregates() {
  const all = DEVICES.map((d) => d.id);
  const on = all.filter(isOn).length;
  $("#summary").textContent = on ? `${on} de ${all.length} luzes acesas` : "Tudo apagado";
  document.documentElement.style.setProperty("--glow", ((avg(all) / 100) * 0.32).toFixed(3));
  $$("section[data-room]").forEach((sec) => {
    const ids = roomLights(sec.dataset.room).map((l) => l.id);
    const n = ids.filter(isOn).length;
    $("[data-room-count]", sec).textContent = n ? `${n} de ${ids.length} acesa${n > 1 ? "s" : ""}` : "Apagado";
    $("[data-room-switch]", sec).setAttribute("aria-checked", String(n > 0));
    const sl = $("[data-room-slider]", sec);
    if (!sl.classList.contains("dragging")) paintRoomSlider(sl, avg(ids));
  });
  $$(".scene[data-scene]").forEach((el) => {
    const s = cfg.scenes.find((x) => x.id === el.dataset.scene);
    el.classList.toggle("active", !!s && sceneActive(s));
  });
}

function paintAll() {
  DEVICES.forEach((d) => paintLight(d.id, { skipAgg: true }));
  paintAggregates();
}

let toastTimer;
function toast(msg, err = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast show ${err ? "err" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2600);
}

// =====================================================================
// Slider genérico (horizontal ou vertical, ponteiro + teclado)
// =====================================================================
function bindSlider(el, { axis, get, preview, commit, onDrag }) {
  let active = false, moved = false, sx = 0, sy = 0, v = 0, kbTimer, kbV = null;
  const calc = (e) => {
    const r = el.getBoundingClientRect();
    const f = axis === "x" ? (e.clientX - r.left) / r.width : (r.bottom - e.clientY) / r.height;
    return clamp5(f * 100);
  };
  const startDrag = (e) => {
    moved = true;
    try { el.setPointerCapture(e.pointerId); } catch {}
    el.classList.add("dragging");
    onDrag?.(true);
  };
  preview(get());
  el.addEventListener("pointerdown", (e) => {
    active = true; moved = false; sx = e.clientX; sy = e.clientY; v = get();
    if (axis === "y") { startDrag(e); v = calc(e); preview(v); }
  });
  el.addEventListener("pointermove", (e) => {
    if (!active) return;
    if (!moved) {
      const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
      if (dx < 6 || dx < dy) return;
      startDrag(e);
    }
    const nv = calc(e);
    if (nv !== v) { v = nv; preview(v); if (v % 25 === 0) vibrate(4); }
  });
  const end = (e, cancel) => {
    if (!active) return;
    active = false;
    el.classList.remove("dragging");
    onDrag?.(false);
    if (cancel) return preview(get());
    if (!moved) v = calc(e); // toque simples: vai direto para o ponto tocado
    preview(v);
    commit(v);
  };
  el.addEventListener("pointerup", (e) => end(e, false));
  el.addEventListener("pointercancel", (e) => end(e, true));
  el.addEventListener("keydown", (e) => {
    const step = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 25, PageDown: -25, Home: -100, End: 100 }[e.key];
    if (!step) return;
    e.preventDefault();
    kbV = Math.max(0, Math.min(100, (kbV ?? get()) + step));
    preview(kbV);
    clearTimeout(kbTimer);
    kbTimer = setTimeout(() => { commit(kbV); kbV = null; }, 400);
  });
}

// =====================================================================
// Gestos nos blocos: toque = liga/desliga · arrastar lateral = dimmer · segurar = painel
// =====================================================================
let g = null;
const content = $("#content");
content.addEventListener("pointerdown", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile || e.button > 0) return;
  const id = +tile.dataset.id;
  g = { tile, id, x: e.clientX, y: e.clientY, start: level(id), v: null, mode: null, pid: e.pointerId };
  g.lp = setTimeout(() => {
    if (!g || g.mode) return;
    g.mode = "long";
    vibrate(12);
    openLight(id);
  }, 480);
});
content.addEventListener("pointermove", (e) => {
  if (!g) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  if (!g.mode) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      g.mode = "dim";
      clearTimeout(g.lp);
      g.w = g.tile.getBoundingClientRect().width;
      try { g.tile.setPointerCapture(g.pid); } catch {}
      $$(`.tile[data-id="${g.id}"]`).forEach((t) => t.classList.add("dimming"));
    } else if (Math.abs(dy) > 10) {
      g.mode = "scroll";
      clearTimeout(g.lp);
    }
  }
  if (g.mode === "dim") {
    const v = clamp5(g.start + (dx / g.w) * 110);
    if (v !== g.v) {
      g.v = v;
      paintLight(g.id, { preview: v });
      if (v % 25 === 0) vibrate(4);
    }
  }
});
const endGesture = (cancel) => {
  if (!g) return;
  clearTimeout(g.lp);
  const { id, mode, v } = g;
  $$(`.tile[data-id="${id}"]`).forEach((t) => t.classList.remove("dimming"));
  g = null;
  if (mode === "dim") return cancel ? paintLight(id) : setLevel(id, v ?? level(id));
  if (!mode && !cancel) toggle(id);
};
content.addEventListener("pointerup", (e) => { if (e.target.closest(".tile") || g?.mode === "dim") endGesture(false); else if (g) { clearTimeout(g.lp); g = null; } });
content.addEventListener("pointercancel", () => endGesture(true));
content.addEventListener("contextmenu", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  e.preventDefault();
  if (g) {
    clearTimeout(g.lp);
    if (g.mode === "long") return; // já abriu pelo toque longo
    g = null;
  }
  openLight(+tile.dataset.id);
});
content.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (tile && e.detail === 0) toggle(+tile.dataset.id); // teclado (Enter/Espaço)
  const sw = e.target.closest("[data-room-switch]");
  if (sw) {
    const ids = roomLights(sw.dataset.roomSwitch).map((l) => l.id);
    const anyOn = ids.some(isOn);
    vibrate(8);
    setMany(Object.fromEntries(ids.map((id) => [id, anyOn ? 0 : 100])));
  }
});
const toggle = (id) => { vibrate(6); setLevel(id, isOn(id) ? 0 : 100); };

// Cenas: toque = executa · segurar / botão direito = editar
let sceneLP = null;
$("#scenes").addEventListener("pointerdown", (e) => {
  const el = e.target.closest("[data-scene]");
  if (!el) return;
  sceneLP = { fired: false };
  sceneLP.t = setTimeout(() => { sceneLP.fired = true; vibrate(12); openSceneEditor(el.dataset.scene); }, 520);
});
["pointercancel", "pointerleave"].forEach((ev) => $("#scenes").addEventListener(ev, () => sceneLP && clearTimeout(sceneLP.t)));
$("#scenes").addEventListener("pointerup", () => sceneLP && clearTimeout(sceneLP.t));
$("#scenes").addEventListener("scroll", () => sceneLP && clearTimeout(sceneLP.t), { passive: true });
$("#scenes").addEventListener("contextmenu", (e) => {
  const el = e.target.closest("[data-scene]");
  if (!el) return;
  e.preventDefault();
  if (sceneLP) clearTimeout(sceneLP.t);
  if (!sceneLP?.fired) openSceneEditor(el.dataset.scene);
  sceneLP = { fired: true };
});
$("#scenes").addEventListener("click", (e) => {
  if (e.target.closest("[data-new-scene]")) return openSceneEditor(null);
  const el = e.target.closest("[data-scene]");
  if (!el) return;
  if (sceneLP?.fired) { sceneLP = null; return; }
  const s = cfg.scenes.find((x) => x.id === el.dataset.scene);
  if (s) runScene(s);
});

$("#chips").addEventListener("click", (e) => {
  const c = e.target.closest("[data-filter]");
  if (!c) return;
  filter = c.dataset.filter;
  store.set("hm.filter", filter);
  renderChips();
  renderContent();
});

let offArmed = 0;
$("#allOff").addEventListener("click", () => {
  if (Date.now() - offArmed > 3000) {
    offArmed = Date.now();
    vibrate(8);
    return toast("Toque de novo para apagar tudo");
  }
  offArmed = 0;
  setMany(Object.fromEntries(DEVICES.filter((d) => isOn(d.id)).map((d) => [d.id, 0])));
  toast("Apagando tudo…");
});
$("#settingsBtn").addEventListener("click", () => openSettings("cenas"));
$("#manageScenes").addEventListener("click", () => openSettings("cenas"));
$("#connBtn").addEventListener("click", () => refresh(false));

// =====================================================================
// Sheet (painel inferior)
// =====================================================================
let sheetCtx = null;
function openSheet(ctx, html) {
  sheetCtx = ctx;
  const card = $("#sheetCard");
  card.onclick = null;
  card.innerHTML = html;
  card.scrollTop = 0;
  $("#sheet").hidden = false;
  return card;
}
function closeSheet() {
  $("#sheet").hidden = true;
  sheetCtx = null;
}
$("#sheet").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
const head = (ico, title, sub = null, lit = false) => `
  <div class="sheet-head">
    ${ico ? `<span class="ico big ${lit ? "lit" : ""}" data-head-ico>${ico}</span>` : ""}
    <div style="min-width:0"><h2>${esc(title)}</h2>${sub !== null ? `<p data-head-sub>${sub}</p>` : ""}</div>
    <button class="close" data-close aria-label="Fechar">${ICON.close}</button>
  </div>`;

// ---------- Luz ----------
function openLight(id) {
  const l = L(BY_ID[id]);
  const card = openSheet({ type: "light", id }, `
    ${head(icon(l.icon), l.name, stateText(id), isOn(id))}
    <div class="dimmer">
      <div class="vslider" role="slider" tabindex="0" aria-label="Intensidade" aria-valuemin="0" aria-valuemax="100"><div class="fill"></div><div class="val"></div></div>
      <div class="presets">${[100, 75, 50, 25, 0].map((p) => `<button class="preset glass" data-preset="${p}">${p ? p + "%" : "Desligar"}</button>`).join("")}</div>
    </div>
    <div class="row-actions">
      <button class="btn glass ${l.fav ? "on" : ""}" data-fav style="flex:1">${ICON.heart}${l.fav ? "Favorito" : "Favoritar"}</button>
      <button class="btn glass" data-custom style="flex:1">${ICON.edit}Personalizar</button>
    </div>
    <div data-custom-form hidden></div>`);
  bindSlider($(".vslider", card), {
    axis: "y",
    get: () => level(id),
    preview: (v) => paintLightSheet(v),
    commit: (v) => setLevel(id, v),
    onDrag: (d) => { if (sheetCtx) sheetCtx.dragging = d; },
  });
  card.onclick = (e) => {
    const p = e.target.closest("[data-preset]");
    if (p) { vibrate(6); return setLevel(id, +p.dataset.preset); }
    if (e.target.closest("[data-fav]")) {
      const next = clone(cfg);
      next.lights[id] = { ...next.lights[id], fav: !l.fav };
      if (!next.lights[id].fav) delete next.lights[id].fav;
      return saveConfig(next, !l.fav ? "Adicionada aos favoritos" : "Removida dos favoritos").then((ok) => ok && openLight(id));
    }
    if (e.target.closest("[data-custom]")) return showCustomize(id, card);
  };
  paintLightSheet();
}

function paintLightSheet(previewV) {
  if (sheetCtx?.type !== "light") return;
  const card = $("#sheetCard"), id = sheetCtx.id;
  const v = previewV ?? level(id);
  $(".vslider .fill", card).style.height = `${v}%`;
  $(".vslider .val", card).textContent = `${v}%`;
  $(".vslider", card).setAttribute("aria-valuenow", v);
  $("[data-head-sub]", card).textContent = previewV !== undefined ? (v ? `${v}%` : "Desligado") : stateText(id);
  const ico = $("[data-head-ico]", card);
  ico.classList.toggle("lit", v > 0);
  ico.style.setProperty("--lv", (v / 100).toFixed(2));
  $$("[data-preset]", card).forEach((b) => b.classList.toggle("active", +b.dataset.preset === v));
}

function iconPicker(list, sel) {
  return `<div class="icon-grid" role="radiogroup">${list
    .map((k) => `<button type="button" class="icon-opt ${k === sel ? "sel" : ""}" data-icon="${k}" role="radio" aria-checked="${k === sel}" aria-label="${k}">${icon(k)}</button>`)
    .join("")}</div>`;
}

function showCustomize(id, card) {
  const l = L(BY_ID[id]);
  const box = $("[data-custom-form]", card);
  if (!box.hidden) return (box.hidden = true);
  let ico = l.icon;
  box.hidden = false;
  box.innerHTML = `<div class="form">
    <label class="field"><span>Nome</span><input class="input" data-name maxlength="30" value="${esc(l.name)}"></label>
    <div class="field"><span>Ícone</span>${iconPicker(LIGHT_ICONS, ico)}</div>
    <label class="field"><span>Ambiente</span><select class="input" data-room>${cfg.rooms
      .map((r) => `<option value="${esc(r.key)}" ${r.key === l.room ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label>
    <div class="row-actions">
      <button class="btn glass" data-reset style="flex:1">Restaurar</button>
      <button class="btn primary" data-save style="flex:2">Salvar</button>
    </div>
    <p class="hint">ID na Home Manager: ${id} · nome original: ${esc(BY_ID[id].name)}</p>
  </div>`;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  box.onclick = async (e) => {
    e.stopPropagation();
    const ib = e.target.closest("[data-icon]");
    if (ib) {
      ico = ib.dataset.icon;
      $$("[data-icon]", box).forEach((b) => { b.classList.toggle("sel", b === ib); b.setAttribute("aria-checked", b === ib); });
      return;
    }
    const next = clone(cfg);
    if (e.target.closest("[data-reset]")) {
      const fav = next.lights[id]?.fav;
      next.lights[id] = fav ? { fav } : {};
    } else if (e.target.closest("[data-save]")) {
      const name = $("[data-name]", box).value.trim();
      next.lights[id] = { ...next.lights[id], name: name || BY_ID[id].name, icon: ico, room: $("[data-room]", box).value };
    } else return;
    if (await saveConfig(next)) openLight(id);
  };
}

// ---------- Editor de cena ----------
function openSceneEditor(sceneId) {
  const existing = cfg.scenes.find((s) => s.id === sceneId);
  const draft = existing
    ? clone(existing)
    : { id: "", name: "", icon: "sparkle", levels: Object.fromEntries(DEVICES.map((d) => [d.id, level(d.id)])) };
  const card = openSheet({ type: "scene" }, `
    ${head(icon(draft.icon), existing ? "Editar cena" : "Nova cena")}
    <div class="form">
      <label class="field"><span>Nome</span><input class="input" data-name maxlength="30" placeholder="Ex.: Atendimento" value="${esc(draft.name)}"></label>
      <div class="field"><span>Ícone</span>${iconPicker(SCENE_ICONS, draft.icon)}</div>
      <div class="row-actions">
        <button class="btn glass" data-capture style="flex:1">${ICON.camera}Capturar atual</button>
        <button class="btn glass" data-test style="flex:1">${ICON.play}Testar</button>
      </div>
      <div data-lights></div>
      <div class="row-actions">
        ${existing ? `<button class="btn danger" data-del aria-label="Excluir cena">${ICON.trash}</button>` : ""}
        <button class="btn primary" data-save style="flex:1">Salvar cena</button>
      </div>
      <p class="hint">Só as luzes marcadas são alteradas pela cena. As demais ficam como estão.</p>
    </div>`);

  const paintRows = () => {
    $("[data-lights]", card).innerHTML = cfg.rooms
      .map((r) => {
        const ls = roomLights(r.key);
        if (!ls.length) return "";
        return `<div class="section-t">${esc(r.name)}</div><div class="list">${ls
          .map((l) => {
            const inc = draft.levels[l.id] !== undefined;
            return `<div class="scene-light ${inc ? "" : "off"}" data-row="${l.id}">
              <button class="check" role="checkbox" aria-checked="${inc}" data-inc="${l.id}" aria-label="Incluir ${esc(l.name)}">${ICON.check}</button>
              <span class="nm">${esc(l.name)}</span>
              <div class="hslider" data-lv="${l.id}" role="slider" tabindex="0" aria-label="Nível de ${esc(l.name)}"><div class="fill"></div><div class="lbl"><span></span><span data-v></span></div></div>
            </div>`;
          }).join("")}</div>`;
      }).join("");
    $$("[data-lv]", card).forEach((el) => {
      const id = el.dataset.lv;
      bindSlider(el, {
        axis: "x",
        get: () => draft.levels[id] ?? 0,
        preview: (v) => { $(".fill", el).style.width = `${v}%`; $("[data-v]", el).textContent = v ? `${v}%` : "Desligada"; },
        commit: (v) => {
          draft.levels[id] = v;
          const row = el.closest("[data-row]");
          row.classList.remove("off");
          $("[data-inc]", row).setAttribute("aria-checked", "true");
        },
      });
    });
  };
  paintRows();

  card.onclick = async (e) => {
    const ib = e.target.closest("[data-icon]");
    if (ib) {
      draft.icon = ib.dataset.icon;
      $$("[data-icon]", card).forEach((b) => b.classList.toggle("sel", b === ib));
      $("[data-head-ico]", card).innerHTML = icon(draft.icon);
      return;
    }
    const inc = e.target.closest("[data-inc]");
    if (inc) {
      const id = inc.dataset.inc;
      if (draft.levels[id] !== undefined) delete draft.levels[id];
      else draft.levels[id] = level(+id);
      return paintRows();
    }
    if (e.target.closest("[data-capture]")) {
      const ids = Object.keys(draft.levels).length ? Object.keys(draft.levels) : DEVICES.map((d) => d.id);
      ids.forEach((id) => (draft.levels[id] = level(+id)));
      toast("Níveis atuais capturados");
      return paintRows();
    }
    if (e.target.closest("[data-test]")) return setMany(draft.levels);
    if (e.target.closest("[data-del]")) {
      if (!confirm(`Excluir a cena "${existing.name}"?`)) return;
      const next = clone(cfg);
      next.scenes = next.scenes.filter((s) => s.id !== existing.id);
      next.schedules = next.schedules.filter((s) => s.scene !== existing.id);
      if (await saveConfig(next, "Cena excluída")) closeSheet();
      return;
    }
    if (e.target.closest("[data-save]")) {
      draft.name = $("[data-name]", card).value.trim();
      if (!draft.name) return toast("Dê um nome para a cena", true);
      if (!Object.keys(draft.levels).length) return toast("Inclua ao menos uma luz", true);
      const next = clone(cfg);
      if (existing) next.scenes = next.scenes.map((s) => (s.id === existing.id ? { ...draft, id: existing.id } : s));
      else {
        const base = draft.name.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "cena";
        let id = base, n = 2;
        while (next.scenes.some((s) => s.id === id)) id = `${base}-${n++}`;
        next.scenes.push({ ...draft, id });
      }
      if (await saveConfig(next, "Cena salva")) closeSheet();
    }
  };
}

// ---------- Ajustes ----------
const TABS = [
  { key: "cenas", name: "Cenas" },
  { key: "agenda", name: "Agenda" },
  { key: "ambientes", name: "Ambientes" },
  { key: "geral", name: "Geral" },
];
function openSettings(tab = "cenas") {
  const card = openSheet({ type: "settings", tab }, `
    ${head(null, "Ajustes")}
    <div class="seg" style="margin-top:16px" role="tablist">${TABS.map((t) => `<button role="tab" data-tab="${t.key}" class="${t.key === tab ? "sel" : ""}">${t.name}</button>`).join("")}</div>
    <div data-body></div>`);
  card.onclick = (e) => {
    const t = e.target.closest("[data-tab]");
    if (t) openSettings(t.dataset.tab);
  };
  const body = $("[data-body]", card);
  ({ cenas: tabScenes, agenda: tabSchedule, ambientes: tabRooms, geral: tabGeneral })[tab](body);
}

function tabScenes(body) {
  body.innerHTML = `
    <div class="section-t">Toque numa cena para editar</div>
    <div class="list">${cfg.scenes.map((s, i) => `
      <div class="list-item">
        <span class="ico">${icon(s.icon)}</span>
        <button class="grow" style="text-align:left" data-edit="${esc(s.id)}"><div class="t">${esc(s.name)}</div><div class="s">${Object.keys(s.levels).length} luzes</div></button>
        <button class="mini" data-move="${i}" data-dir="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>${ICON.up}</button>
        <button class="mini" data-move="${i}" data-dir="1" aria-label="Descer" ${i === cfg.scenes.length - 1 ? "disabled" : ""}>${ICON.down}</button>
      </div>`).join("") || `<p class="empty">Nenhuma cena.</p>`}</div>
    <button class="btn glass wide" style="margin-top:12px" data-add>${ICON.plus}Nova cena</button>
    <p class="hint">Dica: segure uma cena na tela inicial para editá-la direto.</p>`;
  body.onclick = async (e) => {
    e.stopPropagation();
    const ed = e.target.closest("[data-edit]");
    if (ed) return openSceneEditor(ed.dataset.edit);
    if (e.target.closest("[data-add]")) return openSceneEditor(null);
    const mv = e.target.closest("[data-move]");
    if (mv) {
      const i = +mv.dataset.move, j = i + +mv.dataset.dir;
      const next = clone(cfg);
      [next.scenes[i], next.scenes[j]] = [next.scenes[j], next.scenes[i]];
      if (await saveConfig(next, null)) openSettings("cenas");
    }
  };
}

function daysLabel(days) {
  const k = days.join(",");
  if (k === "0,1,2,3,4,5,6") return "Todos os dias";
  if (k === "1,2,3,4,5") return "Seg a Sex";
  if (k === "1,2,3,4,5,6") return "Seg a Sáb";
  if (k === "0,6") return "Fim de semana";
  return days.map((d) => DAY_NAME[d]).join(", ");
}
function whenLabel(s) {
  if (s.at === "time") return s.time;
  const base = s.at === "sunset" ? "Pôr do sol" : "Nascer do sol";
  const off = s.offset ? ` ${s.offset > 0 ? "+" : "−"}${Math.abs(s.offset)} min` : "";
  const t = cfg.location ? sunTimes(new Date(), cfg.location.lat, cfg.location.lon)[s.at] : null;
  const hhmm = t ? new Date(t.getTime() + s.offset * 60000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) : "";
  return `${base}${off}${hhmm ? ` (hoje ${hhmm})` : ""}`;
}

function tabSchedule(body) {
  const sceneName = (id) => cfg.scenes.find((s) => s.id === id)?.name || "—";
  body.innerHTML = `
    ${demo || !storageOk ? `<p class="hint">⚠️ Agendamentos rodam no servidor e precisam do armazenamento ativo no Cloudflare.</p>` : ""}
    <div class="section-t">Executa cenas sozinho, mesmo com o app fechado</div>
    <div class="list">${cfg.schedules.map((s) => `
      <div class="list-item">
        <span class="ico">${s.at === "time" ? ICON.clock : icon(s.at)}</span>
        <button class="grow" style="text-align:left" data-edit="${esc(s.id)}"><div class="t">${esc(sceneName(s.scene))}</div><div class="s">${esc(whenLabel(s))} · ${daysLabel(s.days)}</div></button>
        <button class="switch" role="switch" aria-checked="${s.enabled}" data-toggle="${esc(s.id)}" aria-label="Ativar"></button>
      </div>`).join("") || `<p class="empty">Nenhum agendamento ainda.</p>`}</div>
    <button class="btn glass wide" style="margin-top:12px" data-add ${cfg.scenes.length ? "" : "disabled"}>${ICON.plus}Novo agendamento</button>
    <p class="hint">Horário de Brasília. Ex.: “Abertura” às 08:00 de Seg a Sáb, “Vitrine” no pôr do sol, “Fechamento” às 22:00.</p>`;
  body.onclick = async (e) => {
    e.stopPropagation();
    const ed = e.target.closest("[data-edit]");
    if (ed) return openScheduleEditor(ed.dataset.edit);
    if (e.target.closest("[data-add]")) return openScheduleEditor(null);
    const tg = e.target.closest("[data-toggle]");
    if (tg) {
      const next = clone(cfg);
      const s = next.schedules.find((x) => x.id === tg.dataset.toggle);
      s.enabled = !s.enabled;
      tg.setAttribute("aria-checked", s.enabled);
      saveConfig(next, s.enabled ? "Agendamento ativado" : "Agendamento pausado");
    }
  };
}

function openScheduleEditor(id) {
  const existing = cfg.schedules.find((s) => s.id === id);
  const d = existing ? clone(existing) : { id: "", scene: cfg.scenes[0]?.id, at: "time", time: "08:00", offset: 0, days: [1, 2, 3, 4, 5], enabled: true };
  const card = openSheet({ type: "schedule" }, `
    <div class="sheet-head">
      <button class="close" style="margin:0" data-back aria-label="Voltar">${ICON.back}</button>
      <h2>${existing ? "Editar agendamento" : "Novo agendamento"}</h2>
      <button class="close" data-close aria-label="Fechar">${ICON.close}</button>
    </div>
    <div class="form">
      <label class="field"><span>Cena</span><select class="input" data-scene>${cfg.scenes
        .map((s) => `<option value="${esc(s.id)}" ${s.id === d.scene ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
      <div class="field"><span>Quando</span><div class="seg" data-at>
        <button data-v="time">Horário</button><button data-v="sunrise">Nascer do sol</button><button data-v="sunset">Pôr do sol</button></div></div>
      <label class="field" data-time-f><span>Horário</span><input class="input" type="time" data-time value="${d.time}"></label>
      <label class="field" data-off-f><span>Ajuste</span><select class="input" data-off>${[-90, -60, -45, -30, -15, 0, 15, 30, 45, 60, 90]
        .map((o) => `<option value="${o}" ${o === d.offset ? "selected" : ""}>${o ? `${Math.abs(o)} min ${o < 0 ? "antes" : "depois"}` : "No horário exato"}</option>`).join("")}</select></label>
      <p class="hint" data-loc-hint hidden>Defina a localização em Ajustes → Geral para usar nascer/pôr do sol.</p>
      <div class="field"><span>Dias</span><div class="days">${DAY_SHORT.map((x, i) => `<button data-day="${i}" aria-label="${DAY_NAME[i]}">${x}</button>`).join("")}</div>
        <div class="row-actions" style="margin-top:8px">
          <button class="btn glass" data-days="1,2,3,4,5" style="flex:1">Seg–Sex</button>
          <button class="btn glass" data-days="1,2,3,4,5,6" style="flex:1">Seg–Sáb</button>
          <button class="btn glass" data-days="0,1,2,3,4,5,6" style="flex:1">Todos</button>
        </div></div>
      <div class="row-actions">
        ${existing ? `<button class="btn danger" data-del aria-label="Excluir agendamento">${ICON.trash}</button>` : ""}
        <button class="btn primary" data-save style="flex:1">Salvar</button>
      </div>
    </div>`);
  const paint = () => {
    $$("[data-at] button", card).forEach((b) => b.classList.toggle("sel", b.dataset.v === d.at));
    $("[data-time-f]", card).hidden = d.at !== "time";
    $("[data-off-f]", card).hidden = d.at === "time";
    $("[data-loc-hint]", card).hidden = d.at === "time" || !!cfg.location;
    $$("[data-day]", card).forEach((b) => b.classList.toggle("sel", d.days.includes(+b.dataset.day)));
  };
  paint();
  card.onclick = async (e) => {
    if (e.target.closest("[data-back]")) return openSettings("agenda");
    const at = e.target.closest("[data-at] button");
    if (at) { d.at = at.dataset.v; return paint(); }
    const day = e.target.closest("[data-day]");
    if (day) {
      const n = +day.dataset.day;
      d.days = d.days.includes(n) ? d.days.filter((x) => x !== n) : [...d.days, n].sort();
      return paint();
    }
    const ds = e.target.closest("[data-days]");
    if (ds) { d.days = ds.dataset.days.split(",").map(Number); return paint(); }
    const next = clone(cfg);
    if (e.target.closest("[data-del]")) {
      next.schedules = next.schedules.filter((s) => s.id !== existing.id);
      if (await saveConfig(next, "Agendamento excluído")) openSettings("agenda");
      return;
    }
    if (e.target.closest("[data-save]")) {
      d.scene = $("[data-scene]", card).value;
      d.time = $("[data-time]", card).value || "08:00";
      d.offset = +$("[data-off]", card).value;
      if (!d.days.length) return toast("Escolha ao menos um dia", true);
      if (d.at !== "time" && !cfg.location) return toast("Defina a localização em Ajustes → Geral", true);
      if (existing) next.schedules = next.schedules.map((s) => (s.id === existing.id ? d : s));
      else next.schedules.push({ ...d, id: `ag-${Date.now().toString(36)}` });
      if (await saveConfig(next, "Agendamento salvo")) openSettings("agenda");
    }
  };
}

function tabRooms(body) {
  const draft = clone(cfg.rooms);
  const paint = () => {
    body.innerHTML = `
      <div class="section-t">Renomeie, reordene ou crie ambientes</div>
      <div class="list">${draft.map((r, i) => `
        <div class="list-item">
          <input class="input" style="flex:1;min-width:0;padding:9px 12px" data-rname="${i}" value="${esc(r.name)}" maxlength="30" aria-label="Nome do ambiente">
          <span class="s" style="min-width:20px;text-align:right">${roomLights(r.key).length}</span>
          <button class="mini" data-move="${i}" data-dir="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>${ICON.up}</button>
          <button class="mini" data-move="${i}" data-dir="1" aria-label="Descer" ${i === draft.length - 1 ? "disabled" : ""}>${ICON.down}</button>
          <button class="mini" data-rdel="${i}" aria-label="Excluir" ${draft.length < 2 ? "disabled" : ""}>${ICON.trash}</button>
        </div>`).join("")}</div>
      <div class="row-actions" style="margin-top:12px">
        <button class="btn glass" data-add style="flex:1">${ICON.plus}Novo ambiente</button>
        <button class="btn primary" data-save style="flex:1">Salvar</button>
      </div>
      <p class="hint">O número indica quantas luzes há no ambiente. Para mover uma luz, segure o bloco dela → Personalizar. Ao excluir um ambiente, as luzes dele vão para o primeiro da lista.</p>`;
  };
  const sync = () => $$("[data-rname]", body).forEach((inp) => (draft[+inp.dataset.rname].name = inp.value));
  paint();
  body.onclick = async (e) => {
    e.stopPropagation();
    const mv = e.target.closest("[data-move]");
    if (mv) {
      sync();
      const i = +mv.dataset.move, j = i + +mv.dataset.dir;
      [draft[i], draft[j]] = [draft[j], draft[i]];
      return paint();
    }
    const del = e.target.closest("[data-rdel]");
    if (del) { sync(); draft.splice(+del.dataset.rdel, 1); return paint(); }
    if (e.target.closest("[data-add]")) {
      sync();
      draft.push({ key: `amb-${Date.now().toString(36)}`, name: "Novo ambiente" });
      paint();
      $$("[data-rname]", body).at(-1).select();
      return;
    }
    if (e.target.closest("[data-save]")) {
      sync();
      const next = clone(cfg);
      next.rooms = draft.map((r) => ({ ...r, name: r.name.trim() || "Ambiente" }));
      const keys = next.rooms.map((r) => r.key);
      for (const d of DEVICES) {
        if (!keys.includes(L(d).room)) next.lights[d.id] = { ...next.lights[d.id], room: keys[0] };
      }
      if (await saveConfig(next, "Ambientes salvos")) openSettings("ambientes");
    }
  };
}

async function tabGeneral(body) {
  const sun = cfg.location ? sunTimes(new Date(), cfg.location.lat, cfg.location.lon) : null;
  const fmt = (t) => t?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }) ?? "—";
  body.innerHTML = `
    <div class="section-t">Localização (nascer/pôr do sol)</div>
    <div class="list">
      <div class="list-item"><span class="ico">${ICON.pin}</span><div class="grow">
        <div class="t">${cfg.location ? `${cfg.location.lat}, ${cfg.location.lon}` : "Não definida"}</div>
        <div class="s">${sun ? `Hoje: nascer ${fmt(sun.sunrise)} · pôr ${fmt(sun.sunset)}` : "Necessária para agendar no pôr do sol"}</div></div>
        <button class="btn glass" data-geo>Usar daqui</button></div>
    </div>
    <div class="section-t">Este aparelho</div>
    <div class="list">
      <div class="list-item"><span class="ico">${ICON.tablet}</span><div class="grow"><div class="t">Modo painel de parede</div>
        <div class="s">Mantém a tela sempre ligada (ideal para tablet fixo)</div></div>
        <button class="switch" role="switch" aria-checked="${!!local.panel}" data-panel aria-label="Modo painel"></button></div>
    </div>
    <div class="section-t">Atividade recente</div>
    <div class="list" data-log><div class="list-item"><span class="s">Carregando…</span></div></div>
    <div class="section-t">Sistema</div>
    <div class="list">
      <div class="list-item"><div class="grow"><div class="t">Conexão</div><div class="s">${esc($("#connText").textContent)} · ${DEVICES.length} dimmers</div></div></div>
      <div class="list-item"><div class="grow"><div class="t">Armazenamento compartilhado</div><div class="s">${demo ? "Demonstração (só neste aparelho)" : storageOk ? "Ativo — cenas e ajustes valem para todos os aparelhos" : "Indisponível — salvando só neste aparelho"}</div></div></div>
    </div>
    <button class="btn danger wide" style="margin-top:16px" data-reset>Restaurar configuração padrão</button>`;
  body.onclick = async (e) => {
    e.stopPropagation();
    if (e.target.closest("[data-geo]")) {
      if (!navigator.geolocation) return toast("Localização indisponível neste aparelho", true);
      toast("Obtendo localização…");
      navigator.geolocation.getCurrentPosition(
        async (p) => {
          const next = clone(cfg);
          next.location = { lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) };
          if (await saveConfig(next, "Localização salva")) openSettings("geral");
        },
        () => toast("Permissão de localização negada", true),
        { enableHighAccuracy: false, timeout: 10000 }
      );
      return;
    }
    const pn = e.target.closest("[data-panel]");
    if (pn) {
      local.panel = !local.panel;
      store.set("hm.local", local);
      pn.setAttribute("aria-checked", local.panel);
      keepAwake(local.panel);
      return toast(local.panel ? "Tela ficará sempre ligada" : "Modo painel desligado");
    }
    if (e.target.closest("[data-reset]")) {
      if (!confirm("Restaurar cenas, ambientes, nomes e agendamentos para o padrão?")) return;
      if (await saveConfig(clone(DEFAULT_CONFIG), "Configuração restaurada")) openSettings("geral");
    }
  };
  try {
    const { log = [] } = demo ? { log: [] } : await api("/api/log");
    const box = $("[data-log]", body);
    if (!box) return;
    box.innerHTML = log.length
      ? log.slice(0, 12).map((x) => `<div class="list-item"><span class="ico">${x.kind === "agenda" ? ICON.clock : ICON.sparkle}</span><div class="grow">
          <div class="t">${esc(x.scene)}</div><div class="s">${x.kind === "agenda" ? "Agendamento" : "Cena pelo app"} · ${new Date(x.t).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TZ })}${x.fail ? ` · ${x.fail} falha(s)` : ""}</div></div></div>`).join("")
      : `<div class="list-item"><span class="s">Nenhuma cena executada ainda.</span></div>`;
  } catch {}
}

// Modo painel: mantém a tela acesa
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && "wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => (wakeLock = null));
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {}
}

// =====================================================================
// PIN
// =====================================================================
function askPin() {
  $("#pinBox").hidden = false;
  $("#pinInput").focus();
}
$("#pinForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  pin = $("#pinInput").value.trim();
  store.set("hm.pin", pin);
  $("#pinBox").hidden = true;
  await loadConfig();
  renderAll();
  await refresh();
  if (pollTimer === null) schedulePoll(POLL[0].every);
});

// =====================================================================
// Início
// =====================================================================
$("#allOff").innerHTML = ICON.power;
$("#settingsBtn").innerHTML = ICON.gear;
setInterval(() => ($("#greeting").textContent = greeting()), 60_000);

(async () => {
  let needPin = false;
  if (!demo) {
    try {
      const h = await fetch("/api/health", { cache: "no-store" }).then((r) => r.json());
      needPin = h.pinRequired && !pin;
      storageOk = !!h.storage;
    } catch {
      demo = true; // sem backend (ex.: aberto como arquivo) -> demonstração
    }
  }
  if (demo) {
    cfg = store.get("hm.cfg.local", clone(DEFAULT_CONFIG));
    setConn("demo", "Modo demonstração");
    DEVICES.forEach((d, i) => { if (state[d.id].level === null) state[d.id].level = [0, 80, 0, 100, 45][i % 5]; });
    renderAll();
    return;
  }
  if (needPin) {
    renderAll();
    return askPin();
  }
  await loadConfig();
  renderAll();
  if (local.panel) keepAwake(true);
  await refresh(true);
  schedulePoll(POLL[0].every);
})();
