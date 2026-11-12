// Cloudflare Worker: serve a interface (public/) e faz proxy dos comandos
// para o servidor HTTP da Home Manager, evitando bloqueio de CORS / mixed content.
import { DEVICES } from "../public/devices.js";

const BY_ID = new Map(DEVICES.map((d) => [String(d.id), d]));

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

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

// Interpreta a resposta do "?". A central repete o id na resposta, então
// primeiro procura um campo de valor (valor=, "valor":, status...) e, se não
// houver, descarta o id antes de procurar o número.
export function parseState(text, id) {
  const t = String(text || "").replace(/<[^>]*>/g, " ").trim();
  // Formato da Home Manager: "ID:57|STATUS:80"
  const hm = /\bSTATUS\s*:\s*([A-Za-z0-9.]+)/i.exec(t);
  if (hm && toLevel(hm[1]) !== null) return { level: toLevel(hm[1]) };
  const keyed = /\b(valor|value|status|estado|state|nivel|level|dimmer)\b\s*["']?\s*[:=]\s*["']?\s*([A-Za-z0-9.]+)/i.exec(t);
  if (keyed) {
    const lv = toLevel(keyed[2]);
    if (lv !== null) return { level: lv };
  }
  if (/\bOFF\b|desligad/i.test(t)) return { level: 0 };
  // remove "id=57" / "id":57 e depois a primeira ocorrência solta do id
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

async function pinOk(request, env) {
  if (!env.APP_PIN) return true;
  const given = new TextEncoder().encode(request.headers.get("x-app-pin") || "");
  const want = new TextEncoder().encode(env.APP_PIN);
  if (given.byteLength !== want.byteLength) return false;
  return crypto.subtle.timingSafeEqual(given, want);
}

async function handleApi(request, env, url) {
  if (url.pathname === "/api/health") {
    return json({ ok: true, pinRequired: Boolean(env.APP_PIN) });
  }
  if (!(await pinOk(request, env))) return json({ ok: false, error: "PIN inválido" }, 401);

  if (url.pathname === "/api/command") {
    const id = url.searchParams.get("id") || "";
    const valor = (url.searchParams.get("valor") || "").trim();
    const device = BY_ID.get(id);
    if (!device) return json({ ok: false, error: "Dispositivo não permitido" }, 400);
    if (!validValue(valor)) return json({ ok: false, error: "Valor inválido" }, 400);
    try {
      const r = await sendToHM(env, id, valor);
      return json({ ...r, state: parseState(r.body, id) }, r.ok ? 200 : 502);
    } catch (e) {
      return json({ ok: false, error: `Sem resposta da automação (${e.name})` }, 504);
    }
  }

  if (url.pathname === "/api/status") {
    // Consulta "?" de todos os dispositivos, 5 por vez para não sobrecarregar a central
    const out = {};
    const queue = [...DEVICES];
    const worker = async () => {
      for (let d = queue.shift(); d; d = queue.shift()) {
        try {
          const r = await sendToHM(env, d.id, "?");
          out[d.id] = r.ok ? { ...parseState(r.body, d.id), raw: r.body.slice(0, 160) } : { level: null, raw: `HTTP ${r.status}` };
        } catch {
          out[d.id] = { level: null };
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker()]);
    return json({ ok: true, states: out });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
