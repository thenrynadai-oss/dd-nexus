// ─── helpers ─────────────────────────────────────────────────────────────────
const CS_ABILITIES = [
  { name: "Força", abbr: "FOR" },
  { name: "Destreza", abbr: "DES" },
  { name: "Constituição", abbr: "CON" },
  { name: "Inteligência", abbr: "INT" },
  { name: "Sabedoria", abbr: "SAB" },
  { name: "Carisma", abbr: "CAR" },
];
const CS_SKILLS = [
  { name: "Atletismo", attr: "FOR" },
  { name: "Acrobacia", attr: "DES" },
  { name: "Prestidigitação", attr: "DES" },
  { name: "Furtividade", attr: "DES" },
  { name: "Arcanismo", attr: "INT" },
  { name: "História", attr: "INT" },
  { name: "Investigação", attr: "INT" },
  { name: "Natureza", attr: "INT" },
  { name: "Religião", attr: "INT" },
  { name: "Lidar com Animais", attr: "SAB" },
  { name: "Intuição", attr: "SAB" },
  { name: "Medicina", attr: "SAB" },
  { name: "Percepção", attr: "SAB" },
  { name: "Sobrevivência", attr: "SAB" },
  { name: "Enganação", attr: "CAR" },
  { name: "Intimidação", attr: "CAR" },
  { name: "Atuação", attr: "CAR" },
  { name: "Persuasão", attr: "CAR" },
];
const csMod = (score) => Math.floor(((score || 10) - 10) / 2);
const csSign = (n) => (n >= 0 ? `+${n}` : `${n}`);
const csProfBonus = (lv) => lv >= 17 ? 6 : lv >= 13 ? 5 : lv >= 9 ? 4 : lv >= 5 ? 3 : 2;

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
    skills = r.skills;
  } else {
    skills = CS_SKILLS.map(ds => {
      const old = Array.isArray(r.skills) ? r.skills.find(s => s.name === ds.name) : null;
      return { ...ds, prof: !!old?.prof, expert: false };
    });
  }
  const defSlots = Array.from({ length: 9 }, (_, i) => ({ level: i + 1, total: 0, used: 0 }));
  const spellSlots = (Array.isArray(r.spellSlots) && r.spellSlots[0]?.level !== undefined)
    ? r.spellSlots
    : defSlots.map((d, i) => ({ ...d, total: r.spellSlots?.[i]?.total || 0, used: r.spellSlots?.[i]?.used || 0 }));
  return {
    name: r.name || "",
    player: r.player || "",
    origin: r.origin || r.background || "",
    species: r.species || r.race || "",
    class: r.class || "",
    subclass: r.subclass || "",
    alignment: r.alignment || "",
    level: r.level || 1,
    xp: r.xp || 0,
    ac: r.ac || 10,
    shield: !!r.shield,
    hp: r.hp ?? 0,
    hpMax: r.hpMax || 0,
    hpTemp: r.hpTemp || 0,
    hitDiceTotal: r.hitDiceTotal || r.hitDice || "",
    hitDiceUsed: r.hitDiceUsed || 0,
    deathSaves: r.deathSaves || { s: 0, f: 0 },
    speed: r.speed || 30,
    size: r.size || "Médio",
    heroicInspiration: r.heroicInspiration || r.inspiration || false,
    abilities,
    saves: r.saves || { FOR: false, DES: false, CON: false, INT: false, SAB: false, CAR: false },
    skills,
    attacks: Array.isArray(r.attacks) ? r.attacks : [],
    classFeatures: r.classFeatures || (Array.isArray(r.features) ? r.features.map(f => `${f.name}:\n${f.desc}`).join("\n\n") : ""),
    racialTraits: r.racialTraits || "",
    feats: r.feats || "",
    armorTraining: r.armorTraining || { light: false, medium: false, heavy: false, shield: false },
    weaponProfs: r.weaponProfs || "",
    toolProfs: r.toolProfs || "",
    spellcastingAttr: r.spellcastingAttr || "",
    spellSlots,
    spells: Array.isArray(r.spells) ? r.spells : [],
    appearance: r.appearance || "",
    historyPersonality: r.historyPersonality || r.notes || "",
    languages: r.languages || "",
    inventory: Array.isArray(r.inventory) ? r.inventory : [],
    magicItems: (Array.isArray(r.magicItems) && r.magicItems.length >= 3) ? r.magicItems.slice(0, 3) : ["", "", ""],
    money: { cp: r.money?.cp ?? r.money?.pc ?? 0, pp: r.money?.pp ?? 0, pe: r.money?.pe ?? 0, po: r.money?.po ?? 0, pl: r.money?.pl ?? 0 },
  };
}

