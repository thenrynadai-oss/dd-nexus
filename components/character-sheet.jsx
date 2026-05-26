// ─── constants ────────────────────────────────────────────────────────────────
const CS_ABILITIES = [
  { name: "Força", abbr: "FOR" }, { name: "Destreza", abbr: "DES" },
  { name: "Constituição", abbr: "CON" }, { name: "Inteligência", abbr: "INT" },
  { name: "Sabedoria", abbr: "SAB" }, { name: "Carisma", abbr: "CAR" },
];
const CS_SKILLS = [
  { name: "Acrobacia", attr: "DES" }, { name: "Arcanismo", attr: "INT" },
  { name: "Atletismo", attr: "FOR" }, { name: "Atuação", attr: "CAR" },
  { name: "Blefar", attr: "CAR" }, { name: "Furtividade", attr: "DES" },
  { name: "História", attr: "INT" }, { name: "Intimidação", attr: "CAR" },
  { name: "Intuição", attr: "SAB" }, { name: "Investigação", attr: "INT" },
  { name: "Lidar c/ Animais", attr: "SAB" }, { name: "Medicina", attr: "SAB" },
  { name: "Natureza", attr: "INT" }, { name: "Percepção", attr: "SAB" },
  { name: "Persuasão", attr: "CAR" }, { name: "Prestidigitação", attr: "DES" },
  { name: "Religião", attr: "INT" }, { name: "Sobrevivência", attr: "SAB" },
];
const csMod = (score) => Math.floor(((score || 10) - 10) / 2);
const csSign = (n) => (n >= 0 ? `+${n}` : `${n}`);
const csProfBonus = (lv) => lv >= 17 ? 6 : lv >= 13 ? 5 : lv >= 9 ? 4 : lv >= 5 ? 3 : 2;
const SPELL_COUNTS = [8, 13, 13, 12, 10, 9, 9, 7, 7, 7];

// ─── normalizeCS ──────────────────────────────────────────────────────────────
function normalizeCS(r = {}) {
  r = r || {};
  let abilities;
  if (Array.isArray(r.abilities) && r.abilities.length === 6 && r.abilities[0]?.abbr) {
    abilities = r.abilities;
  } else {
    abilities = CS_ABILITIES.map(d => {
      const old = Array.isArray(r.abilities) ? r.abilities.find(a => a.name === d.name) : null;
      return { ...d, score: old?.score ?? ((old?.mod ?? 0) * 2 + 10) };
    });
  }
  let skills;
  if (Array.isArray(r.skills) && r.skills.length > 0 && r.skills[0]?.attr !== undefined) {
    skills = CS_SKILLS.map(ds => {
      const found = r.skills.find(s => s.name === ds.name || (ds.name === "Blefar" && s.name === "Enganação"));
      return found ? { ...ds, prof: !!found.prof, expert: !!found.expert } : { ...ds, prof: false, expert: false };
    });
  } else {
    skills = CS_SKILLS.map(ds => {
      const old = Array.isArray(r.skills) ? r.skills.find(s => s.name === ds.name || (ds.name === "Blefar" && s.name === "Enganação")) : null;
      return { ...ds, prof: !!old?.prof, expert: false };
    });
  }
  const defSlots = Array.from({ length: 9 }, (_, i) => ({ level: i + 1, total: 0, used: 0 }));
  const spellSlots = (Array.isArray(r.spellSlots) && r.spellSlots[0]?.level !== undefined)
    ? r.spellSlots
    : defSlots.map((d, i) => ({ ...d, total: r.spellSlots?.[i]?.total || 0, used: r.spellSlots?.[i]?.used || 0 }));
  let spellLists;
  if (Array.isArray(r.spellLists) && r.spellLists.length === 10) {
    spellLists = r.spellLists.map((arr, lv) => {
      const base = Array.isArray(arr) ? [...arr] : [];
      while (base.length < SPELL_COUNTS[lv]) base.push({ name: "", prepared: false });
      return base;
    });
  } else {
    spellLists = SPELL_COUNTS.map((count, lv) => {
      const oldFlat = Array.isArray(r.spells) ? r.spells : [];
      const lvStr = lv === 0 ? "T" : String(lv);
      const fromOld = oldFlat.filter(s => s.level === lvStr || s.level === lv || s.level === String(lv));
      const names = fromOld.map(s => ({ name: s.name || "", prepared: false }));
      while (names.length < count) names.push({ name: "", prepared: false });
      return names;
    });
  }
  return {
    name: r.name || "", player: r.player || "",
    origin: r.origin || r.background || "", species: r.species || r.race || "",
    class: r.class || "", subclass: r.subclass || "",
    alignment: r.alignment || "", level: r.level || 1, xp: r.xp || 0,
    ac: r.ac || 10, shield: !!r.shield,
    hp: r.hp ?? 0, hpMax: r.hpMax || 0, hpTemp: r.hpTemp || 0,
    hitDiceTotal: r.hitDiceTotal || r.hitDice || "",
    hitDiceUsed: r.hitDiceUsed || 0,
    deathSaves: r.deathSaves || { s: 0, f: 0 },
    speed: r.speed || 30,
    heroicInspiration: r.heroicInspiration || r.inspiration || false,
    abilities, saves: r.saves || { FOR: false, DES: false, CON: false, INT: false, SAB: false, CAR: false },
    skills,
    attacks: Array.isArray(r.attacks) && r.attacks.length ? r.attacks
      : [{ name: "", bonus: "", dmg: "" }, { name: "", bonus: "", dmg: "" }, { name: "", bonus: "", dmg: "" }],
    featuresTraits: r.featuresTraits || r.classFeatures || (Array.isArray(r.features) ? r.features.map(f => `${f.name}:\n${f.desc}`).join("\n\n") : ""),
    traits: r.traits || "", ideals: r.ideals || "", bonds: r.bonds || "", flaws: r.flaws || "",
    languages: r.languages || "", weaponProfs: r.weaponProfs || "", toolProfs: r.toolProfs || "",
    armorTraining: r.armorTraining || { light: false, medium: false, heavy: false, shield: false },
    spellcastingClass: r.spellcastingClass || "", spellcastingAttr: r.spellcastingAttr || "",
    spellSlots, spellLists,
    age: r.age || "", height: r.height || "", weight: r.weight || "",
    eyes: r.eyes || "", skin: r.skin || "", hair: r.hair || "",
    appearance: r.appearance || "",
    history: r.history || r.historyPersonality || r.notes || "",
    allies: r.allies || "", allyName: r.allyName || "",
    otherFeatures: r.otherFeatures || r.racialTraits || "",
    treasure: r.treasure || "", feats: r.feats || "",
    inventory: Array.isArray(r.inventory) ? r.inventory : [],
    magicItems: (Array.isArray(r.magicItems) && r.magicItems.length >= 3) ? r.magicItems.slice(0, 3) : ["", "", ""],
    money: { cp: r.money?.cp ?? r.money?.pc ?? 0, pp: r.money?.pp ?? 0, pe: r.money?.pe ?? 0, po: r.money?.po ?? 0, pl: r.money?.pl ?? 0 },
  };
}

