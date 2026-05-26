const DEFAULT_CHARACTER = {
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
const DEFAULT_STORE = {
  CAMPAIGNS: [],
  PLAYERS: [],
  ACTIVITY: [],
  CHARACTER: { ...DEFAULT_CHARACTER },
  QUICK_DICE: ["d4", "d6", "d8", "d10", "d12", "d20", "d100"],
  COMPENDIUM: [],
  NOTES: [],
};

function loadAppStore() {
  const user = window.Auth?.getCurrentUser?.();
  const store = {
    CAMPAIGNS: Array.isArray(user?.campaigns) ? user.campaigns : Array.isArray(user?.CAMPAIGNS) ? user.CAMPAIGNS : [],
    PLAYERS: Array.isArray(user?.players) ? user.players : Array.isArray(user?.PLAYERS) ? user.PLAYERS : [],
    ACTIVITY: Array.isArray(user?.activity) ? user.activity : Array.isArray(user?.ACTIVITY) ? user.ACTIVITY : [],
    CHARACTER: user?.character ? { ...DEFAULT_CHARACTER, ...user.character } : user?.CHARACTER ? { ...DEFAULT_CHARACTER, ...user.CHARACTER } : { ...DEFAULT_CHARACTER },
    QUICK_DICE: DEFAULT_STORE.QUICK_DICE,
    COMPENDIUM: Array.isArray(user?.compendium) ? user.compendium : Array.isArray(user?.COMPENDIUM) ? user.COMPENDIUM : [],
    NOTES: Array.isArray(user?.notes) ? user.notes : Array.isArray(user?.NOTES) ? user.NOTES : [],
  };
  window.MOCK = store;
  return store;
}

function saveAppStore(patch) {
  if (!window.Auth || typeof window.Auth.updateCurrentUser !== "function") {
    return { ok: false, msg: "Auth não disponível." };
  }
  const currentUser = window.Auth.getCurrentUser?.();
  if (!currentUser) return { ok: false, msg: "Sem sessão." };

  const normalizedPatch = { ...patch };
  if (patch.CAMPAIGNS !== undefined) normalizedPatch.campaigns = patch.CAMPAIGNS;
  if (patch.PLAYERS !== undefined) normalizedPatch.players = patch.PLAYERS;
  if (patch.ACTIVITY !== undefined) normalizedPatch.activity = patch.ACTIVITY;
  if (patch.CHARACTER !== undefined) normalizedPatch.character = patch.CHARACTER;
  if (patch.COMPENDIUM !== undefined) normalizedPatch.compendium = patch.COMPENDIUM;
  if (patch.NOTES !== undefined) normalizedPatch.notes = patch.NOTES;

  const result = window.Auth.updateCurrentUser(normalizedPatch);
  if (!result || !result.ok) return result || { ok: false, msg: "Erro ao salvar dados." };

  loadAppStore();
  window.dispatchEvent(new Event("vg:appdata-update"));
  return { ok: true, data: window.MOCK };
}

function createDefaultCampaign(name, patch = {}) {
  const owner = window.Auth?.getCurrentUser?.()?.apelido || "Mestre";
  return {
    id: "c_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name: name || "Nova Campanha",
    dm: owner,
    status: patch.status || "ativa",
    setting: patch.setting || "Mundo de Vasteria",
    summary: patch.summary || "Uma nova aventura começa.",
    cover: patch.cover || "linear-gradient(135deg, rgba(157,123,216,0.45), rgba(218,162,90,0.15))",
    level: "Nível 1",
    players: 0,
    sessions: [],
    nextSession: "Sem data",
    progress: 0,
    tags: ["fantasia", "aventura"],
    system: patch.system || "D&D 5E",
    accent: "var(--t-accent)",
  };
}

function createDefaultCharacter(name, patch = {}) {
  const player = window.Auth?.getCurrentUser?.()?.apelido || "Jogador";
  const characterName = (name || "Novo Herói").trim() || "Novo Herói";
  const level = Math.max(1, Math.min(20, parseInt(patch.level) || 1));
  return {
    name: characterName,
    player,
    race: patch.race || "Humano",
    class: patch.class || "Guerreiro",
    subclass: patch.subclass || "Escolhido",
    background: patch.background || "Errante",
    alignment: patch.alignment || "Neutro",
    level,
    xp: 0,
    xpNext: 100,
    hp: 12,
    hpMax: 12,
    hpTemp: 0,
    ac: 15,
    speed: 30,
    init: 2,
    prof: 2,
    inspiration: false,
    hitDice: "1d10",
    deathSaves: { s: 0, f: 0 },
    abilities: [
      { name: "Força", mod: 2 },
      { name: "Destreza", mod: 1 },
      { name: "Constituição", mod: 2 },
      { name: "Inteligência", mod: 0 },
      { name: "Sabedoria", mod: 0 },
      { name: "Carisma", mod: 1 },
    ],
    skills: [
      { name: "Atletismo", abil: "For", mod: 2, prof: true },
      { name: "Percepção", abil: "Sab", mod: 0, prof: false },
    ],
    attacks: [],
    spellSlots: [],
    spells: [],
    features: [],
    inventory: [],
    money: { pc: 0, pp: 0, po: 0, pe: 0, pl: 0 },
    notes: "",
  };
}

function createDefaultNote(fields = {}) {
  const body = (fields.body || "").trim();
  return {
    id: "n_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    title: (fields.title || "Nova nota").trim(),
    body,
    excerpt: body.slice(0, 120),
    category: fields.category || "Sessão",
    color: fields.color || "var(--t-accent)",
    tags: Array.isArray(fields.tags) ? fields.tags : [],
    visibility: fields.visibility || "privado",
    campaign: fields.campaign || "",
    pinned: false,
    updated: new Date().toLocaleDateString("pt-BR"),
  };
}

window.AppData = {
  load: loadAppStore,
  save: saveAppStore,
  update(key, value) {
    return saveAppStore({ [key]: value });
  },
  createCampaign(name, patch = {}) {
    const current = loadAppStore();
    const campaign = createDefaultCampaign(name, patch);
    const res = saveAppStore({ campaigns: [...current.CAMPAIGNS, campaign] });
    return { ...res, campaign };
  },
  createCharacter(name, patch = {}) {
    const character = createDefaultCharacter(name, patch);
    const res = saveAppStore({ character });
    return { ...res, character };
  },
  createNote(fields) {
    const current = loadAppStore();
    const note = createDefaultNote(fields);
    const res = saveAppStore({ notes: [...current.NOTES, note] });
    return { ...res, note };
  },
  updateNote(id, patch) {
    const current = loadAppStore();
    const body = patch.body !== undefined ? (patch.body || "").trim() : undefined;
    const notes = current.NOTES.map(n => n.id !== id ? n : {
      ...n,
      ...patch,
      ...(body !== undefined ? { body, excerpt: body.slice(0, 120) } : {}),
      updated: new Date().toLocaleDateString("pt-BR"),
    });
    return saveAppStore({ notes });
  },
  deleteNote(id) {
    const current = loadAppStore();
    return saveAppStore({ notes: current.NOTES.filter(n => n.id !== id) });
  },
  refresh() {
    loadAppStore();
    window.dispatchEvent(new Event("vg:appdata-update"));
  },
};

function useAppMock() {
  const [store, setStore] = React.useState(loadAppStore());
  React.useEffect(() => {
    const handler = () => setStore(loadAppStore());
    window.addEventListener("vg:appdata-update", handler);
    return () => window.removeEventListener("vg:appdata-update", handler);
  }, []);
  return store;
}

const CAMPAIGNS = DEFAULT_STORE.CAMPAIGNS;
const PLAYERS = DEFAULT_STORE.PLAYERS;
const ACTIVITY = DEFAULT_STORE.ACTIVITY;
const CHARACTER = DEFAULT_STORE.CHARACTER;
const QUICK_DICE = DEFAULT_STORE.QUICK_DICE;
const COMPENDIUM = DEFAULT_STORE.COMPENDIUM;
loadAppStore();
window.useAppMock = useAppMock;
window.createDefaultCharacter = createDefaultCharacter;
window.createDefaultCampaign = createDefaultCampaign;
