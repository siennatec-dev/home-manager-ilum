// Lista de dispositivos de iluminação da Home Manager.
// Edite nomes/grupos à vontade — o "id" é o que vai na URL command.do?id=...
// type: "dimmer" (0..100 em passos de 5) · icon: ícone padrão (personalizável no app)

export const GROUPS = [
  { key: "sistemas", name: "Sistemas" },
  { key: "atendimento", name: "Atendimento" },
  { key: "expo", name: "Exposição" },
  { key: "destaques", name: "Destaques" },
];

export const DEVICES = [
  { id: 57,  name: "Sistema 01",   type: "dimmer", group: "sistemas", icon: "spot" },
  { id: 54,  name: "Sistema 02",   type: "dimmer", group: "sistemas", icon: "spot" },
  { id: 234, name: "Magna Aura",   type: "dimmer", group: "sistemas", icon: "chandelier" },

  { id: 40,  name: "CX Torres",    type: "dimmer", group: "atendimento", icon: "pendant" },
  { id: 41,  name: "CX Central",   type: "dimmer", group: "atendimento", icon: "pendant" },
  { id: 55,  name: "Atendimento",  type: "dimmer", group: "atendimento", icon: "spot" },
  { id: 58,  name: "Ilha",         type: "dimmer", group: "atendimento", icon: "pendant" },
  { id: 89,  name: "LED Ilha",     type: "dimmer", group: "atendimento", icon: "strip" },

  { id: 56,  name: "Expo Vazado",  type: "dimmer", group: "expo", icon: "spot" },
  { id: 61,  name: "Expo Central", type: "dimmer", group: "expo", icon: "spot" },
  { id: 60,  name: "Expo Lateral", type: "dimmer", group: "expo", icon: "spot" },
  { id: 67,  name: "LED Expo",     type: "dimmer", group: "expo", icon: "strip" },

  { id: 59,  name: "Logo",         type: "dimmer", group: "destaques", icon: "sign" },
  { id: 90,  name: "LED Painel",   type: "dimmer", group: "destaques", icon: "panel" },
  { id: 141, name: "Circuito 5",   type: "dimmer", group: "destaques", icon: "bulb" },
];
