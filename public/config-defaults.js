// Configuração inicial (antes de qualquer personalização salva no app)
import { DEVICES, GROUPS } from "./devices.js";

const allLevels = (lv) =>
  Object.fromEntries(DEVICES.map((d) => [d.id, typeof lv === "function" ? lv(d) : lv]));

export const DEFAULT_CONFIG = {
  version: 1,
  rooms: GROUPS.map((g) => ({ ...g })),
  lights: {}, // personalização por id: { name, icon, room, fav }
  scenes: [
    { id: "abertura", name: "Abertura", icon: "store", levels: allLevels(100) },
    { id: "vitrine", name: "Vitrine", icon: "sparkle", levels: allLevels((d) => (["expo", "destaques"].includes(d.group) ? 100 : 30)) },
    { id: "meia-luz", name: "Meia-luz", icon: "half", levels: allLevels(40) },
    { id: "fechamento", name: "Fechamento", icon: "lock", levels: allLevels(0) },
  ],
  schedules: [],
  location: null, // { lat, lon } para agendamentos no nascer/pôr do sol
};

export const LIGHT_ICONS = ["bulb", "spot", "pendant", "strip", "sign", "chandelier", "lamp", "panel", "star"];
export const SCENE_ICONS = ["store", "sparkle", "sun", "half", "moon", "lock", "coffee", "users", "eye", "star"];
