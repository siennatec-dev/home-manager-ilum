// Lista de dispositivos de iluminação da Home Manager.
// Edite nomes/grupos à vontade — o "id" é o que vai na URL command.do?id=...
// type: "dimmer" (0..100 em passos de 5)

export const GROUPS = [
  { key: "sistemas", name: "Sistemas" },
  { key: "atendimento", name: "Atendimento" },
  { key: "expo", name: "Exposição" },
  { key: "destaques", name: "Destaques" },
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
  { id: 141, name: "Circuito 5",   type: "dimmer", group: "destaques" },
];
