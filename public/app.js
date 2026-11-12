import { DEVICES, GROUPS } from "./devices.js";

const $ = (s) => document.querySelector(s);
const ICONS = {
  bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.1 1 1.85V16h5v-.25c0-.75.4-1.4 1-1.85A6 6 0 0 0 12 3Z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
};

// ---------- Estado ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const saved = store.get("hm.states.v2", {});
const state = Object.fromEntries(
  DEVICES.map((d) => [d.id, { level: null, last: 100, ...saved[d.id] }])
);
const seq = {};
const touched = {}; // último clique por dispositivo (ms)
let demo = new URLSearchParams(location.search).has("demo");
let pin = store.get("hm.pin", "");
let filter = store.get("hm.filter", "all");

// ---------- API ----------
async function api(path) {
  if (demo) {
    await new Promise((r) => setTimeout(r, 180));
    return { ok: true };
  }
  const res = await fetch(path, { headers: pin ? { "x-app-pin": pin } : {}, cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (res.status === 401) { askPin(); throw new Error("PIN necessário"); }
  if (!data.ok) throw new Error(data.error || `Falha (HTTP ${data.status || res.status})`);
  return data;
}

async function setLevel(d, level) {
  level = Math.max(0, Math.min(100, Math.round(level / 5) * 5));
  const s = state[d.id];
  const prev = { ...s };
  s.level = level;
  if (level > 0) s.last = level;
  renderTile(d); renderSheet();
  touched[d.id] = Date.now();
  const my = (seq[d.id] = (seq[d.id] || 0) + 1);
  markPending(d, true);
  try {
    await api(`/api/command?id=${d.id}&valor=${level}`);
    persist();
  } catch (e) {
    if (seq[d.id] === my) { Object.assign(s, prev); renderTile(d); renderSheet(); }
    toast(`${d.name}: ${e.message}`, true);
  } finally {
    if (seq[d.id] === my) markPending(d, false);
  }
}

const isOn = (d) => (state[d.id].level || 0) > 0;
const toggle = (d) => setLevel(d, isOn(d) ? 0 : state[d.id].last || 100);

async function refresh(silent = false) {
  const btn = $("#refresh");
  btn.classList.add("spin");
  try {
    if (demo) return;
    const data = await api("/api/status");
    let known = 0;
    for (const [id, st] of Object.entries(data.states || {})) {
      if (!state[id] || st.level === null || st.level === undefined) continue;
      known++;
      if (Date.now() - (touched[id] || 0) < 8000) continue; // não sobrescreve clique recente
      state[id].level = st.level;
      if (st.level > 0) state[id].last = st.level;
    }
    persist(); renderAll();
    setConn(known ? "ok" : "err", known ? "Conectado" : "Sem status da central");
  } catch (e) {
    setConn("err", "Sem conexão");
    if (!silent) toast(e.message, true);
  } finally {
    btn.classList.remove("spin");
  }
}

function persist() {
  store.set("hm.states.v2", Object.fromEntries(DEVICES.map((d) => [d.id, state[d.id]])));
}

// ---------- Render ----------
function stateText(d) {
  const s = state[d.id];
  if (s.level === null) return "Sem status";
  if (s.level === 0) return "Desligado";
  return `${s.level}%`;
}

function renderAll() {
  const chips = [{ key: "all", name: "Todos" }, ...GROUPS];
  $("#chips").innerHTML = chips
    .map((g) => `<button class="chip glass ${filter === g.key ? "active" : ""}" data-filter="${g.key}">${g.name}</button>`)
    .join("");

  $("#rooms").innerHTML = GROUPS.filter((g) => filter === "all" || filter === g.key)
    .map((g) => {
      const list = DEVICES.filter((d) => d.group === g.key);
      const on = list.filter(isOn).length;
      return `<section class="room">
        <h3>${g.name} <small>${on ? `${on} acesa${on > 1 ? "s" : ""}` : "Apagado"}</small></h3>
        <div class="grid">${list.map((d) => `<button class="tile glass" id="t${d.id}" data-id="${d.id}"></button>`).join("")}</div>
      </section>`;
    })
    .join("");
  DEVICES.forEach(renderTile);
  renderSummary();
}

function renderTile(d) {
  const el = document.getElementById(`t${d.id}`);
  if (el) {
    el.classList.toggle("on", isOn(d));
    el.setAttribute("aria-pressed", String(isOn(d)));
    el.setAttribute("aria-label", `${d.name}, ${stateText(d)}`);
    el.innerHTML = `
      <span class="tile-ico">${ICONS.bulb}</span>
      <span class="more" data-more aria-hidden="true">${ICONS.more}</span>
      <span><div class="tile-name">${d.name}</div><div class="tile-state">${stateText(d)}</div></span>`;
  }
  renderSummary();
}

function renderSummary() {
  const on = DEVICES.filter(isOn).length;
  $("#summary").textContent = on ? `${on} luz${on > 1 ? "es" : ""} acesa${on > 1 ? "s" : ""}` : "Todas as luzes apagadas";
  document.querySelectorAll(".room").forEach((sec, i) => {
    const g = GROUPS.filter((g) => filter === "all" || filter === g.key)[i];
    if (!g) return;
    const n = DEVICES.filter((d) => d.group === g.key && isOn(d)).length;
    sec.querySelector("small").textContent = n ? `${n} acesa${n > 1 ? "s" : ""}` : "Apagado";
  });
}

function markPending(d, on) {
  document.getElementById(`t${d.id}`)?.classList.toggle("pending", on);
}

function setConn(kind, text) {
  $("#conn").className = `dot ${kind}`;
  $("#connText").textContent = text;
}

let toastTimer;
function toast(msg, err = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast show ${err ? "err" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2800);
}

// ---------- Painel (sheet) ----------
let current = null;
function openSheet(d) {
  current = d;
  $("#sheet").hidden = false;
  renderSheet();
  $("#slider").focus({ preventScroll: true });
}
function closeSheet() { $("#sheet").hidden = true; current = null; }

function renderSheet(previewLevel) {
  if (!current) return;
  const d = current, s = state[d.id];
  const lvl = previewLevel ?? s.level ?? 0;
  $("#sheetName").textContent = d.name;
  $("#sheetState").textContent = previewLevel !== undefined ? (lvl ? `${lvl}%` : "Desligado") : stateText(d);
  const ico = $("#sheetIco");
  ico.innerHTML = ICONS.bulb;
  ico.classList.toggle("lit", lvl > 0);
  const slider = $("#slider");
  slider.setAttribute("aria-valuenow", lvl);
  $("#sliderFill").style.height = `${lvl}%`;
  $("#sliderLabel").textContent = `${lvl}%`;
}

function sliderSetup() {
  const slider = $("#slider");
  let dragging = false, value = 0;
  const calc = (e) => {
    const r = slider.getBoundingClientRect();
    return Math.max(0, Math.min(100, Math.round(((r.bottom - e.clientY) / r.height) * 20) * 5));
  };
  slider.addEventListener("pointerdown", (e) => {
    if (!current) return;
    dragging = true; slider.setPointerCapture(e.pointerId); slider.classList.add("dragging");
    value = calc(e); renderSheet(value);
  });
  slider.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const v = calc(e);
    if (v !== value) { value = v; renderSheet(value); navigator.vibrate?.(4); }
  });
  const end = () => {
    if (!dragging) return;
    dragging = false; slider.classList.remove("dragging");
    if (current) setLevel(current, value);
  };
  slider.addEventListener("pointerup", end);
  slider.addEventListener("pointercancel", end);

  let kbTimer, kbValue = null;
  slider.addEventListener("keydown", (e) => {
    if (!current) return;
    const step = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 25, PageDown: -25 }[e.key];
    if (e.key === "Escape") return closeSheet();
    if (!step) return;
    e.preventDefault();
    kbValue = Math.max(0, Math.min(100, (kbValue ?? state[current.id].level ?? 0) + step));
    renderSheet(kbValue);
    clearTimeout(kbTimer);
    kbTimer = setTimeout(() => { setLevel(current, kbValue); kbValue = null; }, 350);
  });
}

