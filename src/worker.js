// Cloudflare Worker: serve a interface (public/), faz proxy dos comandos para a
// Home Manager, guarda a configuração compartilhada (KV) e executa agendamentos.
import { DEVICES } from "../public/devices.js";
import { DEFAULT_CONFIG, LIGHT_ICONS, SCENE_ICONS } from "../public/config-defaults.js";
import { sunTimes } from "../public/sun.js";

export { DEFAULT_CONFIG };
const BY_ID = new Map(DEVICES.map((d) => [String(d.id), d]));
const TZ = "America/Sao_Paulo";

// ---------- utilidades ----------
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
const str = (v, max = 40) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);
const step5 = (n) => Math.max(0, Math.min(100, Math.round(Number(n) / 5) * 5));
const slug = (s) => str(s, 40).toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "x";

// Dimmer: 0..100 em passos de 5, INV ou ? (consulta)
function validValue(v) {
  if (v === "?" || v === "INV") return true;
  if (!/^\d{1,3}$/.test(v)) return false;
  const n = Number(v);
  return n <= 100 && n % 5 === 0;
}

function toLevel(v) {
  const s = String(v).trim();
  if (/^(OFF|DESLIGADO|false)$/i.test(s)) return 0;
  if (/^(ON|LIGADO|true)$/i.test(s)) return 100;
  if (/^\d{1,3}(\.\d+)?$/.test(s) && Number(s) <= 100) return Math.round(Number(s));
  return null;
}

