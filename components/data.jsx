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
  const userCompendium = Array.isArray(user?.compendium) ? user.compendium
    : Array.isArray(user?.COMPENDIUM) ? user.COMPENDIUM : [];
  const userIds = new Set(userCompendium.map(e => e.id));
  const store = {
    CAMPAIGNS: Array.isArray(user?.campaigns) ? user.campaigns : Array.isArray(user?.CAMPAIGNS) ? user.CAMPAIGNS : [],
    PLAYERS: Array.isArray(user?.players) ? user.players : Array.isArray(user?.PLAYERS) ? user.PLAYERS : [],
    ACTIVITY: Array.isArray(user?.activity) ? user.activity : Array.isArray(user?.ACTIVITY) ? user.ACTIVITY : [],
    CHARACTER: user?.character ? { ...DEFAULT_CHARACTER, ...user.character } : user?.CHARACTER ? { ...DEFAULT_CHARACTER, ...user.CHARACTER } : { ...DEFAULT_CHARACTER },
    QUICK_DICE: DEFAULT_STORE.QUICK_DICE,
    COMPENDIUM: [...MOCK_COMPENDIUM_SPELLS.filter(e => !userIds.has(e.id)), ...userCompendium],
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

const MOCK_SPELL_LISTS = [
  // Lv 0 — Truques
  [
    { name: "Prestidigitação", prepared: true },
    { name: "Luz", prepared: true },
    { name: "Chamas Sagradas", prepared: true },
    { name: "Toque Gelado", prepared: true },
    { name: "Raio de Gelo", prepared: true },
    { name: "Taumaturgia", prepared: true },
    { name: "Explosão Eldritch", prepared: true },
    { name: "Orientação", prepared: true },
    { name: "Produzir Chama", prepared: true },
    { name: "Druidcraft", prepared: true },
  ],
  // Lv 1
  [
    { name: "Míssil Mágico", prepared: true },
    { name: "Escudo", prepared: true },
    { name: "Sono", prepared: false },
    { name: "Bênção", prepared: true },
    { name: "Cura de Ferimentos", prepared: true },
    { name: "Identificar", prepared: false },
    { name: "Armadura Mágica", prepared: true },
    { name: "Comando", prepared: false },
    { name: "Queda Leve", prepared: false },
    { name: "Absorver Elementos", prepared: false },
  ],
  // Lv 2
  [
    { name: "Invisibilidade", prepared: true },
    { name: "Teia", prepared: true },
    { name: "Sugestão", prepared: false },
    { name: "Levitação", prepared: true },
    { name: "Imagem Espelhada", prepared: true },
    { name: "Raio Ardente", prepared: false },
    { name: "Escuridão", prepared: false },
    { name: "Silêncio", prepared: true },
    { name: "Força do Touro", prepared: false },
    { name: "Detectar Pensamentos", prepared: false },
  ],
  // Lv 3
  [
    { name: "Bola de Fogo", prepared: true },
    { name: "Relâmpago", prepared: true },
    { name: "Voo", prepared: true },
    { name: "Contrafeitiço", prepared: false },
    { name: "Ressurreição Menor", prepared: true },
    { name: "Dissipar Magia", prepared: false },
    { name: "Luz do Dia", prepared: false },
    { name: "Falar com Mortos", prepared: false },
    { name: "Forma de Névoa", prepared: false },
    { name: "Pisca-Desloca", prepared: false },
  ],
  // Lv 4
  [
    { name: "Banimento", prepared: true },
    { name: "Polimorfismo", prepared: true },
    { name: "Pele de Pedra", prepared: false },
    { name: "Ilusão Maior", prepared: false },
    { name: "Porta Dimensional", prepared: true },
    { name: "Guardar Feitiço", prepared: false },
    { name: "Morte Falsa", prepared: false },
    { name: "Liberdade de Movimento", prepared: false },
    { name: "Confusão", prepared: false },
    { name: "Criar Alimento e Água", prepared: false },
  ],
  // Lv 5
  [
    { name: "Telecinese", prepared: true },
    { name: "Ressurreição", prepared: true },
    { name: "Cura em Massa", prepared: true },
    { name: "Cone de Frio", prepared: false },
    { name: "Dominação de Pessoa", prepared: false },
    { name: "Transmutação de Pedra", prepared: false },
    { name: "Prisão Mental", prepared: false },
    { name: "Nuvem de Morte", prepared: false },
    { name: "Animar Objetos", prepared: false },
    { name: "Contato com Outros Planos", prepared: false },
  ],
  // Lv 6
  [
    { name: "Desintegrar", prepared: true },
    { name: "Cadeia de Relâmpagos", prepared: true },
    { name: "Visão Verdadeira", prepared: false },
    { name: "Criar Mortos-Vivos", prepared: false },
    { name: "Fome de Hadar", prepared: false },
    { name: "Globo de Invulnerabilidade", prepared: false },
    { name: "Mover Terra", prepared: false },
    { name: "Dispersão de Magia em Massa", prepared: false },
    { name: "Sunbeam", prepared: false },
    { name: "Verdadeira Visão", prepared: false },
  ],
  // Lv 7
  [
    { name: "Teleporte", prepared: true },
    { name: "Forma Etérea", prepared: false },
    { name: "Dedos da Morte", prepared: false },
    { name: "Mão Arcana", prepared: false },
    { name: "Prisão Etérea", prepared: false },
    { name: "Ressurreição Plena", prepared: true },
    { name: "Reverso da Gravidade", prepared: false },
    { name: "Símbolo", prepared: false },
    { name: "Visão Remota", prepared: false },
    { name: "Tempestade de Fogo", prepared: false },
  ],
  // Lv 8
  [
    { name: "Dominação de Monstro", prepared: true },
    { name: "Terremoto", prepared: false },
    { name: "Explosão Solar", prepared: false },
    { name: "Labirinto", prepared: false },
    { name: "Mente em Branco", prepared: false },
    { name: "Clonar", prepared: false },
    { name: "Antimagia", prepared: false },
    { name: "Controle do Clima", prepared: false },
    { name: "Raiva da Natureza", prepared: false },
    { name: "Espada Relâmpago", prepared: false },
  ],
  // Lv 9
  [
    { name: "Desejo", prepared: true },
    { name: "Parar o Tempo", prepared: false },
    { name: "Tempestade de Vingança", prepared: false },
    { name: "Verdadeira Ressurreição", prepared: true },
    { name: "Portal", prepared: false },
    { name: "Metamorfose", prepared: false },
    { name: "Voo em Massa", prepared: false },
    { name: "Projeção Astral", prepared: false },
    { name: "Palavra do Poder: Matar", prepared: false },
    { name: "Prisão de Força", prepared: false },
  ],
];

const MOCK_COMPENDIUM_SPELLS = MOCK_SPELL_LISTS.flatMap((level, lv) =>
  level.map(sp => ({
    id: "mock_" + sp.name.toLowerCase().replace(/\s+/g, "_"),
    type: "Magia",
    name: sp.name,
    lvl: lv === 0 ? "Truque" : `Nível ${lv}`,
    school: ["Evocação","Transmutação","Ilusão","Conjuração","Necromancia","Adivinhação","Encantamento","Abjuração"][lv % 8],
    cast: lv === 0 ? "1 ação" : lv <= 3 ? "1 ação" : "1 ação (ritual)",
    range: ["Toque","9 metros","18 metros","30 metros","60 metros","90 metros","150 metros","À vista","Ilimitado","Qualquer plano"][lv],
    duration: lv === 0 ? "Instantânea" : lv <= 2 ? "Concentração, 1 minuto" : lv <= 5 ? "Concentração, 10 minutos" : "Concentração, 1 hora",
    desc: `${sp.name} é uma magia de ${lv === 0 ? "truque" : `nível ${lv}`} da escola de ${ ["Evocação","Transmutação","Ilusão","Conjuração","Necromancia","Adivinhação","Encantamento","Abjuração"][lv % 8] }. Consulte o livro de regras para detalhes completos.`,
  }))
);

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
  injectMockSpells() {
    const current = loadAppStore();
    const character = {
      ...current.CHARACTER,
      spellLists: MOCK_SPELL_LISTS,
      spellcastingClass: "Mago, Clérigo",
      spellcastingAttr: "Int",
      spellSlots: [1,2,3,4,5,6,7,8,9].map(lv => ({ level: lv, total: Math.max(1, 5 - Math.floor(lv / 2)), used: 0 })),
    };
    const existingCompendium = current.COMPENDIUM || [];
    const existingIds = new Set(existingCompendium.map(e => e.id));
    const newEntries = MOCK_COMPENDIUM_SPELLS.filter(e => !existingIds.has(e.id));
    const res = saveAppStore({ character, compendium: [...existingCompendium, ...newEntries] });
    console.log("[VG] Mock spells injetados:", MOCK_SPELL_LISTS.reduce((a, l) => a + l.length, 0), "magias,", newEntries.length, "entradas no compêndio");
    return res;
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