// ---------- PIN ----------
function askPin() {
  $("#pinBox").hidden = false;
  $("#pinInput").focus();
}
$("#pinForm").addEventListener("submit", (e) => {
  e.preventDefault();
  pin = $("#pinInput").value.trim();
  store.set("hm.pin", pin);
  $("#pinBox").hidden = true;
  refresh();
});

// ---------- Eventos ----------
let pressTimer, longPressed = false;
const rooms = $("#rooms");
rooms.addEventListener("pointerdown", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  longPressed = false;
  pressTimer = setTimeout(() => {
    longPressed = true;
    navigator.vibrate?.(10);
    openSheet(DEVICES.find((d) => d.id == tile.dataset.id));
  }, 450);
});
["pointerup", "pointerleave", "pointercancel"].forEach((ev) => rooms.addEventListener(ev, () => clearTimeout(pressTimer)));
rooms.addEventListener("contextmenu", (e) => e.target.closest(".tile") && e.preventDefault());
rooms.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile || longPressed) return;
  const d = DEVICES.find((x) => x.id == tile.dataset.id);
  if (e.target.closest("[data-more]")) openSheet(d);
  else toggle(d);
});

$("#chips").addEventListener("click", (e) => {
  const c = e.target.closest("[data-filter]");
  if (!c) return;
  filter = c.dataset.filter;
  store.set("hm.filter", filter);
  renderAll();
});

$("#sheet").addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeSheet();
  const lv = e.target.closest("[data-level]");
  if (lv && current) setLevel(current, Number(lv.dataset.level));
});
document.addEventListener("keydown", (e) => e.key === "Escape" && !$("#sheet").hidden && closeSheet());

document.querySelectorAll("[data-scene]").forEach((b) =>
  b.addEventListener("click", async () => {
    const on = b.dataset.scene === "on";
    const targets = DEVICES.filter((d) => (filter === "all" || d.group === filter) && isOn(d) !== on);
    if (!targets.length) return toast(on ? "Já está tudo aceso" : "Já está tudo apagado");
    // Envia em sequência curta para não sobrecarregar a central
    for (let i = 0; i < targets.length; i += 3) {
      await Promise.all(targets.slice(i, i + 3).map((d) => setLevel(d, on ? state[d.id].last || 100 : 0)));
    }
    toast(on ? "Luzes acesas" : "Luzes apagadas");
  })
);

$("#refresh").addEventListener("click", () => refresh());
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refresh(true));

// ---------- Início ----------
sliderSetup();
renderAll();
(async () => {
  let needPin = false;
  if (!demo) {
    try {
      const h = await fetch("/api/health", { cache: "no-store" }).then((r) => r.json());
      needPin = h.pinRequired && !pin;
    } catch {
      demo = true; // sem backend (ex.: aberto como arquivo) -> demonstração
    }
  }
  if (demo) {
    setConn("demo", "Modo demonstração");
    DEVICES.forEach((d, i) => { if (state[d.id].level === null) state[d.id].level = [0, 80, 0, 100, 45][i % 5]; });
    renderAll();
    return;
  }
  if (needPin) askPin(); // refresh acontece após digitar o PIN
  else refresh(true);
  setInterval(() => document.visibilityState === "visible" && refresh(true), 60000);
})();