// Interpreta a resposta do "?". A Home Manager responde "ID:57|STATUS:80".
export function parseState(text, id) {
  const t = String(text || "").replace(/<[^>]*>/g, " ").trim();
  const hm = /\bSTATUS\s*:\s*([A-Za-z0-9.]+)/i.exec(t);
  if (hm && toLevel(hm[1]) !== null) return { level: toLevel(hm[1]) };
  const keyed = /\b(valor|value|status|estado|state|nivel|level|dimmer)\b\s*["']?\s*[:=]\s*["']?\s*([A-Za-z0-9.]+)/i.exec(t);
  if (keyed) {
    const lv = toLevel(keyed[2]);
    if (lv !== null) return { level: lv };
  }
  if (/\bOFF\b|desligad/i.test(t)) return { level: 0 };
  let rest = t.replace(new RegExp(`\\bid\\b\\s*["']?\\s*[:=]\\s*["']?\\s*${id}\\b`, "gi"), " ");
  if (rest === t) rest = t.replace(new RegExp(`(^|[^\\d])${id}(?!\\d)`), "$1 ");
  const num = /(?:^|[^\d])(\d{1,3})(?:[^\d]|$)/.exec(rest);
  if (num && Number(num[1]) <= 100) return { level: Number(num[1]) };
  if (/\bON\b|ligad/i.test(t)) return { level: 100 };
  return { level: null };
}

async function sendToHM(env, id, valor) {
  const base = (env.HM_BASE || "").replace(/\/+$/, "");
  const url = `${base}/HomeWeb/command.do?id=${encodeURIComponent(id)}&valor=${encodeURIComponent(valor)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "hm-iluminacao" } });
  const body = (await res.text()).slice(0, 2000);
  return { ok: res.ok, status: res.status, body };
}

// Executa tarefas com no máximo `n` em paralelo
async function pool(items, n, fn) {
  const queue = [...items];
  const run = async () => {
    for (let it = queue.shift(); it !== undefined; it = queue.shift()) await fn(it);
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

async function pinOk(request, env) {
  if (!env.APP_PIN) return true;
  const given = new TextEncoder().encode(request.headers.get("x-app-pin") || "");
  const want = new TextEncoder().encode(env.APP_PIN);
  if (given.byteLength !== want.byteLength) return false;
  return crypto.subtle.timingSafeEqual(given, want);
}

// ---------- configuração (KV) ----------
export function sanitizeConfig(input) {
  const c = input && typeof input === "object" ? input : {};
  const rooms = (Array.isArray(c.rooms) ? c.rooms : DEFAULT_CONFIG.rooms)
    .slice(0, 20)
    .map((r) => ({ key: slug(r.key || r.name), name: str(r.name, 30) || "Ambiente" }))
    .filter((r, i, a) => a.findIndex((x) => x.key === r.key) === i);
  if (!rooms.length) rooms.push(...DEFAULT_CONFIG.rooms);
  const roomKeys = new Set(rooms.map((r) => r.key));

  const lights = {};
  for (const [id, o] of Object.entries(c.lights || {})) {
    if (!BY_ID.has(id) || !o || typeof o !== "object") continue;
    const l = {};
    if (o.name) l.name = str(o.name, 30);
    if (LIGHT_ICONS.includes(o.icon)) l.icon = o.icon;
    if (roomKeys.has(o.room)) l.room = o.room;
    if (o.fav) l.fav = true;
    if (Number.isFinite(o.order)) l.order = Math.trunc(o.order);
    lights[id] = l;
  }

  const levelsOf = (lv) => {
    const out = {};
    for (const [id, v] of Object.entries(lv || {})) if (BY_ID.has(id)) out[id] = step5(v);
    return out;
  };
  const scenes = (Array.isArray(c.scenes) ? c.scenes : [])
    .slice(0, 30)
    .map((s) => ({
      id: slug(s.id || s.name),
      name: str(s.name, 30) || "Cena",
      icon: SCENE_ICONS.includes(s.icon) ? s.icon : "sparkle",
      levels: levelsOf(s.levels),
    }))
    .filter((s, i, a) => Object.keys(s.levels).length && a.findIndex((x) => x.id === s.id) === i);
  const sceneIds = new Set(scenes.map((s) => s.id));

  const schedules = (Array.isArray(c.schedules) ? c.schedules : [])
    .slice(0, 30)
    .map((s) => ({
      id: slug(s.id || crypto.randomUUID()),
      scene: str(s.scene, 40),
      at: ["time", "sunrise", "sunset"].includes(s.at) ? s.at : "time",
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time) ? s.time : "08:00",
      offset: Math.max(-180, Math.min(180, Math.trunc(Number(s.offset) || 0))),
      days: [...new Set((Array.isArray(s.days) ? s.days : []).map(Number).filter((d) => d >= 0 && d <= 6))].sort(),
      enabled: s.enabled !== false,
    }))
    .filter((s) => sceneIds.has(s.scene) && s.days.length);

  let location = null;
  if (c.location && Number.isFinite(+c.location.lat) && Number.isFinite(+c.location.lon)) {
    const lat = +c.location.lat, lon = +c.location.lon;
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) location = { lat: +lat.toFixed(3), lon: +lon.toFixed(3) };
  }
  return { version: 1, rooms, lights, scenes, schedules, location };
}

async function loadConfig(env) {
  if (!env.CONFIG) return structuredClone(DEFAULT_CONFIG);
  const saved = await env.CONFIG.get("config", "json");
  return saved ? sanitizeConfig(saved) : structuredClone(DEFAULT_CONFIG);
}

async function addLog(env, entry) {
  if (!env.CONFIG) return;
  const log = (await env.CONFIG.get("log", "json")) || [];
  log.unshift({ t: Date.now(), ...entry });
  await env.CONFIG.put("log", JSON.stringify(log.slice(0, 30)));
}

async function applyScene(env, scene) {
  let ok = 0, fail = 0;
  await pool(Object.entries(scene.levels), 5, async ([id, lv]) => {
    try {
      const r = await sendToHM(env, id, String(lv));
      r.ok ? ok++ : fail++;
    } catch {
      fail++;
    }
  });
  return { ok, fail };
}

// ---------- agendamentos ----------
export function localNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
    }).formatToParts(date).map((p) => [p.type, p.value])
  );
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { dow, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

// Minuto do dia (horário de Brasília) em que o agendamento deve rodar hoje
export function scheduleMinute(s, location, date = new Date()) {
  if (s.at === "time") {
    const [h, m] = s.time.split(":").map(Number);
    return h * 60 + m;
  }
  if (!location) return null;
  const sun = sunTimes(date, location.lat, location.lon);
  const t = s.at === "sunrise" ? sun.sunrise : sun.sunset;
  if (!t) return null;
  return (localNow(t).minutes + s.offset + 1440) % 1440;
}

export async function runSchedules(env, now = new Date()) {
  const cfg = await loadConfig(env);
  const { dow, minutes } = localNow(now);
  for (const s of cfg.schedules) {
    if (!s.enabled || !s.days.includes(dow)) continue;
    if (scheduleMinute(s, cfg.location, now) !== minutes) continue;
    const scene = cfg.scenes.find((x) => x.id === s.scene);
    if (!scene) continue;
    const r = await applyScene(env, scene);
    await addLog(env, { kind: "agenda", scene: scene.name, ...r });
  }
}

// ---------- API ----------
async function handleApi(request, env, url) {
  if (url.pathname === "/api/health") {
    return json({ ok: true, pinRequired: Boolean(env.APP_PIN), storage: Boolean(env.CONFIG) });
  }
  if (!(await pinOk(request, env))) return json({ ok: false, error: "PIN inválido" }, 401);

  if (url.pathname === "/api/command") {
    const id = url.searchParams.get("id") || "";
    const valor = (url.searchParams.get("valor") || "").trim();
    if (!BY_ID.has(id)) return json({ ok: false, error: "Dispositivo não permitido" }, 400);
    if (!validValue(valor)) return json({ ok: false, error: "Valor inválido" }, 400);
    try {
      const r = await sendToHM(env, id, valor);
      return json({ ...r, state: parseState(r.body, id) }, r.ok ? 200 : 502);
    } catch (e) {
      return json({ ok: false, error: `Sem resposta da automação (${e.name})` }, 504);
    }
  }

  if (url.pathname === "/api/status") {
    const out = {};
    await pool(DEVICES, 8, async (d) => {
      try {
        const r = await sendToHM(env, d.id, "?");
        out[d.id] = r.ok ? { ...parseState(r.body, d.id), raw: r.body.slice(0, 160) } : { level: null, raw: `HTTP ${r.status}` };
      } catch {
        out[d.id] = { level: null };
      }
    });
    return json({ ok: true, states: out });
  }

  if (url.pathname === "/api/config") {
    if (request.method === "GET") return json({ ok: true, config: await loadConfig(env), storage: Boolean(env.CONFIG) });
    if (request.method === "PUT") {
      if (!env.CONFIG) return json({ ok: false, error: "Armazenamento (KV) não configurado" }, 500);
      const body = await request.json().catch(() => null);
      if (!body) return json({ ok: false, error: "JSON inválido" }, 400);
      const cfg = sanitizeConfig(body);
      await env.CONFIG.put("config", JSON.stringify(cfg));
      return json({ ok: true, config: cfg });
    }
  }

  if (url.pathname === "/api/scene" && request.method === "POST") {
    const cfg = await loadConfig(env);
    const scene = cfg.scenes.find((s) => s.id === url.searchParams.get("id"));
    if (!scene) return json({ ok: false, error: "Cena não encontrada" }, 404);
    const r = await applyScene(env, scene);
    await addLog(env, { kind: "cena", scene: scene.name, ...r });
    return json({ ok: r.fail === 0, ...r, levels: scene.levels, error: r.fail ? `${r.fail} luz(es) não responderam` : undefined });
  }

  if (url.pathname === "/api/log") {
    return json({ ok: true, log: env.CONFIG ? (await env.CONFIG.get("log", "json")) || [] : [] });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runSchedules(env, new Date(controller.scheduledTime)));
  },
};