// ─── style helpers ────────────────────────────────────────────────────────────
const csInp = (extra = {}) => ({
  background: "transparent", border: "none",
  borderBottom: "1px dashed rgba(218,180,120,0.18)",
  color: "var(--t-text-soft)", fontFamily: "inherit",
  outline: "none", padding: "2px 4px", width: "100%", ...extra,
});
const csTA = (extra = {}) => ({
  background: "rgba(0,0,0,0.15)", border: "1px dashed rgba(218,180,120,0.16)",
  borderRadius: 8, color: "var(--t-text-soft)", fontFamily: "inherit",
  outline: "none", padding: "8px 10px", resize: "vertical",
  lineHeight: 1.65, width: "100%", boxSizing: "border-box", ...extra,
});
const csSec = (text) => React.createElement("div", {
  className: "mono",
  style: { fontSize: 7.5, letterSpacing: 1.5, color: "rgba(218,180,120,0.42)", textAlign: "center",
    paddingBottom: 5, marginBottom: 6, borderBottom: "1px solid rgba(218,180,120,0.1)" }
}, text);

// ─── CSAbilityScore ───────────────────────────────────────────────────────────
const CSAbilityScore = ({ ability, onScoreChange }) => {
  const mod = csMod(ability.score);
  return (
    <div className="glass" style={{ borderRadius: 10, padding: "8px 6px", textAlign: "center", border: "1px solid rgba(218,180,120,0.08)" }}>
      <div className="mono" style={{ fontSize: 7, letterSpacing: 1.4, color: "rgba(218,180,120,0.42)", marginBottom: 5 }}>
        {ability.name.toUpperCase()}
      </div>
      <input type="number" min="1" max="30" value={ability.score}
        onChange={e => onScoreChange(ability.abbr, e.target.value)}
        style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 26, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-text)", width: "100%", padding: "0 0 4px", borderBottom: "1px dashed rgba(218,180,120,0.14)" }} />
      <div style={{ marginTop: 5, background: "rgba(0,0,0,0.28)", border: "1px solid rgba(218,180,120,0.16)", borderRadius: 7, padding: "3px 0" }}>
        <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--t-accent-bright)", lineHeight: 1 }}>
          {csSign(mod)}
        </div>
      </div>
    </div>
  );
};

// ─── CSProfRow ────────────────────────────────────────────────────────────────
const CSProfRow = ({ label, attrLabel, value, prof, expert, onToggle }) => (
  <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 5, padding: "2.5px 2px", cursor: "pointer" }}>
    <div style={{
      width: 10, height: 10, flexShrink: 0,
      borderRadius: expert ? 2 : "50%",
      border: `1.5px solid ${prof ? "var(--t-accent-bright)" : "rgba(218,180,120,0.2)"}`,
      background: expert ? "var(--t-accent-bright)" : prof ? "rgba(218,162,90,0.28)" : "transparent",
    }} />
    <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: prof ? "var(--t-accent-bright)" : "var(--t-text-mute)", width: 26, textAlign: "right", flexShrink: 0 }}>
      {csSign(value)}
    </span>
    <span style={{ fontSize: 10.5, color: prof ? "var(--t-text)" : "rgba(232,227,214,0.52)", flex: 1, lineHeight: 1.2 }}>{label}</span>
    {attrLabel && <span className="mono" style={{ fontSize: 8, color: "rgba(218,180,120,0.28)", flexShrink: 0 }}>{attrLabel}</span>}
  </div>
);