// ─── input helpers ────────────────────────────────────────────────────────────
const csInp = (extra = {}) => ({
  background: "transparent", border: "none",
  borderBottom: "1px dashed rgba(218,180,120,0.18)",
  color: "var(--t-text-soft)", fontFamily: "inherit",
  outline: "none", padding: "2px 3px", width: "100%", ...extra,
});
const csTA = (extra = {}) => ({
  ...csInp({ borderBottom: "none" }),
  border: "1px dashed rgba(218,180,120,0.18)",
  borderRadius: 8, padding: "10px 12px", resize: "vertical",
  lineHeight: 1.65, background: "rgba(0,0,0,0.2)", ...extra,
});

// ─── StatBox ─────────────────────────────────────────────────────────────────
const CSStatBox = ({ label, value, onChange, accent = "var(--t-accent)" }) => (
  <div className="glass" style={{ padding: "12px 10px", borderRadius: 12, textAlign: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
    <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.3, color: "var(--t-text-faint)", marginBottom: 4 }}>{label}</div>
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...csInp({ borderBottom: "none", textAlign: "center", fontSize: 28, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-text)", width: "100%", padding: 0 }) }}
    />
  </div>
);

// ─── AbilityBlock ─────────────────────────────────────────────────────────────
const CSAbilityBlock = ({ ability, saves, skills, profBonus, onScoreChange, onSaveToggle, onSkillToggle }) => {
  const mod = csMod(ability.score);
  const saveProf = saves[ability.abbr];
  const saveVal = mod + (saveProf ? profBonus : 0);
  const relSkills = CS_SKILLS.filter(s => s.attr === ability.abbr);

  return (
    <div className="glass" style={{ borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Save */}
      <div
        onClick={() => onSaveToggle(ability.abbr, !saveProf)}
        style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginBottom: 4 }}
      >
        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${saveProf ? "var(--t-accent-bright)" : "rgba(218,180,120,0.3)"}`, background: saveProf ? "var(--t-accent-bright)" : "transparent", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "var(--t-text-mute)" }}>Salvaguarda</span>
        <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: "var(--t-accent-bright)", fontWeight: 700 }}>{csSign(saveVal)}</span>
      </div>

      {/* Score box */}
      <div className="glass-strong" style={{ borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
        <div className="serif" style={{ fontSize: 32, fontWeight: 600, color: "var(--t-text)", lineHeight: 1 }}>{csSign(mod)}</div>
        <input
          type="number"
          min="1" max="30"
          value={ability.score}
          onChange={e => onScoreChange(ability.abbr, e.target.value)}
          style={{ ...csInp({ textAlign: "center", fontSize: 13, color: "rgba(218,180,120,0.8)", borderBottom: "none", fontWeight: 600, padding: 0 }) }}
        />
        <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "var(--t-text-faint)", marginTop: 2 }}>{ability.name.toUpperCase()}</div>
      </div>

      {/* Skills */}
      {relSkills.map(sk => {
        const skillData = skills.find(s => s.name === sk.name) || sk;
        const skillVal = mod + (skillData.expert ? profBonus * 2 : skillData.prof ? profBonus : 0);
        return (
          <div
            key={sk.name}
            onClick={() => {
              if (!skillData.prof) onSkillToggle(sk.name, "prof", true);
              else if (!skillData.expert) onSkillToggle(sk.name, "expert", true);
              else { onSkillToggle(sk.name, "prof", false); onSkillToggle(sk.name, "expert", false); }
            }}
            style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "2px 0" }}
          >
            <div style={{
              width: 12, height: 12, borderRadius: skillData.expert ? 3 : "50%",
              border: `1.5px solid ${skillData.prof ? "var(--t-accent-bright)" : "rgba(218,180,120,0.25)"}`,
              background: skillData.expert ? "var(--t-accent-bright)" : skillData.prof ? "var(--t-accent-tint)" : "transparent",
              flexShrink: 0,
            }} />
            <span style={{ flex: 1, fontSize: 11, color: skillData.prof ? "var(--t-text)" : "rgba(232,227,214,0.6)" }}>{sk.name}</span>
            <span className="mono" style={{ fontSize: 11, color: skillData.prof ? "var(--t-accent-bright)" : "var(--t-text-mute)", fontWeight: 600 }}>{csSign(skillVal)}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── CreateCharacterModal ─────────────────────────────────────────────────────
const CreateCharacterModal = ({ onClose }) => {
  const CLASSES = ["Bárbaro", "Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guerreiro", "Ladino", "Mago", "Monge", "Paladino", "Patrulheiro"];
  const RACES = ["Humano", "Elfo", "Anão", "Halfling", "Gnomo", "Meio-elfo", "Meio-orc", "Tiefling", "Draconato", "Outro"];
  const ALIGNS = ["Legal Bom", "Neutro Bom", "Caótico Bom", "Legal Neutro", "Neutro", "Caótico Neutro", "Legal Mau", "Neutro Mau", "Caótico Mau"];
  const [form, setForm] = React.useState({ name: "", class: "Guerreiro", race: "Humano", background: "", alignment: "Neutro", level: "1" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
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
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NOME DO PERSONAGEM *</div>
          <input value={form.name} onChange={e => set("name", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="Kael, a Lâmina Perdida..." autoFocus style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CLASSE</div>
            <select value={form.class} onChange={e => set("class", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ESPÉCIE</div>
            <select value={form.race} onChange={e => set("race", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
              {RACES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>TENDÊNCIA</div>
            <select value={form.alignment} onChange={e => set("alignment", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
              {ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NÍVEL INICIAL</div>
            <input type="number" min="1" max="20" value={form.level} onChange={e => set("level", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ marginBottom: 26 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ANTECEDENTE / ORIGEM</div>
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

  useEffect(() => {
    if (!dirty) setChar(normalizeCS(CHARACTER));
  }, [CHARACTER]);

  const upd = (key, val) => { setChar(p => ({ ...p, [key]: val })); setDirty(true); setSaved(false); };
  const updNested = (key, sub, val) => { setChar(p => ({ ...p, [key]: { ...p[key], [sub]: val } })); setDirty(true); setSaved(false); };
  const updAbility = (abbr, score) => { setChar(p => ({ ...p, abilities: p.abilities.map(a => a.abbr === abbr ? { ...a, score: Math.max(1, Math.min(30, parseInt(score) || 10)) } : a) })); setDirty(true); setSaved(false); };
  const updSave = (abbr, val) => { setChar(p => ({ ...p, saves: { ...p.saves, [abbr]: val } })); setDirty(true); setSaved(false); };
  const updSkill = (name, key, val) => { setChar(p => ({ ...p, skills: p.skills.map(s => s.name === name ? { ...s, [key]: val } : s) })); setDirty(true); setSaved(false); };
  const updSpellSlot = (level, key, raw) => { const v = Math.max(0, Math.min(9, parseInt(raw) || 0)); setChar(p => ({ ...p, spellSlots: p.spellSlots.map(s => s.level === level ? { ...s, [key]: v } : s) })); setDirty(true); setSaved(false); };
  const updAttack = (i, key, val) => { setChar(p => ({ ...p, attacks: p.attacks.map((a, idx) => idx === i ? { ...a, [key]: val } : a) })); setDirty(true); setSaved(false); };
  const addAttack = () => { setChar(p => ({ ...p, attacks: [...p.attacks, { name: "", bonus: 0, dmg: "1d6", type: "Cortante", range: "Corpo-a-corpo", notes: "" }] })); setDirty(true); setSaved(false); };
  const rmAttack = (i) => { setChar(p => ({ ...p, attacks: p.attacks.filter((_, idx) => idx !== i) })); setDirty(true); setSaved(false); };
  const addSpell = () => { setChar(p => ({ ...p, spells: [...p.spells, { name: "", level: "T", school: "", castTime: "1 ação", range: "9m", c: false, r: false, m: false, notes: "" }] })); setDirty(true); setSaved(false); };
  const updSpell = (i, key, val) => { setChar(p => ({ ...p, spells: p.spells.map((s, idx) => idx === i ? { ...s, [key]: val } : s) })); setDirty(true); setSaved(false); };
  const rmSpell = (i) => { setChar(p => ({ ...p, spells: p.spells.filter((_, idx) => idx !== i) })); setDirty(true); setSaved(false); };

  const saveChar = () => {
    const res = window.AppData?.update("CHARACTER", char);
    if (res?.ok) { setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2200); }
  };

  // Derived
  const prof = csProfBonus(char.level || 1);
  const aMap = {};
  (char.abilities || []).forEach(a => { aMap[a.abbr] = csMod(a.score); });
  const percSkill = (char.skills || []).find(s => s.name === "Percepção");
  const percBonus = percSkill ? (percSkill.expert ? prof * 2 : percSkill.prof ? prof : 0) : 0;
  const passivePerc = 10 + (aMap.SAB || 0) + percBonus;
  const castAbbr = (char.spellcastingAttr || "").toUpperCase().slice(0, 3);
  const castMod = aMap[castAbbr] || 0;
  const spellDC = 8 + prof + castMod;
  const spellAtk = prof + castMod;

  // Empty state
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
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setShowCreate(true)} style={{ padding: "12px 24px", borderRadius: 12, background: "var(--t-accent)", border: "none", color: "#1a0e04", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Criar personagem</button>
              <button style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", border: "1px solid var(--t-border-strong)", color: "var(--t-text-soft)", fontSize: 14, cursor: "pointer" }}>Importar ficha</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hdrInp = (key, placeholder, extra = {}) => (
    <input value={char[key] || ""} onChange={e => upd(key, e.target.value)} placeholder={placeholder}
      style={{ ...csInp({ fontSize: 13, ...extra }) }} />
  );

  return (
    <div data-screen-label="Ficha">
      {/* ── Header ── */}
      <div className="glass" style={{ borderRadius: 18, padding: "18px 24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 0% 50%, rgba(218,162,90,0.08), transparent 55%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12 }}>
            <input
              value={char.name}
              onChange={e => upd("name", e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.3)", color: "var(--t-text)", fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 600, outline: "none", padding: "2px 0" }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {dirty && !saved && (
                <span className="mono" style={{ fontSize: 10, color: "rgba(218,162,90,0.6)", letterSpacing: 0.5 }}>● não salvo</span>
              )}
              {saved && (
                <span className="mono" style={{ fontSize: 10, color: "#7ba85d", letterSpacing: 0.5 }}>✓ salvo</span>
              )}
              <button onClick={saveChar} style={{ padding: "8px 20px", borderRadius: 10, background: dirty ? "var(--t-accent)" : "rgba(218,162,90,0.1)", border: "1px solid var(--t-border-strong)", color: dirty ? "#1a0e04" : "var(--t-text-mute)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Salvar ficha
              </button>
              <button onClick={() => { if (confirm("Isso apagará a ficha atual. Continuar?")) { window.AppData?.update("CHARACTER", {}); setDirty(false); } }} style={{ padding: "8px 12px", borderRadius: 10, background: "transparent", border: "1px solid rgba(194,85,85,0.3)", color: "#c25555", fontSize: 11, cursor: "pointer" }}>
                Apagar
              </button>
            </div>
          </div>
          {/* Meta row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {[
              { key: "origin", label: "ORIGEM" },
              { key: "species", label: "ESPÉCIE" },
              { key: "class", label: "CLASSE" },
              { key: "subclass", label: "SUBCLASSE" },
              { key: "alignment", label: "TENDÊNCIA" },
            ].map(f => (
              <div key={f.key}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 3 }}>{f.label}</div>
                {hdrInp(f.key, f.label.toLowerCase())}
              </div>
            ))}
            <div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 3 }}>NÍVEL</div>
              <input type="number" min="1" max="20" value={char.level} onChange={e => upd("level", parseInt(e.target.value) || 1)}
                style={{ ...csInp({ fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-accent-bright)", textAlign: "center" }) }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, padding: 4, background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid var(--t-border)" }}>
        {[["frente", "Frente"], ["magia", "Magia"], ["historico", "Histórico"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: tab === id ? "linear-gradient(180deg,var(--t-accent-tint),rgba(218,162,90,0.06))" : "transparent", border: tab === id ? "1px solid var(--t-border-strong)" : "1px solid transparent", color: tab === id ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)", fontSize: 13, fontWeight: 600 }}>{label}</button>
        ))}
      </div>

      {/* ══════════════════════ TAB: FRENTE ══════════════════════ */}
      {tab === "frente" && (
        <div>
          {/* ── Combat stats bar ── */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 120px 160px", gap: 12, marginBottom: 16 }}>
            {/* CA */}
            <div className="glass" style={{ borderRadius: 12, padding: "10px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#6da5c8" }} />
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 4 }}>CA</div>
              <input type="number" value={char.ac} onChange={e => upd("ac", parseInt(e.target.value) || 10)} style={{ ...csInp({ textAlign: "center", fontSize: 30, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-text)", width: "100%", padding: 0, borderBottom: "none" }) }} />
            </div>
            {/* Shield */}
            <div onClick={() => upd("shield", !char.shield)} className="glass" style={{ borderRadius: 12, padding: "10px 0", textAlign: "center", cursor: "pointer", border: char.shield ? "1px solid var(--t-border-active)" : "1px solid rgba(218,180,120,0.1)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: char.shield ? "var(--t-accent-bright)" : "rgba(218,180,120,0.2)" }} />
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 4 }}>ESCUDO</div>
              <div className="serif" style={{ fontSize: 22, color: char.shield ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>⛉</div>
              <div style={{ fontSize: 9, color: char.shield ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>{char.shield ? "+2 CA" : "sem"}</div>
            </div>
            {/* HP */}
            <div className="glass" style={{ borderRadius: 12, padding: "10px 16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#c25555" }} />
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 6 }}>PONTOS DE VIDA</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, alignItems: "end" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginBottom: 2 }}>ATUAL</div>
                  <input type="number" value={char.hp} onChange={e => upd("hp", Math.max(0, parseInt(e.target.value) ?? 0))} style={{ ...csInp({ textAlign: "center", fontSize: 36, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "#c25555", borderBottom: "none", padding: 0, width: "100%" }) }} />
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {[[-1, "#c25555"], [-5, "#c25555"], [+1, "#7ba85d"], [+5, "#7ba85d"]].map(([d, c]) => (
                      <button key={d} onClick={() => upd("hp", Math.max(0, Math.min(char.hpMax, char.hp + d)))} style={{ flex: 1, padding: "3px 0", borderRadius: 4, background: "rgba(0,0,0,0.3)", border: `1px solid ${c}40`, color: c, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{d > 0 ? `+${d}` : d}</button>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginBottom: 2 }}>TEMP</div>
                  <input type="number" value={char.hpTemp} onChange={e => upd("hpTemp", Math.max(0, parseInt(e.target.value) || 0))} style={{ ...csInp({ textAlign: "center", fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-text-soft)", borderBottom: "none", padding: 0, width: "100%" }) }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginBottom: 2 }}>MÁX</div>
                  <input type="number" value={char.hpMax} onChange={e => upd("hpMax", Math.max(0, parseInt(e.target.value) || 0))} style={{ ...csInp({ textAlign: "center", fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-text-soft)", borderBottom: "none", padding: 0, width: "100%" }) }} />
                </div>
              </div>
              <div style={{ height: 5, background: "rgba(0,0,0,0.4)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                <div style={{ width: `${char.hpMax ? Math.min(100, (char.hp / char.hpMax) * 100) : 0}%`, height: "100%", background: "linear-gradient(90deg, #c25555, #e07b7b)", borderRadius: 3 }} />
              </div>
            </div>
            {/* Hit Dice */}
            <div className="glass" style={{ borderRadius: 12, padding: "10px 12px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--t-accent)" }} />
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 6 }}>DADO DE VIDA</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginBottom: 2 }}>TOTAL</div>
                  <input value={char.hitDiceTotal} onChange={e => upd("hitDiceTotal", e.target.value)} placeholder="1d10" style={{ ...csInp({ textAlign: "center", fontSize: 15, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-accent-bright)", width: "100%", padding: 0, borderBottom: "none" }) }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginBottom: 2 }}>GASTO</div>
                  <input type="number" value={char.hitDiceUsed} onChange={e => upd("hitDiceUsed", Math.max(0, parseInt(e.target.value) || 0))} style={{ ...csInp({ textAlign: "center", fontSize: 18, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-text-soft)", width: "100%", padding: 0, borderBottom: "none" }) }} />
                </div>
              </div>
            </div>
            {/* Death saves */}
            <div className="glass" style={{ borderRadius: 12, padding: "10px 14px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#9d7bd8" }} />
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 8 }}>TESTE DE MORTE</div>
              {[["s", "SUCESSOS", "#7ba85d"], ["f", "FALHAS", "#c25555"]].map(([key, label, color]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color }}>▲ {label}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} onClick={() => updNested("deathSaves", key, char.deathSaves[key] > i ? i : i + 1)} style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${color}`, background: i < char.deathSaves[key] ? color : "transparent", cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Secondary stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "BÔNUS PROF.", value: `+${prof}`, display: true },
              { label: "INICIATIVA", key: "init", isInput: false, derived: csSign((aMap.DES || 0)) },
              { label: "VELOCIDADE", key: "speed", unit: "pés" },
              { label: "TAMANHO", key: "size", isText: true },
              { label: "PERCEPÇÃO PASSIVA", value: passivePerc, display: true },
              { label: "INSPIRAÇÃO HERÓICA", isInspiration: true },
            ].map((s, i) => (
              <div key={i} className="glass" style={{ padding: "10px 8px", borderRadius: 12, textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)", marginBottom: 6 }}>{s.label}</div>
                {s.isInspiration ? (
                  <div onClick={() => upd("heroicInspiration", !char.heroicInspiration)} style={{ cursor: "pointer" }}>
                    <div className="serif" style={{ fontSize: 28, color: char.heroicInspiration ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>✦</div>
                    <div style={{ fontSize: 9, color: char.heroicInspiration ? "var(--t-accent-bright)" : "var(--t-text-faint)", marginTop: 2 }}>{char.heroicInspiration ? "ativa" : "inativa"}</div>
                  </div>
                ) : s.display ? (
                  <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)" }}>{s.value}</div>
                ) : s.isText ? (
                  <input value={char[s.key] || ""} onChange={e => upd(s.key, e.target.value)} style={{ ...csInp({ textAlign: "center", fontSize: 13, borderBottom: "none", padding: 0, width: "100%" }) }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3 }}>
                    {s.key ? (
                      <input type="number" value={char[s.key] || 0} onChange={e => upd(s.key, parseInt(e.target.value) || 0)} style={{ ...csInp({ textAlign: "center", fontSize: 26, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-text)", borderBottom: "none", padding: 0, width: 60 }) }} />
                    ) : (
                      <span className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)" }}>{s.derived}</span>
                    )}
                    {s.unit && <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{s.unit}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Main grid: abilities | content ── */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>
            {/* Ability scores */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(char.abilities || []).map(ability => (
                <CSAbilityBlock
                  key={ability.abbr}
                  ability={ability}
                  saves={char.saves || {}}
                  skills={char.skills || []}
                  profBonus={prof}
                  onScoreChange={updAbility}
                  onSaveToggle={updSave}
                  onSkillToggle={updSkill}
                />
              ))}
            </div>

            {/* Right panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Weapons */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>ARMAS & TRUQUES DE DANO</div>
                  <button onClick={addAttack} style={{ padding: "4px 12px", borderRadius: 7, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, cursor: "pointer" }}>+ Adicionar</button>
                </div>
                <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1.6fr 32px", padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--t-border)" }} className="mono">
                    {["NOME", "BÔNUS", "DANO", "TIPO", "ANOTAÇÕES", ""].map((h, i) => (
                      <span key={i} style={{ fontSize: 8.5, letterSpacing: 1.2, color: "var(--t-text-mute)" }}>{h}</span>
                    ))}
                  </div>
                  {(char.attacks || []).map((a, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1.6fr 32px", padding: "8px 12px", borderBottom: i < char.attacks.length - 1 ? "1px dashed rgba(218,180,120,0.08)" : "none", alignItems: "center", gap: 4 }}>
                      <input value={a.name} onChange={e => updAttack(i, "name", e.target.value)} placeholder="Espada Longa" style={csInp({ fontSize: 13 })} />
                      <input value={a.bonus} onChange={e => updAttack(i, "bonus", e.target.value)} placeholder="+5" style={csInp({ fontSize: 13, textAlign: "center" })} />
                      <input value={a.dmg} onChange={e => updAttack(i, "dmg", e.target.value)} placeholder="1d8+3" style={csInp({ fontSize: 13 })} />
                      <input value={a.type} onChange={e => updAttack(i, "type", e.target.value)} placeholder="Cortante" style={csInp({ fontSize: 12 })} />
                      <input value={a.notes} onChange={e => updAttack(i, "notes", e.target.value)} placeholder="Versátil (1d10)" style={csInp({ fontSize: 12 })} />
                      <button onClick={() => rmAttack(i)} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", padding: 2 }}>✕</button>
                    </div>
                  ))}
                  {(char.attacks || []).length === 0 && (
                    <div style={{ padding: "16px 14px", color: "var(--t-text-faint)", fontSize: 12, textAlign: "center" }}>
                      Nenhuma arma. Clique em "+ Adicionar" para incluir.
                    </div>
                  )}
                </div>
              </div>

              {/* Class Features */}
              <div>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>CARACTERÍSTICAS DE CLASSE</div>
                <textarea value={char.classFeatures} onChange={e => upd("classFeatures", e.target.value)} placeholder="Lista de características da classe (ex: Ataque Extra, Estilo de Combate...)" rows={5} style={{ ...csTA({ width: "100%", boxSizing: "border-box", fontSize: 13 }) }} />
              </div>

              {/* Racial traits + Feats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>CARACTERÍSTICAS DE ESPÉCIE</div>
                  <textarea value={char.racialTraits} onChange={e => upd("racialTraits", e.target.value)} placeholder="Traços raciais e habilidades da espécie..." rows={4} style={{ ...csTA({ width: "100%", boxSizing: "border-box", fontSize: 12 }) }} />
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>TALENTOS</div>
                  <textarea value={char.feats} onChange={e => upd("feats", e.target.value)} placeholder="Talentos selecionados..." rows={4} style={{ ...csTA({ width: "100%", boxSizing: "border-box", fontSize: 12 }) }} />
                </div>
              </div>

              {/* Equipment/Proficiencies */}
              <div className="glass" style={{ borderRadius: 14, padding: "14px 16px" }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 12 }}>EQUIPAMENTO, TREINO & PROFICIÊNCIAS</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginBottom: 6 }}>TREINO DE ARMADURA</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["light", "Leve"], ["medium", "Média"], ["heavy", "Pesada"], ["shield", "Escudos"]].map(([k, label]) => (
                      <div key={k} onClick={() => updNested("armorTraining", k, !char.armorTraining?.[k])} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                        <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${char.armorTraining?.[k] ? "var(--t-accent-bright)" : "rgba(218,180,120,0.3)"}`, background: char.armorTraining?.[k] ? "var(--t-accent-tint)" : "transparent" }} />
                        <span style={{ fontSize: 11, color: char.armorTraining?.[k] ? "var(--t-text)" : "var(--t-text-mute)" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginBottom: 4 }}>ARMAS</div>
                  <input value={char.weaponProfs} onChange={e => upd("weaponProfs", e.target.value)} placeholder="Armas simples, marciais..." style={csInp({ fontSize: 12 })} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginBottom: 4 }}>FERRAMENTAS</div>
                  <input value={char.toolProfs} onChange={e => upd("toolProfs", e.target.value)} placeholder="Kit de ladrão, instrumentos..." style={csInp({ fontSize: 12 })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: MAGIA ══════════════════════ */}
      {tab === "magia" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
          {/* Left: casting stats + spell slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="glass" style={{ borderRadius: 14, padding: "16px 18px" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 14 }}>CONJURAÇÃO</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginBottom: 4 }}>ATRIBUTO DE CONJURAÇÃO</div>
                <select value={char.spellcastingAttr} onChange={e => upd("spellcastingAttr", e.target.value)} style={{ ...csInp({ fontSize: 13, borderBottom: "1px solid rgba(218,180,120,0.18)" }) }}>
                  <option value="">— nenhum —</option>
                  {CS_ABILITIES.map(a => <option key={a.abbr} value={a.abbr}>{a.name} ({a.abbr})</option>)}
                </select>
              </div>
              {[["MOD. DE CONJURAÇÃO", csSign(castMod)], ["CD DE RESISTÊNCIA", `${spellDC}`], ["BÔNUS DE ATAQUE", csSign(spellAtk)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed rgba(218,180,120,0.1)" }}>
                  <span style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{l}</span>
                  <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: castAbbr ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="glass" style={{ borderRadius: 14, padding: "14px 16px" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 12 }}>ESPAÇOS DE MAGIA</div>
              {(char.spellSlots || []).map(sl => (
                <div key={sl.level} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--t-text-mute)", width: 22 }}>Nv.{sl.level}</span>
                  <div style={{ display: "flex", gap: 3, flex: 1 }}>
                    {Array.from({ length: Math.max(sl.total, 5) }).map((_, i) => (
                      <div key={i} onClick={() => updSpellSlot(sl.level, "used", i < sl.used ? i : i + 1)} style={{
                        flex: 1, height: 18, borderRadius: 3, cursor: i < sl.total ? "pointer" : "default",
                        background: i < sl.total
                          ? (i < sl.used ? "rgba(0,0,0,0.3)" : "linear-gradient(180deg,var(--t-accent-tint),rgba(218,162,90,0.08))")
                          : "rgba(255,255,255,0.02)",
                        border: i < sl.total
                          ? (i < sl.used ? "1px solid rgba(218,180,120,0.15)" : "1px solid var(--t-border-active)")
                          : "1px dashed rgba(218,180,120,0.05)",
                        opacity: i < sl.total ? 1 : 0.3,
                      }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    <input type="number" min="0" max="9" value={sl.total} onChange={e => updSpellSlot(sl.level, "total", e.target.value)} style={{ ...csInp({ width: 28, textAlign: "center", fontSize: 11, padding: 0, borderBottom: "none" }) }} />
                    <span style={{ fontSize: 9, color: "var(--t-text-faint)" }}>tot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: spells table */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>TRUQUES & MAGIAS PREPARADAS</div>
              <button onClick={addSpell} style={{ padding: "4px 12px", borderRadius: 7, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, cursor: "pointer" }}>+ Magia</button>
            </div>
            <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "40px 1.8fr 80px 80px 100px 40px 40px 40px 1fr 28px", padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--t-border)" }} className="mono">
                {["NV", "NOME", "TEMPO", "ALCANCE", "ESCOLA", "C", "R", "M", "ANOTAÇÕES", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 8, letterSpacing: 1, color: "var(--t-text-mute)" }}>{h}</span>
                ))}
              </div>
              {(char.spells || []).map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1.8fr 80px 80px 100px 40px 40px 40px 1fr 28px", padding: "6px 10px", borderBottom: i < char.spells.length - 1 ? "1px dashed rgba(218,180,120,0.06)" : "none", alignItems: "center", gap: 3 }}>
                  <input value={s.level} onChange={e => updSpell(i, "level", e.target.value)} placeholder="T" style={csInp({ fontSize: 12, textAlign: "center", padding: 0 })} />
                  <input value={s.name} onChange={e => updSpell(i, "name", e.target.value)} placeholder="Nome da magia" style={csInp({ fontSize: 13 })} />
                  <input value={s.castTime} onChange={e => updSpell(i, "castTime", e.target.value)} placeholder="1 ação" style={csInp({ fontSize: 11 })} />
                  <input value={s.range} onChange={e => updSpell(i, "range", e.target.value)} placeholder="9m" style={csInp({ fontSize: 11 })} />
                  <input value={s.school} onChange={e => updSpell(i, "school", e.target.value)} placeholder="Evocação" style={csInp({ fontSize: 11 })} />
                  {["c", "r", "m"].map(k => (
                    <div key={k} onClick={() => updSpell(i, k, !s[k])} style={{ width: 22, height: 22, borderRadius: 5, border: `1.5px solid ${s[k] ? "var(--t-accent-bright)" : "rgba(218,180,120,0.2)"}`, background: s[k] ? "var(--t-accent-tint)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s[k] && <span style={{ fontSize: 10, color: "var(--t-accent-bright)" }}>✓</span>}
                    </div>
                  ))}
                  <input value={s.notes} onChange={e => updSpell(i, "notes", e.target.value)} placeholder="Anotações..." style={csInp({ fontSize: 11 })} />
                  <button onClick={() => rmSpell(i)} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                </div>
              ))}
              {(char.spells || []).length === 0 && (
                <div style={{ padding: "20px 14px", color: "var(--t-text-faint)", fontSize: 12, textAlign: "center" }}>
                  Nenhuma magia adicionada.
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 6 }}>C = Concentração · R = Ritual · M = Material</div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: HISTÓRICO ══════════════════════ */}
      {tab === "historico" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>APARÊNCIA</div>
              <textarea value={char.appearance} onChange={e => upd("appearance", e.target.value)} placeholder="Descreva a aparência física do personagem: altura, olhos, cabelo, marcas, traços distintivos..." rows={5} style={{ ...csTA({ width: "100%", boxSizing: "border-box", fontSize: 13 }) }} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>HISTÓRIA & PERSONALIDADE</div>
              <textarea value={char.historyPersonality} onChange={e => upd("historyPersonality", e.target.value)} placeholder="Backstory, traços de personalidade, ideais, vínculos e fraquezas do personagem..." rows={9} style={{ ...csTA({ width: "100%", boxSizing: "border-box", fontSize: 13 }) }} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>IDIOMAS</div>
              <textarea value={char.languages} onChange={e => upd("languages", e.target.value)} placeholder="Comum, Élfico, Abissal..." rows={3} style={{ ...csTA({ width: "100%", boxSizing: "border-box", fontSize: 13 }) }} />
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>EQUIPAMENTO</div>
                <button onClick={() => upd("inventory", [...(char.inventory || []), { name: "", qty: 1, weight: 0 }])} style={{ padding: "3px 10px", borderRadius: 6, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, cursor: "pointer" }}>+ Item</button>
              </div>
              <div className="glass" style={{ borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px 24px", padding: "6px 10px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--t-border)" }}>
                  {["ITEM", "QTD", "PESO", ""].map((h, i) => (
                    <span key={i} className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "var(--t-text-faint)" }}>{h}</span>
                  ))}
                </div>
                {(char.inventory || []).map((it, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px 24px", padding: "6px 10px", borderBottom: i < char.inventory.length - 1 ? "1px dashed rgba(218,180,120,0.06)" : "none", alignItems: "center" }}>
                    <input value={it.name} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], name: e.target.value }; upd("inventory", inv); }} placeholder="Item..." style={csInp({ fontSize: 12 })} />
                    <input type="number" value={it.qty} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], qty: parseInt(e.target.value) || 1 }; upd("inventory", inv); }} style={csInp({ fontSize: 12, textAlign: "center" })} />
                    <input type="number" step="0.1" value={it.weight} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], weight: parseFloat(e.target.value) || 0 }; upd("inventory", inv); }} style={csInp({ fontSize: 12, textAlign: "center" })} />
                    <button onClick={() => upd("inventory", char.inventory.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", fontSize: 13 }}>✕</button>
                  </div>
                ))}
                {(char.inventory || []).length === 0 && (
                  <div style={{ padding: "14px", color: "var(--t-text-faint)", fontSize: 12, textAlign: "center" }}>Nenhum item</div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, fontSize: 11, color: "var(--t-text-mute)" }}>
                Carga total: {((char.inventory || []).reduce((s, it) => s + (it.weight || 0) * (it.qty || 1), 0)).toFixed(1)} kg
              </div>
            </div>

            {/* Magic item attunement */}
            <div className="glass" style={{ borderRadius: 12, padding: "14px 16px" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 10 }}>SINTONIZAÇÃO DE ITEM MÁGICO</div>
              {(char.magicItems || ["", "", ""]).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "var(--t-accent)" }}>✦</span>
                  <input value={item} onChange={e => { const arr = [...(char.magicItems || ["", "", ""])]; arr[i] = e.target.value; upd("magicItems", arr); }} placeholder={`Item mágico ${i + 1}...`} style={csInp({ flex: 1, fontSize: 13 })} />
                </div>
              ))}
            </div>

            {/* Money */}
            <div className="glass" style={{ borderRadius: 12, padding: "14px 16px" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 12 }}>MOEDAS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {[["cp", "Cobre", "#c8643a"], ["pp", "Prata", "#cdd5dd"], ["pe", "Eletro", "#9d7bd8"], ["po", "Ouro", "var(--t-accent-bright)"], ["pl", "Platina", "#a3d4e8"]].map(([k, label, color]) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, margin: "0 auto 4px" }} />
                    <div style={{ fontSize: 9, color: "var(--t-text-faint)", marginBottom: 4 }}>{label.toUpperCase()}</div>
                    <input type="number" min="0" value={(char.money || {})[k] || 0} onChange={e => updNested("money", k, Math.max(0, parseInt(e.target.value) || 0))} style={{ ...csInp({ textAlign: "center", fontSize: 18, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color, borderBottom: "none", padding: 0, width: "100%" }) }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.CharacterSheet = CharacterSheet;
