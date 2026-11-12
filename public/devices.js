// Lista de dispositivos de iluminação da Home Manager.
// Edite nomes/grupos à vontade — o "id" é o que vai na URL command.do?id=...
// type: "dimmer" (0..100 em passos de 5) | "rgb" (nível_cor, ex: 50_r)

export const GROUPS = [
  { key: "sistemas", name: "Sistemas" },
  { key: "atendimento", name: "Atendimento" },
  { key: "expo", name: "Exposição" },
  { key: "destaques", name: "Destaques & LED" },
];

export const DEVICES = [
  { id: 57,  name: "Sistema 01",   type: "dimmer", group: "sistemas" },
  { id: 54,  name: "Sistema 02",   type: "dimmer", group: "sistemas" },
  { id: 234, name: "Magna Aura",   type: "dimmer", group: "sistemas" },

  { id: 40,  name: "CX Torres",    type: "dimmer", group: "atendimento" },
  { id: 41,  name: "CX Central",   type: "dimmer", group: "atendimento" },
  { id: 55,  name: "Atendimento",  type: "dimmer", group: "atendimento" },
  { id: 58,  name: "Ilha",         type: "dimmer", group: "atendimento" },
  { id: 89,  name: "LED Ilha",     type: "dimmer", group: "atendimento" },

  { id: 56,  name: "Expo Vazado",  type: "dimmer", group: "expo" },
  { id: 61,  name: "Expo Central", type: "dimmer", group: "expo" },
  { id: 60,  name: "Expo Lateral", type: "dimmer", group: "expo" },
  { id: 67,  name: "LED Expo",     type: "dimmer", group: "expo" },

  { id: 59,  name: "Logo",         type: "dimmer", group: "destaques" },
  { id: 90,  name: "LED Painel",   type: "dimmer", group: "destaques" },
  { id: 98,  name: "Quadro Aut.",  type: "rgb",    group: "destaques" },
  { id: 94,  name: "RGB 1",        type: "rgb",    group: "destaques" },
  { id: 95,  name: "RGB 2",        type: "rgb",    group: "destaques" },
  { id: 96,  name: "RGB 3",        type: "rgb",    group: "destaques" },
  { id: 97,  name: "RGB 4",        type: "rgb",    group: "destaques" },
  { id: 141, name: "Circuito 5",   type: "dimmer", group: "destaques" },
];

// Cores aceitas pelo comando RGB (letra -> nome, cor de exibição)
export const COLORS = [
  { k: "w", name: "Branco",    hex: "#ffffff" },
  { k: "r", name: "Vermelho",  hex: "#ff3b30" },
  { k: "n", name: "Laranja",   hex: "#ff9f0a" },
  { k: "y", name: "Amarelo",   hex: "#ffd60a" },
  { k: "l", name: "Limão",     hex: "#c8f53d" },
  { k: "g", name: "Verde",     hex: "#34c759" },
  { k: "e", name: "Esmeralda", hex: "#00c389" },
  { k: "c", name: "Ciano",     hex: "#64d2ff" },
  { k: "h", name: "Celeste",   hex: "#8fc8ff" },
  { k: "b", name: "Azul",      hex: "#0a84ff" },
  { k: "u", name: "Roxo",      hex: "#9b5cff" },
  { k: "m", name: "Magenta",   hex: "#ff2dd1" },
  { k: "p", name: "Rosa",      hex: "#ff6fae" },
];