// ─── CreateCharacterModal ─────────────────────────────────────────────────────
const CreateCharacterModal = ({ onClose }) => {
  const CLASSES = ["Bárbaro", "Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guerreiro", "Ladino", "Mago", "Monge", "Paladino", "Patrulheiro"];
  const RACES = ["Humano", "Elfo", "Anão", "Halfling", "Gnomo", "Meio-elfo", "Meio-orc", "Tiefling", "Draconato", "Outro"];
  const ALIGNS = ["Legal Bom", "Neutro Bom", "Caótico Bom", "Legal Neutro", "Neutro", "Caótico Neutro", "Legal Mau", "Neutro Mau", "Caótico Mau"];
  const [form, setForm] = React.useState({ name: "", class: "Guerreiro", race: "Humano", background: "", alignment: "Neutro", level: "1" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selStyle = { width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" };
  const handleSave = () => {
    if (!form.name.trim()) return;
    const res = window.AppData?.createCharacter(form.name.trim(), form);
    if (!res || !res.ok) { alert(res?.msg || "Erro ao criar personagem."); return; }
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong" style={{ width: 480, borderRadius: 22, padding: 32, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)" }}>Novo Personagem</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 6 }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NOME *</div>
          <input value={form.name} onChange={e => set("name", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="Kael, a Lâmina Perdida..." autoFocus style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CLASSE</div><select value={form.class} onChange={e => set("class", e.target.value)} style={selStyle}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>RAÇA</div><select value={form.race} onChange={e => set("race", e.target.value)} style={selStyle}>{RACES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>TENDÊNCIA</div><select value={form.alignment} onChange={e => set("alignment", e.target.value)} style={selStyle}>{ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NÍVEL</div><input type="number" min="1" max="20" value={form.level} onChange={e => set("level", e.target.value)} style={{ ...selStyle, textAlign: "center" }} /></div>
        </div>
        <div style={{ marginBottom: 26 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ANTECEDENTE</div>
          <input value={form.background} onChange={e => set("background", e.target.value)} placeholder="Nobre, Errante, Soldado..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={!form.name.trim()} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: form.name.trim() ? "var(--t-accent)" : "rgba(218,162,90,0.15)", border: "none", color: form.name.trim() ? "#1a0e04" : "var(--t-text-mute)", fontSize: 14, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "default" }}>Criar personagem</button>
          <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── CharacterSheet ───────────────────────────────────────────────────────────
const CharacterSheet = () => {
  const { CHARACTER = {} } = useAppMock();
  const [char, setChar] = useState(() => normalizeCS(CHARACTER));
  const [tab, setTab] = useState("frente");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { if (!dirty) setChar(normalizeCS(CHARACTER)); }, [CHARACTER]);

  const mark = () => { setDirty(true); setSaved(false); };
  const upd = (key, val) => { setChar(p => ({ ...p, [key]: val })); mark(); };
  const updNested = (key, sub, val) => { setChar(p => ({ ...p, [key]: { ...p[key], [sub]: val } })); mark(); };
  const updAbility = (abbr, score) => {
    setChar(p => ({ ...p, abilities: p.abilities.map(a => a.abbr === abbr ? { ...a, score: Math.max(1, Math.min(30, parseInt(score) || 10)) } : a) }));
    mark();
  };
  const updSave = (abbr) => { setChar(p => ({ ...p, saves: { ...p.saves, [abbr]: !p.saves[abbr] } })); mark(); };
  const updSkill = (name) => {
    setChar(p => ({
      ...p, skills: p.skills.map(s => {
        if (s.name !== name) return s;
        if (!s.prof) return { ...s, prof: true, expert: false };
        if (!s.expert) return { ...s, prof: true, expert: true };
        return { ...s, prof: false, expert: false };
      })
    }));
    mark();
  };
  const updAttack = (i, key, val) => { setChar(p => ({ ...p, attacks: p.attacks.map((a, idx) => idx === i ? { ...a, [key]: val } : a) })); mark(); };
  const addAttack = () => { setChar(p => ({ ...p, attacks: [...p.attacks, { name: "", bonus: "", dmg: "" }] })); mark(); };
  const rmAttack = (i) => { setChar(p => ({ ...p, attacks: p.attacks.filter((_, idx) => idx !== i) })); mark(); };
  const updSpellSlot = (level, key, raw) => {
    const v = Math.max(0, Math.min(9, parseInt(raw) || 0));
    setChar(p => ({ ...p, spellSlots: p.spellSlots.map(s => s.level === level ? { ...s, [key]: v } : s) }));
    mark();
  };
  const updSpellName = (lv, idx, name) => {
    setChar(p => { const lists = [...p.spellLists]; lists[lv] = lists[lv].map((s, i) => i !== idx ? s : { ...s, name }); return { ...p, spellLists: lists }; });
    mark();
  };
  const updSpellPrep = (lv, idx) => {
    setChar(p => { const lists = [...p.spellLists]; lists[lv] = lists[lv].map((s, i) => i !== idx ? s : { ...s, prepared: !s.prepared }); return { ...p, spellLists: lists }; });
    mark();
  };
  const addSpellRow = (lv) => {
    setChar(p => { const lists = [...p.spellLists]; lists[lv] = [...lists[lv], { name: "", prepared: false }]; return { ...p, spellLists: lists }; });
    mark();
  };

  const saveChar = () => {
    const res = window.AppData?.update("CHARACTER", char);
    if (res?.ok) { setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2200); }
  };

  const prof = csProfBonus(char.level || 1);
  const aMap = {};
  (char.abilities || []).forEach(a => { aMap[a.abbr] = csMod(a.score); });
  const percSkill = (char.skills || []).find(s => s.name === "Percepção");
  const percBonus = percSkill ? (percSkill.expert ? prof * 2 : percSkill.prof ? prof : 0) : 0;
  const passivePerc = 10 + (aMap.SAB || 0) + percBonus;
  const castAbbr = (char.spellcastingAttr || "").toUpperCase();
  const castMod = aMap[castAbbr] || 0;
  const spellDC = 8 + prof + castMod;
  const spellAtk = prof + castMod;
  const initVal = aMap.DES || 0;

  // ── empty state ──
  if (!char.name) {
    return (
      <div data-screen-label="Ficha">
        {showCreate && <CreateCharacterModal onClose={() => setShowCreate(false)} />}
        <div className="glass" style={{ borderRadius: 22, padding: "72px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 500px 350px at 50% 50%, rgba(218,162,90,0.05), transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 24px", background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px -10px var(--t-accent-tint)", animation: "float-soft 6s ease-in-out infinite" }}>
              <Icon name="shield" size={38} style={{ color: "var(--t-accent)", opacity: 0.8 }} />
            </div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--t-text)", marginBottom: 12 }}>Nenhuma ficha criada ainda</div>
            <p style={{ fontSize: 15, color: "var(--t-text-mute)", lineHeight: 1.65, maxWidth: 440, margin: "0 auto 32px" }}>
              Crie um personagem para registrar seus atributos, habilidades, inventário e muito mais.
            </p>
            <button onClick={() => setShowCreate(true)} style={{ padding: "12px 28px", borderRadius: 12, background: "var(--t-accent)", border: "none", color: "#1a0e04", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + Criar personagem
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inp = (key, ph, extra = {}) => (
    <input value={char[key] || ""} onChange={e => upd(key, e.target.value)} placeholder={ph}
      style={{ ...csInp({ fontSize: 12, ...extra }) }} />
  );

  // ── stat cell ──
  const StatCell = ({ label, children, accent = "rgba(218,162,90,0.25)" }) => (
    <div className="glass" style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div data-screen-label="Ficha">

      {/* ══ HEADER ══ */}
      <div className="glass" style={{ borderRadius: 16, padding: "14px 20px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 0% 50%, rgba(218,162,90,0.06), transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <input value={char.name} onChange={e => upd("name", e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.28)", color: "var(--t-text)", fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 600, outline: "none", padding: "2px 0" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {dirty && !saved && <span className="mono" style={{ fontSize: 9.5, color: "rgba(218,162,90,0.6)" }}>● não salvo</span>}
              {saved && <span className="mono" style={{ fontSize: 9.5, color: "#7ba85d" }}>✓ salvo</span>}
              <button onClick={saveChar} style={{ padding: "7px 18px", borderRadius: 9, background: dirty ? "var(--t-accent)" : "rgba(218,162,90,0.1)", border: "1px solid var(--t-border-strong)", color: dirty ? "#1a0e04" : "var(--t-text-mute)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Salvar
              </button>
              <button onClick={() => { if (confirm("Apagar ficha?")) { window.AppData?.update("CHARACTER", {}); setDirty(false); } }}
                style={{ padding: "7px 12px", borderRadius: 9, background: "transparent", border: "1px solid rgba(194,85,85,0.3)", color: "#c25555", fontSize: 11, cursor: "pointer" }}>
                Apagar
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 56px", gap: 10 }}>
            {[["class", "CLASSE & SUBCLASSE"], ["origin", "ANTECEDENTE"], ["player", "JOGADOR"], ["species", "RAÇA"], ["alignment", "TENDÊNCIA"]].map(([k, lbl]) => (
              <div key={k}>
                <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.38)", marginBottom: 2 }}>{lbl}</div>
                {inp(k, lbl.toLowerCase())}
              </div>
            ))}
            <div>
              <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.38)", marginBottom: 2 }}>NÍVEL</div>
              <input type="number" min="1" max="20" value={char.level}
                onChange={e => upd("level", Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                style={{ ...csInp({ fontSize: 20, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-accent-bright)", textAlign: "center" }) }} />
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div style={{ display: "flex", gap: 3, marginBottom: 14, padding: 3, background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid var(--t-border)" }}>
        {[["frente", "Frente"], ["magia", "Magia"], ["historico", "Histórico"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "9px 0", borderRadius: 7, background: tab === id ? "linear-gradient(180deg,var(--t-accent-tint),rgba(218,162,90,0.05))" : "transparent", border: tab === id ? "1px solid var(--t-border-strong)" : "1px solid transparent", color: tab === id ? "var(--t-accent-bright)" : "rgba(232,227,214,0.55)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════ TAB: FRENTE ════════════════════════ */}
      {tab === "frente" && (
        <div style={{ display: "grid", gridTemplateColumns: "146px 188px 1fr 224px", gap: 11 }}>

          {/* COL 1 — Ability Scores */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(char.abilities || []).map(a => (
              <CSAbilityScore key={a.abbr} ability={a} onScoreChange={updAbility} />
            ))}
          </div>

          {/* COL 2 — Saves + Skills */}
          <div className="glass" style={{ borderRadius: 12, padding: "10px 9px", display: "flex", flexDirection: "column" }}>
            {/* Inspiração + Prof */}
            <div style={{ display: "flex", gap: 7, marginBottom: 9 }}>
              <div onClick={() => upd("heroicInspiration", !char.heroicInspiration)} className="glass-strong"
                style={{ flex: 1, borderRadius: 8, padding: "7px 5px", textAlign: "center", cursor: "pointer", border: char.heroicInspiration ? "1px solid var(--t-border-active)" : "1px solid rgba(218,180,120,0.07)" }}>
                <div style={{ fontSize: 15, color: char.heroicInspiration ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>◆</div>
                <div className="mono" style={{ fontSize: 6.5, letterSpacing: 1, color: "rgba(218,180,120,0.4)", marginTop: 2 }}>INSPIRAÇÃO</div>
              </div>
              <div className="glass-strong" style={{ flex: 1, borderRadius: 8, padding: "7px 5px", textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--t-accent-bright)", lineHeight: 1 }}>+{prof}</div>
                <div className="mono" style={{ fontSize: 6.5, letterSpacing: 1, color: "rgba(218,180,120,0.4)", marginTop: 2 }}>BÔNUS PROF.</div>
              </div>
            </div>

            {csSec("TESTES DE RESISTÊNCIA")}
            {CS_ABILITIES.map(({ abbr, name }) => {
              const sp = (char.saves || {})[abbr];
              return <CSProfRow key={abbr} label={name} value={(aMap[abbr] || 0) + (sp ? prof : 0)} prof={sp} expert={false} onToggle={() => updSave(abbr)} />;
            })}

            <div style={{ margin: "7px 0", borderTop: "1px dashed rgba(218,180,120,0.1)" }} />
            {csSec("PERÍCIAS")}
            {CS_SKILLS.map(sk => {
              const sd = (char.skills || []).find(s => s.name === sk.name) || sk;
              const val = (aMap[sk.attr] || 0) + (sd.expert ? prof * 2 : sd.prof ? prof : 0);
              return <CSProfRow key={sk.name} label={sk.name} attrLabel={sk.attr} value={val} prof={sd.prof} expert={sd.expert} onToggle={() => updSkill(sk.name)} />;
            })}

            <div style={{ marginTop: 8, padding: "6px 5px", background: "rgba(0,0,0,0.22)", borderRadius: 7, textAlign: "center" }}>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)" }}>{passivePerc}</div>
              <div className="mono" style={{ fontSize: 6.5, letterSpacing: 1, color: "rgba(218,180,120,0.4)", marginTop: 1 }}>SABEDORIA PASSIVA (PERCEPÇÃO)</div>
            </div>

            <div style={{ marginTop: 9 }}>
              {csSec("IDIOMAS E PROFICIÊNCIAS")}
              <textarea value={char.languages || ""} onChange={e => upd("languages", e.target.value)} placeholder="Comum, Élfico..." rows={3}
                style={{ ...csTA({ fontSize: 11, lineHeight: 1.5 }) }} />
            </div>
          </div>

          {/* COL 3 — Combat + Attacks + Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>

            {/* CA / Initiative / Speed */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <StatCell label="CLASSE DE ARMADURA" accent="#6da5c8">
                <input type="number" value={char.ac} onChange={e => upd("ac", parseInt(e.target.value) || 10)}
                  style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 30, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-text)", width: "100%", padding: 0 }} />
              </StatCell>
              <StatCell label="INICIATIVA">
                <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: "var(--t-text)" }}>{csSign(initVal)}</div>
              </StatCell>
              <StatCell label="DESLOCAMENTO">
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
                  <input type="number" value={char.speed} onChange={e => upd("speed", parseInt(e.target.value) || 30)}
                    style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 26, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-text)", width: 52, padding: 0 }} />
                  <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>pés</span>
                </div>
              </StatCell>
            </div>

            {/* HP */}
            <div className="glass" style={{ borderRadius: 12, padding: "11px 14px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#c25555" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)" }}>PV TOTAIS</div>
                <input type="number" value={char.hpMax} onChange={e => upd("hpMax", Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 50, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 13, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "rgba(218,180,120,0.6)" }} />
              </div>
              <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 4 }}>PONTOS DE VIDA ATUAIS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={char.hp} onChange={e => upd("hp", Math.max(0, parseInt(e.target.value) ?? 0))}
                  style={{ flex: 1, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 40, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: char.hpMax > 0 && char.hp / char.hpMax < 0.3 ? "#c25555" : "var(--t-text)", padding: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {[[-5, "#c25555"], [-1, "#c25555"], [+1, "#7ba85d"], [+5, "#7ba85d"]].map(([d, c]) => (
                    <button key={d} onClick={() => upd("hp", Math.max(0, Math.min(char.hpMax, char.hp + d)))}
                      style={{ padding: "2px 8px", borderRadius: 4, background: `${c}15`, border: `1px solid ${c}40`, color: c, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 4, background: "rgba(0,0,0,0.4)", borderRadius: 2, marginTop: 7, overflow: "hidden" }}>
                <div style={{ width: `${char.hpMax ? Math.min(100, (char.hp / char.hpMax) * 100) : 0}%`, height: "100%", background: "linear-gradient(90deg,#c25555,#e07b7b)", borderRadius: 2 }} />
              </div>
              <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginTop: 9, marginBottom: 3 }}>PONTOS DE VIDA TEMPORÁRIOS</div>
              <input type="number" value={char.hpTemp} onChange={e => upd("hpTemp", Math.max(0, parseInt(e.target.value) || 0))}
                style={{ width: "100%", textAlign: "center", background: "transparent", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.14)", outline: "none", fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-text-soft)" }} />
            </div>

            {/* Hit Dice + Death Saves */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="glass" style={{ borderRadius: 10, padding: "9px 12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--t-accent)" }} />
                <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 6 }}>DADOS DE VIDA</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[["TOTAL", "hitDiceTotal", false, "1d10"], ["GASTO", "hitDiceUsed", true, "0"]].map(([lbl, key, isNum, ph]) => (
                    <div key={key} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 7.5, color: "var(--t-text-faint)", marginBottom: 2 }}>{lbl}</div>
                      <input {...(isNum ? { type: "number" } : {})} value={char[key]} onChange={e => upd(key, isNum ? Math.max(0, parseInt(e.target.value) || 0) : e.target.value)} placeholder={ph}
                        style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: isNum ? 18 : 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-accent-bright)", width: "100%", padding: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ borderRadius: 10, padding: "9px 12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#9d7bd8" }} />
                <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 7 }}>TESTES CONTRA A MORTE</div>
                {[["s", "SUCESSOS", "#7ba85d"], ["f", "FALHAS", "#c25555"]].map(([key, lbl, color]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontSize: 9, color }}>▲ {lbl}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} onClick={() => updNested("deathSaves", key, char.deathSaves[key] > i ? i : i + 1)}
                          style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${color}`, background: i < char.deathSaves[key] ? color : "transparent", cursor: "pointer" }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attacks */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.3, color: "rgba(218,180,120,0.42)" }}>ATAQUES E MAGIAS</div>
                <button onClick={addAttack} style={{ padding: "3px 10px", borderRadius: 6, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 10, cursor: "pointer" }}>+ Adicionar</button>
              </div>
              <div className="glass" style={{ borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 1fr 18px", padding: "6px 10px", background: "rgba(0,0,0,0.28)" }}>
                  {["NOME", "BÔNUS", "DANO / TIPO", ""].map((h, i) => (
                    <span key={i} className="mono" style={{ fontSize: 7.5, letterSpacing: 1, color: "rgba(218,180,120,0.38)" }}>{h}</span>
                  ))}
                </div>
                {(char.attacks || []).map((a, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 72px 1fr 18px", padding: "5px 10px", borderBottom: i < char.attacks.length - 1 ? "1px dashed rgba(218,180,120,0.07)" : "none", alignItems: "center", gap: 3 }}>
                    <input value={a.name || ""} onChange={e => updAttack(i, "name", e.target.value)} placeholder="Espada longa" style={csInp({ fontSize: 12 })} />
                    <input value={a.bonus || ""} onChange={e => updAttack(i, "bonus", e.target.value)} placeholder="+5" style={csInp({ fontSize: 12, textAlign: "center" })} />
                    <input value={a.dmg || ""} onChange={e => updAttack(i, "dmg", e.target.value)} placeholder="1d8+3 cortante" style={csInp({ fontSize: 12 })} />
                    <button onClick={() => rmAttack(i)} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", padding: 0, fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Features & Traits */}
            <div>
              {csSec("CARACTERÍSTICAS E HABILIDADES")}
              <textarea value={char.featuresTraits || ""} onChange={e => upd("featuresTraits", e.target.value)}
                placeholder="Características de classe, traços de raça, talentos, habilidades especiais..." rows={7}
                style={csTA({ fontSize: 12 })} />
            </div>
          </div>

          {/* COL 4 — Personality + XP + Armor */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[["traits", "TRAÇOS DE PERSONALIDADE", 4], ["ideals", "IDEAIS", 3], ["bonds", "LIGAÇÕES", 3], ["flaws", "DEFEITOS", 3]].map(([key, lbl, rows]) => (
              <div key={key} className="glass" style={{ borderRadius: 10, padding: "8px 10px" }}>
                {csSec(lbl)}
                <textarea value={char[key] || ""} onChange={e => upd(key, e.target.value)} rows={rows}
                  style={csTA({ fontSize: 11 })} />
              </div>
            ))}
            <div className="glass" style={{ borderRadius: 10, padding: "9px 11px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.38)", marginBottom: 4 }}>PONTOS DE EXPERIÊNCIA</div>
              <input type="number" min="0" value={char.xp} onChange={e => upd("xp", Math.max(0, parseInt(e.target.value) || 0))}
                style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-accent-bright)", width: "100%", padding: 0 }} />
            </div>
            <div className="glass" style={{ borderRadius: 10, padding: "9px 11px" }}>
              {csSec("TREINAMENTO DE ARMADURA")}
              <div onClick={() => upd("shield", !char.shield)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ width: 11, height: 11, borderRadius: 2, border: `1.5px solid ${char.shield ? "var(--t-accent-bright)" : "rgba(218,180,120,0.22)"}`, background: char.shield ? "var(--t-accent-tint)" : "transparent" }} />
                <span style={{ fontSize: 11, color: char.shield ? "var(--t-text)" : "var(--t-text-mute)" }}>Escudo (+2 CA)</span>
              </div>
              {[["light", "Leve"], ["medium", "Média"], ["heavy", "Pesada"]].map(([k, lbl]) => (
                <div key={k} onClick={() => updNested("armorTraining", k, !char.armorTraining?.[k])}
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, cursor: "pointer" }}>
                  <div style={{ width: 11, height: 11, borderRadius: 2, border: `1.5px solid ${char.armorTraining?.[k] ? "var(--t-accent-bright)" : "rgba(218,180,120,0.22)"}`, background: char.armorTraining?.[k] ? "var(--t-accent-tint)" : "transparent" }} />
                  <span style={{ fontSize: 11, color: char.armorTraining?.[k] ? "var(--t-text)" : "var(--t-text-mute)" }}>Armadura {lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════ TAB: MAGIA ════════════════════════ */}
      {tab === "magia" && (
        <div>
          {/* Spellcasting header */}
          <div className="glass" style={{ borderRadius: 12, padding: "12px 18px", marginBottom: 14, display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 16 }}>
            <div>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.3, color: "rgba(218,180,120,0.4)", marginBottom: 4 }}>CLASSE DE CONJURADOR</div>
              <input value={char.spellcastingClass || ""} onChange={e => upd("spellcastingClass", e.target.value)} placeholder="Mago, Clérigo..."
                style={csInp({ fontSize: 14 })} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.3, color: "rgba(218,180,120,0.4)", marginBottom: 4 }}>HABILIDADE CHAVE</div>
              <select value={char.spellcastingAttr || ""} onChange={e => upd("spellcastingAttr", e.target.value)}
                style={{ background: "rgba(0,0,0,0.3)", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.18)", color: "var(--t-text-soft)", outline: "none", width: "100%", fontSize: 13, padding: "2px 4px" }}>
                <option value="">— nenhuma —</option>
                {CS_ABILITIES.map(a => <option key={a.abbr} value={a.abbr}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.3, color: "rgba(218,180,120,0.4)", marginBottom: 6 }}>CD DO TR</div>
              <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: castAbbr ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>{spellDC}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.3, color: "rgba(218,180,120,0.4)", marginBottom: 6 }}>BÔNUS DE ATAQUE</div>
              <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: castAbbr ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>{csSign(spellAtk)}</div>
            </div>
          </div>

          {/* Spell columns: [0,1,2] | [3,4,5] | [6,7,8,9] */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[[0, 1, 2], [3, 4, 5], [6, 7, 8, 9]].map((colLevels, ci) => (
              <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {colLevels.map(lv => {
                  const slot = lv > 0 ? (char.spellSlots || []).find(s => s.level === lv) : null;
                  const spells = (char.spellLists || [])[lv] || [];
                  return (
                    <div key={lv} className="glass" style={{ borderRadius: 12, padding: "9px 11px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: "rgba(218,162,90,0.14)", border: "1px solid rgba(218,180,120,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span className="serif" style={{ fontSize: 13, fontWeight: 700, color: "var(--t-accent-bright)" }}>{lv}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.1, color: "rgba(218,180,120,0.5)", flex: 1 }}>
                          {lv === 0 ? "TRUQUES" : `NÍVEL ${lv}`}
                        </div>
                        {slot && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <input type="number" min="0" max="9" value={slot.total}
                              onChange={e => updSpellSlot(lv, "total", e.target.value)}
                              style={{ width: 26, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 12, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-accent-bright)", padding: 0 }} />
                            <span style={{ fontSize: 9, color: "rgba(218,180,120,0.3)" }}>/</span>
                            <input type="number" min="0" max="9" value={slot.used}
                              onChange={e => updSpellSlot(lv, "used", e.target.value)}
                              style={{ width: 26, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 12, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "#c25555", padding: 0 }} />
                          </div>
                        )}
                      </div>
                      {spells.map((sp, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 5, padding: "2.5px 0", borderBottom: idx < spells.length - 1 ? "1px dashed rgba(218,180,120,0.06)" : "none" }}>
                          <div onClick={() => updSpellPrep(lv, idx)} style={{ width: 10, height: 10, flexShrink: 0, borderRadius: "50%", cursor: lv > 0 ? "pointer" : "default", border: `1.5px solid ${sp.prepared && lv > 0 ? "var(--t-accent-bright)" : "rgba(218,180,120,0.18)"}`, background: sp.prepared && lv > 0 ? "rgba(218,162,90,0.3)" : "transparent" }} />
                          <input value={sp.name || ""} onChange={e => updSpellName(lv, idx, e.target.value)} placeholder="Nome da magia..."
                            style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.09)", outline: "none", fontSize: 11.5, color: "var(--t-text-soft)", padding: "0 2px" }} />
                        </div>
                      ))}
                      <button onClick={() => addSpellRow(lv)}
                        style={{ marginTop: 5, width: "100%", padding: "2px 0", borderRadius: 5, background: "rgba(0,0,0,0.15)", border: "1px dashed rgba(218,180,120,0.1)", color: "rgba(218,180,120,0.32)", fontSize: 10, cursor: "pointer" }}>
                        + linha
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════ TAB: HISTÓRICO ════════════════════════ */}
      {tab === "historico" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {/* Physical info */}
            <div className="glass" style={{ borderRadius: 12, padding: "12px 14px" }}>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>{char.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["age", "IDADE"], ["height", "ALTURA"], ["weight", "PESO"]].map(([k, lbl]) => (
                  <div key={k}>
                    <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.38)", marginBottom: 2 }}>{lbl}</div>
                    <input value={char[k] || ""} onChange={e => upd(k, e.target.value)} placeholder="—" style={csInp({ fontSize: 12 })} />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["eyes", "OLHOS"], ["skin", "PELE"], ["hair", "CABELOS"]].map(([k, lbl]) => (
                  <div key={k}>
                    <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.38)", marginBottom: 2 }}>{lbl}</div>
                    <input value={char[k] || ""} onChange={e => upd(k, e.target.value)} placeholder="—" style={csInp({ fontSize: 12 })} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              {csSec("APARÊNCIA DO PERSONAGEM")}
              <textarea value={char.appearance || ""} onChange={e => upd("appearance", e.target.value)} rows={7}
                placeholder="Descreva a aparência física: traços, marcas, vestimentas..."
                style={csTA({ fontSize: 12 })} />
            </div>

            <div>
              {csSec("HISTÓRIA DO PERSONAGEM")}
              <textarea value={char.history || ""} onChange={e => upd("history", e.target.value)} rows={10}
                placeholder="Backstory, origens, eventos marcantes na vida do personagem..."
                style={csTA({ fontSize: 12 })} />
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {/* Allies */}
            <div>
              {csSec("ALIADOS E ORGANIZAÇÕES")}
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.38)", marginBottom: 2 }}>NOME</div>
                  <input value={char.allyName || ""} onChange={e => upd("allyName", e.target.value)} placeholder="Ordem dos Guardiões..." style={csInp({ fontSize: 12 })} />
                </div>
                <div className="glass" style={{ width: 80, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div className="mono" style={{ fontSize: 7, color: "rgba(218,180,120,0.3)" }}>SÍMBOLO</div>
                </div>
              </div>
              <textarea value={char.allies || ""} onChange={e => upd("allies", e.target.value)} rows={6}
                placeholder="Aliados, organizações, facções e a relação do personagem com elas..."
                style={csTA({ fontSize: 12 })} />
            </div>

            <div>
              {csSec("OUTRAS CARACTERÍSTICAS E HABILIDADES")}
              <textarea value={char.otherFeatures || ""} onChange={e => upd("otherFeatures", e.target.value)} rows={7}
                placeholder="Outras habilidades, poderes divinos, capacidades especiais..."
                style={csTA({ fontSize: 12 })} />
            </div>

            <div>
              {csSec("TESOURO")}
              <textarea value={char.treasure || ""} onChange={e => upd("treasure", e.target.value)} rows={4}
                placeholder="Itens especiais, relíquias, tesouros encontrados..."
                style={csTA({ fontSize: 12 })} />
            </div>

            {/* Equipment */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                {csSec("EQUIPAMENTO")}
                <button onClick={() => upd("inventory", [...(char.inventory || []), { name: "", qty: 1, weight: 0 }])}
                  style={{ padding: "3px 10px", borderRadius: 6, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 10, cursor: "pointer" }}>
                  + Item
                </button>
              </div>
              <div className="glass" style={{ borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 46px 54px 20px", padding: "5px 10px", background: "rgba(0,0,0,0.28)" }}>
                  {["ITEM", "QTD", "PESO", ""].map((h, i) => <span key={i} className="mono" style={{ fontSize: 7.5, letterSpacing: 1, color: "rgba(218,180,120,0.38)" }}>{h}</span>)}
                </div>
                {(char.inventory || []).map((it, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 46px 54px 20px", padding: "5px 10px", borderBottom: i < char.inventory.length - 1 ? "1px dashed rgba(218,180,120,0.07)" : "none", alignItems: "center" }}>
                    <input value={it.name} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], name: e.target.value }; upd("inventory", inv); }} placeholder="Item..." style={csInp({ fontSize: 12 })} />
                    <input type="number" value={it.qty} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], qty: parseInt(e.target.value) || 1 }; upd("inventory", inv); }} style={csInp({ fontSize: 12, textAlign: "center" })} />
                    <input type="number" step="0.1" value={it.weight} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], weight: parseFloat(e.target.value) || 0 }; upd("inventory", inv); }} style={csInp({ fontSize: 12, textAlign: "center" })} />
                    <button onClick={() => upd("inventory", char.inventory.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                ))}
                {!(char.inventory || []).length && <div style={{ padding: "12px", color: "var(--t-text-faint)", fontSize: 11, textAlign: "center" }}>Nenhum item</div>}
              </div>

              {/* Money */}
              <div className="glass" style={{ borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
                <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.3, color: "rgba(218,180,120,0.4)", marginBottom: 8 }}>MOEDAS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {[["cp", "PC", "#c8643a"], ["pp", "PA", "#cdd5dd"], ["pe", "PE", "#9d7bd8"], ["po", "PO", "var(--t-accent-bright)"], ["pl", "PL", "#a3d4e8"]].map(([k, lbl, color]) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, margin: "0 auto 3px" }} />
                      <div className="mono" style={{ fontSize: 7.5, color: "rgba(218,180,120,0.38)", marginBottom: 3 }}>{lbl}</div>
                      <input type="number" min="0" value={(char.money || {})[k] || 0}
                        onChange={e => updNested("money", k, Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ width: "100%", textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 16, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color, padding: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.CharacterSheet = CharacterSheet;
