// Placeholder data container for runtime-loaded content
const CAMPAIGNS = [];
const PLAYERS = [];
const ACTIVITY = [];
const CHARACTER = {
  name: "",
  player: "",
  race: "",
  class: "",
  subclass: "",
  background: "",
  alignment: "",
  level: 0,
  xp: 0,
  xpNext: 1,
  hp: 0,
  hpMax: 0,
  hpTemp: 0,
  ac: 0,
  speed: 0,
  init: 0,
  prof: 0,
  inspiration: false,
  hitDice: "",
  deathSaves: { s: 0, f: 0 },
  abilities: [],
  skills: [],
  attacks: [],
  spellSlots: [],
  spells: [],
  features: [],
  inventory: [],
  money: { pc: 0, pp: 0, po: 0, pe: 0, pl: 0 },
  notes: "",
};
const QUICK_DICE = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
const COMPENDIUM = [];
window.MOCK = { CAMPAIGNS, PLAYERS, ACTIVITY, CHARACTER, QUICK_DICE, COMPENDIUM };
