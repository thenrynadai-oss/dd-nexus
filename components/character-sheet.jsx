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
const CS_SPELL_SCHOOLS = ["Abjuração", "Adivinhação", "Convocação", "Encantamento", "Evocação", "Ilusão", "Necromancia", "Transmutação"];

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
    photo: r.photo || "",
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
  style: { fontSize: 8.5, letterSpacing: 1.5, color: "rgba(218,180,120,0.45)", textAlign: "center",
    paddingBottom: 5, marginBottom: 7, borderBottom: "1px solid rgba(218,180,120,0.1)" }
}, text);
const csSelect = { background: "rgba(0,0,0,0.35)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text-soft)", outline: "none", padding: "7px 10px", fontSize: 13, width: "100%", cursor: "pointer" };
const csModalInp = { width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" };

// ─── CSAbilityScore ───────────────────────────────────────────────────────────
const CSAbilityScore = ({ ability, onScoreChange }) => {
  const mod = csMod(ability.score);
  return (
    <div className="glass" style={{ borderRadius: 10, padding: "8px 6px", textAlign: "center", border: "1px solid rgba(218,180,120,0.08)" }}>
      <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.4, color: "rgba(218,180,120,0.42)", marginBottom: 5 }}>
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

// ─── CharacterPhotoModal ──────────────────────────────────────────────────────
function _resizeToDataURL(file, maxSide = 800) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const CharacterPhotoModal = ({ photo, onSave, onClose }) => {
  const [preview, setPreview] = React.useState(photo || "");
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading]   = React.useState(false);
  const fileRef = React.useRef(null);

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setLoading(true);
    const data = await _resizeToDataURL(file);
    setPreview(data);
    setLoading(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong" style={{ width: 460, borderRadius: 22, padding: 30 }}>

        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)" }}>Personalizar Personagem</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 6 }}><Icon name="close" size={16} /></button>
        </div>

        {/* Zona de drop */}
        <div
          onClick={() => !loading && fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDragEnd={() => setDragging(false)}
          style={{
            height: 200, borderRadius: 14, marginBottom: 20,
            border: `2px dashed ${dragging ? "var(--t-accent-bright)" : preview ? "var(--t-border-strong)" : "var(--t-border)"}`,
            background: dragging
              ? "rgba(218,162,90,0.09)"
              : preview ? "transparent" : "rgba(218,162,90,0.025)",
            cursor: loading ? "wait" : "pointer",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 160ms, background 160ms",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--t-text-mute)", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              Processando imagem…
            </div>
          ) : preview ? (
            <>
              <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={() => setPreview("")} />
              {/* Overlay hover */}
              <div className="photo-overlay" style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
                background: "rgba(0,0,0,0.52)", opacity: 0, transition: "opacity 180ms",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ fontSize: 22 }}>🔄</div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Trocar imagem</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", pointerEvents: "none", padding: "0 24px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🖼️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text-soft)", marginBottom: 6 }}>
                Arraste sua imagem aqui
              </div>
              <div style={{ fontSize: 12.5, color: "var(--t-text-mute)", marginBottom: 4 }}>
                ou clique para escolher um arquivo
              </div>
              <div style={{ fontSize: 10.5, color: "var(--t-text-faint)" }}>PNG · JPG · WEBP</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Compartilhar - em breve */}
        <div style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(218,162,90,0.04)", border: "1px solid var(--t-border)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <Icon name="share" size={13} style={{ color: "var(--t-accent)" }} />
            <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)" }}>COMPARTILHAR FICHA</div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t-text-faint)", lineHeight: 1.55 }}>
            Compartilhamento via link público e exportação em PDF chegará em breve ✦
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onSave(preview)} disabled={loading || !preview}
            style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: preview && !loading ? "var(--t-accent)" : "rgba(218,162,90,0.25)", border: "none", color: "#1a0e04", fontSize: 13, fontWeight: 700, cursor: preview && !loading ? "pointer" : "not-allowed" }}>
            Salvar foto
          </button>
          {photo && (
            <button onClick={() => { setPreview(""); onSave(""); }}
              style={{ padding: "12px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(194,85,85,0.35)", color: "#c25555", fontSize: 13, cursor: "pointer" }}>
              Remover
            </button>
          )}
          <button onClick={onClose}
            style={{ padding: "12px 16px", borderRadius: 10, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AddSpellModal ────────────────────────────────────────────────────────────
const AddSpellModal = ({ targetLevel, onAdd, onClose }) => {
  const { COMPENDIUM = [] } = useAppMock();
  const custom = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("compendium-custom") || "[]"); } catch { return []; }
  }, []);
  const allSpells = React.useMemo(() => [...custom, ...COMPENDIUM].filter(e => e.type === "Magia"), [custom, COMPENDIUM]);

  const [filterLv, setFilterLv] = React.useState(targetLevel !== undefined ? String(targetLevel) : "todos");
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState(null);

  const spellLvToNum = (v) => {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v;
    if (v === "Truque") return 0;
    const m = String(v).match(/\d+/);
    return m ? parseInt(m[0]) : 0;
  };
  const filtered = allSpells.filter(s => {
    if (filterLv !== "todos" && spellLvToNum(s.lvl ?? s.level) !== parseInt(filterLv)) return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong" style={{ width: 580, maxHeight: "84vh", borderRadius: 22, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--t-border)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--t-text)" }}>Adicionar Magia</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 6 }}><Icon name="close" size={16} /></button>
          </div>

          {/* Level filter */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
            {["todos", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map(lv => (
              <button key={lv} onClick={() => setFilterLv(lv)} style={{
                padding: "5px 13px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                background: filterLv === lv ? "linear-gradient(180deg, rgba(218,162,90,0.2), rgba(218,162,90,0.06))" : "rgba(255,245,220,0.03)",
                border: filterLv === lv ? "1px solid var(--t-border-active)" : "1px solid var(--t-border)",
                color: filterLv === lv ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)",
              }}>{lv === "todos" ? "Todos" : lv === "0" ? "Truque" : `N${lv}`}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Icon name="search" size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-mute)" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar magia..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--t-text-mute)" }}>
              <Icon name="book" size={32} style={{ color: "rgba(218,180,120,0.15)", marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, marginBottom: 6 }}>Nenhuma magia encontrada no compêndio</div>
              <div style={{ fontSize: 11.5, color: "var(--t-text-faint)" }}>Use "Crie sua magia" para adicionar magias personalizadas ao compêndio.</div>
            </div>
          ) : filtered.map((sp, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div onClick={() => setExpanded(expanded === i ? null : i)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, background: "rgba(255,245,220,0.02)", border: "1px solid var(--t-border)", cursor: "pointer", transition: "border-color 180ms" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--t-border-strong)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--t-border)"}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--t-accent)", flexShrink: 0, opacity: 0.6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text)" }}>{sp.name}</div>
                  {(sp.school || sp.lvl !== undefined) && (
                    <div className="mono" style={{ fontSize: 10, color: "var(--t-text-mute)", marginTop: 2 }}>
                      {[sp.lvl !== undefined ? (typeof sp.lvl === "string" ? sp.lvl : sp.lvl === 0 ? "Truque" : `Nível ${sp.lvl}`) : null, sp.school].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); onAdd(sp); }}
                  style={{ padding: "6px 16px", borderRadius: 8, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  + Adicionar
                </button>
              </div>
              {expanded === i && sp.desc && (
                <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.22)", borderRadius: "0 0 10px 10px", border: "1px solid var(--t-border)", borderTop: "none", marginTop: -4, fontSize: 12.5, color: "var(--t-text-soft)", lineHeight: 1.65 }}>
                  {sp.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── CreateSpellModal ─────────────────────────────────────────────────────────
const CreateSpellModal = ({ defaultLevel, onSave, onClose }) => {
  const [form, setForm] = React.useState({
    name: "", lvl: defaultLevel !== undefined ? defaultLevel : 1,
    school: "Evocação", castTime: "1 ação", range: "9m",
    components: "V, S", duration: "Instantâneo", desc: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const entry = { ...form, id: `custom-${Date.now()}`, type: "Magia", name: form.name.trim() };
    try {
      const stored = JSON.parse(localStorage.getItem("compendium-custom") || "[]");
      localStorage.setItem("compendium-custom", JSON.stringify([entry, ...stored]));
    } catch {}
    window.dispatchEvent(new Event("vg:compendium-update"));
    onSave(entry);
  };

  const fInp = (k, ph, type = "text") => (
    <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
      style={csModalInp} />
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong" style={{ width: 520, maxHeight: "90vh", borderRadius: 22, overflowY: "auto", padding: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--t-text)" }}>Nova Magia</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 6 }}><Icon name="close" size={16} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NOME *</div>
          {fInp("name", "Bola de Fogo, Cura Ferimentos...")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ESCOLA</div>
            <select value={form.school} onChange={e => set("school", e.target.value)} style={csSelect}>
              {CS_SPELL_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NÍVEL</div>
            <select value={form.lvl} onChange={e => set("lvl", parseInt(e.target.value))} style={csSelect}>
              <option value={0}>Truque (0)</option>
              {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>Nível {n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CONJURAÇÃO</div>{fInp("castTime", "1 ação")}</div>
          <div><div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ALCANCE</div>{fInp("range", "9m")}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>COMPONENTES</div>{fInp("components", "V, S, M")}</div>
          <div><div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>DURAÇÃO</div>{fInp("duration", "Instantâneo")}</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>DESCRIÇÃO</div>
          <textarea value={form.desc} onChange={e => set("desc", e.target.value)} rows={5}
            placeholder="Descreva o efeito da magia..."
            style={{ ...csTA({ fontSize: 13 }) }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={!form.name.trim()}
            style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: form.name.trim() ? "var(--t-accent)" : "rgba(218,162,90,0.15)", border: "none", color: form.name.trim() ? "#1a0e04" : "var(--t-text-mute)", fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "default" }}>
            Salvar e Adicionar à Ficha
          </button>
          <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 10, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>

        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(157,123,216,0.06)", border: "1px solid rgba(157,123,216,0.18)", fontSize: 11.5, color: "rgba(201,176,232,0.7)", lineHeight: 1.5 }}>
          ✦ A magia criada também será salva automaticamente no seu Compêndio para uso futuro.
        </div>
      </div>
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
    const heroData = {
      name: form.name.trim(), class: form.class, species: form.race,
      background: form.background, alignment: form.alignment,
      level: parseInt(form.level) || 1, hp: 0, hpMax: 0, ac: 10, speed: 30,
    };
    window.Auth?.addHero?.(heroData);
    window.dispatchEvent(new Event("vg:auth-update"));
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
          <input value={form.name} onChange={e => set("name", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="Kael, a Lâmina Perdida..." autoFocus style={csModalInp} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CLASSE</div><select value={form.class} onChange={e => set("class", e.target.value)} style={csSelect}>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>RAÇA</div><select value={form.race} onChange={e => set("race", e.target.value)} style={csSelect}>{RACES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>TENDÊNCIA</div><select value={form.alignment} onChange={e => set("alignment", e.target.value)} style={csSelect}>{ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NÍVEL</div><input type="number" min="1" max="20" value={form.level} onChange={e => set("level", e.target.value)} style={{ ...csModalInp, textAlign: "center" }} /></div>
        </div>
        <div style={{ marginBottom: 26 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ANTECEDENTE</div>
          <input value={form.background} onChange={e => set("background", e.target.value)} placeholder="Nobre, Errante, Soldado..." style={csModalInp} />
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
const CharacterSheet = ({ heroIndex }) => {
  const { CHARACTER = {} } = useAppMock();
  const [char, setChar] = useState(() => {
    if (heroIndex != null) {
      const heroes = window.Auth?.getHeroes?.() || [];
      if (heroes[heroIndex]) return normalizeCS(heroes[heroIndex]);
    }
    return normalizeCS(CHARACTER);
  });
  const [tab, setTab] = useState("frente");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [addSpellModal, setAddSpellModal] = useState(null); // level number or null
  const [showCreateSpell, setShowCreateSpell] = useState(false);

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
  const updSpellPrep = (lv, idx) => {
    setChar(p => { const lists = [...p.spellLists]; lists[lv] = lists[lv].map((s, i) => i !== idx ? s : { ...s, prepared: !s.prepared }); return { ...p, spellLists: lists }; });
    mark();
  };
  const addSpellFromCompendium = (sp, levelOverride) => {
    const lv = sp.lvl !== undefined ? Number(sp.lvl) : (levelOverride !== undefined ? levelOverride : 0);
    setChar(p => {
      const lists = [...p.spellLists];
      if (!lists[lv]) lists[lv] = [];
      if (!lists[lv].some(s => s.name === sp.name)) {
        lists[lv] = [...lists[lv], { name: sp.name, prepared: false }];
      }
      return { ...p, spellLists: lists };
    });
    mark();
  };
  const removeSpell = (lv, spellName) => {
    setChar(p => {
      const lists = [...p.spellLists];
      lists[lv] = lists[lv].filter(s => s.name !== spellName);
      return { ...p, spellLists: lists };
    });
    mark();
  };

  const saveChar = () => {
    let ok = false;
    if (heroIndex != null) {
      const res = window.Auth?.updateHero?.(heroIndex, char);
      ok = !!res?.ok;
    } else {
      const heroes = window.Auth?.getHeroes?.() || [];
      const existIdx = heroes.findIndex(h => h.name === char.name);
      if (existIdx >= 0) window.Auth?.updateHero?.(existIdx, char);
      else if (char.name) window.Auth?.addHero?.(char);
      const res = window.AppData?.update("CHARACTER", char);
      ok = !!res?.ok;
    }
    if (ok) {
      window.dispatchEvent(new Event("vg:auth-update"));
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2900);
    }
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
            <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: "var(--t-text)", marginBottom: 12 }}>Nenhuma ficha criada ainda</div>
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
      style={{ ...csInp({ fontSize: 13, ...extra }) }} />
  );

  // ── stat cell ──
  const StatCell = ({ label, children, accent = "rgba(218,162,90,0.25)" }) => (
    <div className="glass" style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div data-screen-label="Ficha">

      {/* ── Modals ── */}
      {showPhotoModal && (
        <CharacterPhotoModal photo={char.photo} onSave={(url) => { upd("photo", url); setShowPhotoModal(false); }} onClose={() => setShowPhotoModal(false)} />
      )}
      {addSpellModal !== null && (
        <AddSpellModal
          targetLevel={addSpellModal}
          onAdd={(sp) => { addSpellFromCompendium(sp, addSpellModal); setAddSpellModal(null); }}
          onClose={() => setAddSpellModal(null)}
        />
      )}
      {showCreateSpell && (
        <CreateSpellModal
          defaultLevel={1}
          onSave={(entry) => { addSpellFromCompendium(entry); setShowCreateSpell(false); }}
          onClose={() => setShowCreateSpell(false)}
        />
      )}

      {/* ══ HEADER ══ */}
      <div className="glass" style={{ borderRadius: 18, padding: "18px 22px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 0% 50%, rgba(218,162,90,0.07), transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* ── Photo ── */}
          <div
            onClick={() => setShowPhotoModal(true)}
            title="Clique para alterar foto"
            style={{
              width: 96, height: 96, borderRadius: 16, flexShrink: 0, cursor: "pointer",
              overflow: "hidden", position: "relative",
              border: "1px solid var(--t-border-strong)",
              boxShadow: char.photo ? "0 0 28px -8px var(--t-accent-glow)" : "none",
              background: "linear-gradient(135deg, rgba(218,162,90,0.1), rgba(157,123,216,0.07))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {char.photo
              ? <img src={char.photo} alt="Personagem" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Icon name="shield" size={32} style={{ color: "rgba(218,180,120,0.22)" }} />
            }
            {/* hover overlay */}
            <div className="photo-overlay" style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 200ms",
            }}>
              <Icon name="camera" size={20} style={{ color: "#fff" }} />
            </div>
            <style>{`.photo-overlay:hover,.glass:hover .photo-overlay{opacity:1}`}</style>
          </div>

          {/* ── Info ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <input value={char.name} onChange={e => upd("name", e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.28)", color: "var(--t-text)", fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 600, outline: "none", padding: "2px 0", lineHeight: 1.1 }} />
              <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                {dirty && !saved && <span className="mono" style={{ fontSize: 9.5, color: "rgba(218,162,90,0.6)" }}>● não salvo</span>}
                {saved && <span className="mono" style={{ fontSize: 9.5, color: "#7ba85d" }}>✓ salvo</span>}
                <button onClick={saveChar} style={{ padding: "8px 20px", borderRadius: 10, background: dirty ? "var(--t-accent)" : "rgba(218,162,90,0.1)", border: "1px solid var(--t-border-strong)", color: dirty ? "#1a0e04" : "var(--t-text-mute)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  Salvar
                </button>
                <button onClick={() => setShowPhotoModal(true)} title="Configurações do personagem"
                  style={{ padding: "8px 11px", borderRadius: 10, background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", cursor: "pointer" }}>
                  <Icon name="settings" size={15} />
                </button>
                <button onClick={() => { if (confirm("Apagar ficha permanentemente?")) { window.AppData?.update("CHARACTER", {}); setDirty(false); } }}
                  title="Apagar ficha"
                  style={{ padding: "8px 11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(194,85,85,0.3)", color: "#c25555", cursor: "pointer" }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 62px", gap: 10 }}>
              {[["class", "CLASSE & SUBCLASSE"], ["origin", "ANTECEDENTE"], ["player", "JOGADOR"], ["species", "RAÇA"], ["alignment", "TENDÊNCIA"]].map(([k, lbl]) => (
                <div key={k}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 3 }}>{lbl}</div>
                  {inp(k, lbl.toLowerCase())}
                </div>
              ))}
              <div>
                <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 3 }}>NÍVEL</div>
                <input type="number" min="1" max="20" value={char.level}
                  onChange={e => upd("level", Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  style={{ ...csInp({ fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-accent-bright)", textAlign: "center" }) }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div style={{ display: "flex", gap: 3, marginBottom: 14, padding: 4, background: "rgba(0,0,0,0.32)", borderRadius: 12, border: "1px solid var(--t-border)" }}>
        {[["frente", "Frente"], ["magia", "Magia"], ["historico", "Histórico"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: tab === id ? "linear-gradient(180deg,var(--t-accent-tint),rgba(218,162,90,0.05))" : "transparent", border: tab === id ? "1px solid var(--t-border-strong)" : "1px solid transparent", color: tab === id ? "var(--t-accent-bright)" : "rgba(232,227,214,0.55)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", letterSpacing: 0.3 }}>
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
            <div style={{ display: "flex", gap: 7, marginBottom: 9 }}>
              <div onClick={() => upd("heroicInspiration", !char.heroicInspiration)} className="glass-strong"
                style={{ flex: 1, borderRadius: 8, padding: "7px 5px", textAlign: "center", cursor: "pointer", border: char.heroicInspiration ? "1px solid var(--t-border-active)" : "1px solid rgba(218,180,120,0.07)" }}>
                <div style={{ fontSize: 15, color: char.heroicInspiration ? "var(--t-accent-bright)" : "var(--t-text-faint)" }}>◆</div>
                <div className="mono" style={{ fontSize: 7, letterSpacing: 1, color: "rgba(218,180,120,0.4)", marginTop: 2 }}>INSPIRAÇÃO</div>
              </div>
              <div className="glass-strong" style={{ flex: 1, borderRadius: 8, padding: "7px 5px", textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--t-accent-bright)", lineHeight: 1 }}>+{prof}</div>
                <div className="mono" style={{ fontSize: 7, letterSpacing: 1, color: "rgba(218,180,120,0.4)", marginTop: 2 }}>BÔNUS PROF.</div>
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
              <div className="mono" style={{ fontSize: 7, letterSpacing: 1, color: "rgba(218,180,120,0.4)", marginTop: 1 }}>SABEDORIA PASSIVA (PERCEPÇÃO)</div>
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
                <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)" }}>PV TOTAIS</div>
                <input type="number" value={char.hpMax} onChange={e => upd("hpMax", Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 50, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 13, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "rgba(218,180,120,0.6)" }} />
              </div>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginBottom: 4 }}>PONTOS DE VIDA ATUAIS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={char.hp} onChange={e => upd("hp", Math.max(0, parseInt(e.target.value) ?? 0))}
                  style={{ flex: 1, textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 40, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: char.hpMax > 0 && char.hp / char.hpMax < 0.3 ? "#c25555" : "var(--t-text)", padding: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {[[-5, "#c25555"], [-1, "#c25555"], [+1, "#7ba85d"], [+5, "#7ba85d"]].map(([d, c]) => (
                    <button key={d} onClick={() => upd("hp", Math.max(0, Math.min(char.hpMax, char.hp + d)))}
                      style={{ padding: "2px 8px", borderRadius: 5, background: `${c}18`, border: `1px solid ${c}45`, color: c, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 4, background: "rgba(0,0,0,0.4)", borderRadius: 2, marginTop: 7, overflow: "hidden" }}>
                <div style={{ width: `${char.hpMax ? Math.min(100, (char.hp / char.hpMax) * 100) : 0}%`, height: "100%", background: "linear-gradient(90deg,#c25555,#e07b7b)", borderRadius: 2 }} />
              </div>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginTop: 9, marginBottom: 3 }}>PONTOS DE VIDA TEMPORÁRIOS</div>
              <input type="number" value={char.hpTemp} onChange={e => upd("hpTemp", Math.max(0, parseInt(e.target.value) || 0))}
                style={{ width: "100%", textAlign: "center", background: "transparent", border: "none", borderBottom: "1px dashed rgba(218,180,120,0.14)", outline: "none", fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-text-soft)" }} />
            </div>

            {/* Hit Dice + Death Saves */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="glass" style={{ borderRadius: 10, padding: "9px 12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--t-accent)" }} />
                <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginBottom: 6 }}>DADOS DE VIDA</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[["TOTAL", "hitDiceTotal", false, "1d10"], ["GASTO", "hitDiceUsed", true, "0"]].map(([lbl, key, isNum, ph]) => (
                    <div key={key} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: "var(--t-text-faint)", marginBottom: 2 }}>{lbl}</div>
                      <input {...(isNum ? { type: "number" } : {})} value={char[key]} onChange={e => upd(key, isNum ? Math.max(0, parseInt(e.target.value) || 0) : e.target.value)} placeholder={ph}
                        style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: isNum ? 18 : 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-accent-bright)", width: "100%", padding: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ borderRadius: 10, padding: "9px 12px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#9d7bd8" }} />
                <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginBottom: 7 }}>TESTES CONTRA A MORTE</div>
                {[["s", "SUCESSOS", "#7ba85d"], ["f", "FALHAS", "#c25555"]].map(([key, lbl, color]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontSize: 9.5, color }}>▲ {lbl}</div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "rgba(218,180,120,0.45)" }}>ATAQUES E MAGIAS</div>
                <button onClick={addAttack} style={{ padding: "5px 14px", borderRadius: 8, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  + Adicionar
                </button>
              </div>
              <div className="glass" style={{ borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 1fr 20px", padding: "7px 10px", background: "rgba(0,0,0,0.28)" }}>
                  {["NOME", "BÔNUS", "DANO / TIPO", ""].map((h, i) => (
                    <span key={i} className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "rgba(218,180,120,0.4)" }}>{h}</span>
                  ))}
                </div>
                {(char.attacks || []).map((a, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 72px 1fr 20px", padding: "6px 10px", borderBottom: i < char.attacks.length - 1 ? "1px dashed rgba(218,180,120,0.07)" : "none", alignItems: "center", gap: 3 }}>
                    <input value={a.name || ""} onChange={e => updAttack(i, "name", e.target.value)} placeholder="Espada longa" style={csInp({ fontSize: 12 })} />
                    <input value={a.bonus || ""} onChange={e => updAttack(i, "bonus", e.target.value)} placeholder="+5" style={csInp({ fontSize: 12, textAlign: "center" })} />
                    <input value={a.dmg || ""} onChange={e => updAttack(i, "dmg", e.target.value)} placeholder="1d8+3 cortante" style={csInp({ fontSize: 12 })} />
                    <button onClick={() => rmAttack(i)} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", padding: 0, fontSize: 14 }}>✕</button>
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
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "rgba(218,180,120,0.4)", marginBottom: 4 }}>PONTOS DE EXPERIÊNCIA</div>
              <input type="number" min="0" value={char.xp} onChange={e => upd("xp", Math.max(0, parseInt(e.target.value) || 0))}
                style={{ background: "transparent", border: "none", outline: "none", textAlign: "center", fontSize: 22, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: "var(--t-accent-bright)", width: "100%", padding: 0 }} />
            </div>
            <div className="glass" style={{ borderRadius: 10, padding: "9px 11px" }}>
              {csSec("TREINAMENTO DE ARMADURA")}
              <div onClick={() => upd("shield", !char.shield)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ width: 11, height: 11, borderRadius: 2, border: `1.5px solid ${char.shield ? "var(--t-accent-bright)" : "rgba(218,180,120,0.22)"}`, background: char.shield ? "var(--t-accent-tint)" : "transparent" }} />
                <span style={{ fontSize: 11.5, color: char.shield ? "var(--t-text)" : "var(--t-text-mute)" }}>Escudo (+2 CA)</span>
              </div>
              {[["light", "Leve"], ["medium", "Média"], ["heavy", "Pesada"]].map(([k, lbl]) => (
                <div key={k} onClick={() => updNested("armorTraining", k, !char.armorTraining?.[k])}
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, cursor: "pointer" }}>
                  <div style={{ width: 11, height: 11, borderRadius: 2, border: `1.5px solid ${char.armorTraining?.[k] ? "var(--t-accent-bright)" : "rgba(218,180,120,0.22)"}`, background: char.armorTraining?.[k] ? "var(--t-accent-tint)" : "transparent" }} />
                  <span style={{ fontSize: 11.5, color: char.armorTraining?.[k] ? "var(--t-text)" : "var(--t-text-mute)" }}>Armadura {lbl}</span>
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
          <div className="glass" style={{ borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 16, alignItems: "end" }}>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "rgba(218,180,120,0.45)", marginBottom: 5 }}>CLASSE DE CONJURADOR</div>
              <input value={char.spellcastingClass || ""} onChange={e => upd("spellcastingClass", e.target.value)} placeholder="Mago, Clérigo..."
                style={csInp({ fontSize: 15 })} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "rgba(218,180,120,0.45)", marginBottom: 5 }}>HABILIDADE CHAVE</div>
              <select value={char.spellcastingAttr || ""} onChange={e => upd("spellcastingAttr", e.target.value)}
                style={{ background: "rgba(0,0,0,0.32)", border: "1px solid var(--t-border)", borderRadius: 8, color: "var(--t-text-soft)", outline: "none", width: "100%", fontSize: 13, padding: "5px 8px", cursor: "pointer" }}>
                <option value="">— nenhuma —</option>
                {CS_ABILITIES.map(a => <option key={a.abbr} value={a.abbr}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "rgba(218,180,120,0.45)", marginBottom: 6 }}>CD DO TR</div>
              <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: castAbbr ? "var(--t-accent-bright)" : "var(--t-text-faint)", lineHeight: 1 }}>{spellDC}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "rgba(218,180,120,0.45)", marginBottom: 6 }}>BÔNUS DE ATAQUE</div>
              <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: castAbbr ? "var(--t-accent-bright)" : "var(--t-text-faint)", lineHeight: 1 }}>{csSign(spellAtk)}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setAddSpellModal(0)}
              style={{ padding: "9px 20px", borderRadius: 10, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="plus" size={13} /> Adicionar magia
            </button>
            <button onClick={() => setShowCreateSpell(true)}
              style={{ padding: "9px 20px", borderRadius: 10, background: "rgba(157,123,216,0.1)", border: "1px solid rgba(157,123,216,0.3)", color: "#c9b0e8", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="feather" size={13} /> Crie sua magia
            </button>
          </div>

          {/* Spell levels */}
          {[0,1,2,3,4,5,6,7,8,9].map(lv => {
            const slot = lv > 0 ? (char.spellSlots || []).find(s => s.level === lv) : null;
            const spells = ((char.spellLists || [])[lv] || []).filter(s => s.name && s.name.trim());
            return (
              <div key={lv} className="glass" style={{ borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
                {/* Level header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(0,0,0,0.18)", borderBottom: spells.length ? "1px solid rgba(218,180,120,0.07)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(218,162,90,0.12)", border: "1px solid rgba(218,180,120,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="serif" style={{ fontSize: 16, fontWeight: 700, color: "var(--t-accent-bright)" }}>{lv === 0 ? "T" : lv}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: 1.2, color: "rgba(218,180,120,0.55)" }}>{lv === 0 ? "TRUQUES" : `NÍVEL ${lv}`}</div>
                    {spells.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>
                        {spells.length} {spells.length === 1 ? "magia" : "magias"}
                      </div>
                    )}
                  </div>
                  {slot && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 6 }}>
                      <div className="mono" style={{ fontSize: 8.5, color: "rgba(218,180,120,0.4)" }}>ESPAÇOS</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="number" min="0" max="9" value={slot.total}
                          onChange={e => updSpellSlot(lv, "total", e.target.value)}
                          style={{ width: 30, textAlign: "center", background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", borderRadius: 7, outline: "none", fontSize: 13, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "var(--t-accent-bright)", padding: "3px 0" }} />
                        <span style={{ fontSize: 10, color: "rgba(218,180,120,0.3)" }}>/</span>
                        <input type="number" min="0" max="9" value={slot.used}
                          onChange={e => updSpellSlot(lv, "used", e.target.value)}
                          style={{ width: 30, textAlign: "center", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(194,85,85,0.3)", borderRadius: 7, outline: "none", fontSize: 13, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "#c25555", padding: "3px 0" }} />
                      </div>
                      {slot.total > 0 && (
                        <div style={{ display: "flex", gap: 3 }}>
                          {Array.from({ length: Math.min(slot.total, 9) }).map((_, i) => (
                            <div key={i} onClick={() => updSpellSlot(lv, "used", i < slot.used ? i : i + 1)}
                              style={{ width: 9, height: 9, borderRadius: "50%", cursor: "pointer", border: `1.5px solid ${i < slot.used ? "#c25555" : "var(--t-accent-bright)"}`, background: i < slot.used ? "#c25555" : "transparent", transition: "all 150ms" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => setAddSpellModal(lv)}
                    style={{ padding: "6px 14px", borderRadius: 8, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <Icon name="plus" size={11} /> Adicionar
                  </button>
                </div>

                {/* Spell list */}
                {spells.map((sp, idx) => {
                  const realIdx = (char.spellLists[lv] || []).findIndex(s => s.name === sp.name);
                  return (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                      borderBottom: idx < spells.length - 1 ? "1px dashed rgba(218,180,120,0.07)" : "none",
                    }}>
                      {/* prepared toggle */}
                      {lv > 0 && (
                        <div onClick={() => updSpellPrep(lv, realIdx)}
                          style={{ width: 13, height: 13, flexShrink: 0, borderRadius: "50%", cursor: "pointer", border: `1.5px solid ${sp.prepared ? "var(--t-accent-bright)" : "rgba(218,180,120,0.22)"}`, background: sp.prepared ? "rgba(218,162,90,0.28)" : "transparent", transition: "all 150ms" }} />
                      )}
                      {lv === 0 && <div style={{ width: 13, height: 13, flexShrink: 0, borderRadius: "50%", background: "rgba(218,162,90,0.14)", border: "1px solid rgba(218,180,120,0.2)" }} />}
                      <div style={{ flex: 1, fontSize: 14, color: sp.prepared && lv > 0 ? "var(--t-text)" : "var(--t-text-soft)", fontWeight: sp.prepared && lv > 0 ? 600 : 400, lineHeight: 1 }}>
                        {sp.name}
                      </div>
                      <button onClick={() => removeSpell(lv, sp.name)}
                        style={{ background: "none", border: "none", color: "rgba(194,85,85,0.45)", cursor: "pointer", padding: "2px 6px", fontSize: 13, borderRadius: 5, transition: "color 150ms" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#c25555"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(194,85,85,0.45)"}>
                        ✕
                      </button>
                    </div>
                  );
                })}

                {spells.length === 0 && (
                  <div style={{ padding: "14px 16px", fontSize: 12, color: "var(--t-text-faint)", fontStyle: "italic" }}>
                    Nenhuma magia de {lv === 0 ? "truque" : `nível ${lv}`} adicionada ainda.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════ TAB: HISTÓRICO ════════════════════════ */}
      {tab === "historico" && (
        <div>
          {/* Banner do personagem */}
          <div className="glass" style={{ borderRadius: 16, padding: "20px 24px", marginBottom: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: char.photo ? "none" : "radial-gradient(ellipse at 20% 50%, rgba(218,162,90,0.06), transparent 60%)" }} />
            {char.photo && (
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${char.photo})`, backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.08 }} />
            )}
            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 22, alignItems: "center" }}>
              {/* Portrait grande */}
              <div onClick={() => setShowPhotoModal(true)} style={{
                width: 110, height: 130, borderRadius: 14, flexShrink: 0, cursor: "pointer",
                overflow: "hidden", border: "1px solid var(--t-border-strong)",
                background: "linear-gradient(135deg, rgba(218,162,90,0.1), rgba(157,123,216,0.07))",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: char.photo ? "0 0 40px -12px var(--t-accent-glow)" : "0 4px 24px -8px rgba(0,0,0,0.5)",
                position: "relative",
              }}>
                {char.photo
                  ? <img src={char.photo} alt={char.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (
                    <div style={{ textAlign: "center" }}>
                      <Icon name="shield" size={36} style={{ color: "rgba(218,180,120,0.18)", display: "block", margin: "0 auto 6px" }} />
                      <div style={{ fontSize: 9, color: "rgba(218,180,120,0.3)", letterSpacing: 0.5 }}>Sem foto</div>
                    </div>
                  )
                }
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "200ms" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                  <Icon name="camera" size={18} style={{ color: "#fff" }} />
                </div>
              </div>

              {/* Nome e info resumida */}
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: 36, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.05, marginBottom: 6 }}>
                  {char.name || "Seu Personagem"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {[char.class, char.species, char.alignment, char.origin].filter(Boolean).map((v, i) => (
                    <span key={i} style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(218,162,90,0.08)", border: "1px solid rgba(218,180,120,0.18)", fontSize: 11.5, color: "var(--t-text-mute)" }}>{v}</span>
                  ))}
                  {char.level > 0 && (
                    <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(218,162,90,0.15)", border: "1px solid var(--t-border-active)", fontSize: 11.5, color: "var(--t-accent-bright)", fontWeight: 600 }}>
                      Nível {char.level}
                    </span>
                  )}
                </div>

                {/* Atributos físicos rápidos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {[["age", "IDADE"], ["height", "ALTURA"], ["weight", "PESO"], ["eyes", "OLHOS"], ["skin", "PELE"], ["hair", "CABELOS"]].map(([k, lbl]) => (
                    <div key={k}>
                      <div className="mono" style={{ fontSize: 7.5, letterSpacing: 1.1, color: "rgba(218,180,120,0.38)", marginBottom: 2 }}>{lbl}</div>
                      <input value={char[k] || ""} onChange={e => upd(k, e.target.value)} placeholder="—" style={csInp({ fontSize: 12 })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Layout principal: saga (esquerda larga) + vínculos/outros (direita) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>

            {/* ESQUERDA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* A SAGA */}
              <div className="glass" style={{ borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--t-accent), transparent)" }} />
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)" }}>A Saga</div>
                  <div style={{ fontSize: 11.5, color: "var(--t-text-faint)", fontStyle: "italic" }}>— a história do seu herói</div>
                </div>
                <textarea value={char.history || ""} onChange={e => upd("history", e.target.value)}
                  rows={14}
                  placeholder={`Onde ${char.name || "seu personagem"} nasceu e cresceu?\nO que o moldou e o trouxe até aqui?\nQue segredo carrega, que cicatriz não aparece em mapas?\n\nEscreva livremente — esta é a sua crônica.`}
                  style={{ ...csTA({ fontSize: 13.5, lineHeight: 1.75, padding: "12px 14px" }) }} />
              </div>

              {/* APARÊNCIA */}
              <div className="glass" style={{ borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                  <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)" }}>Aparência</div>
                  <div style={{ fontSize: 11, color: "var(--t-text-faint)", fontStyle: "italic" }}>— traços, marcas, vestimentas</div>
                </div>
                <textarea value={char.appearance || ""} onChange={e => upd("appearance", e.target.value)} rows={5}
                  placeholder="Descreva como o personagem é visto pelos outros: aparência física, roupas, trejeitos, marcas que chamam atenção..."
                  style={csTA({ fontSize: 12.5, lineHeight: 1.65 })} />
              </div>
            </div>

            {/* DIREITA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Traços e motivações */}
              <div className="glass" style={{ borderRadius: 14, padding: "16px 18px" }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)", marginBottom: 14 }}>Motivações</div>
                {[
                  ["traits", "Traços de Personalidade", "Como age, fala, pensa..."],
                  ["ideals", "Ideais", "O que acredita e defende..."],
                  ["bonds", "Ligações", "O que o prende ao mundo..."],
                  ["flaws", "Defeitos", "Sua fraqueza ou obsessão..."],
                ].map(([key, label, ph]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginBottom: 5 }}>{label.toUpperCase()}</div>
                    <textarea value={char[key] || ""} onChange={e => upd(key, e.target.value)} rows={2}
                      placeholder={ph}
                      style={csTA({ fontSize: 12, lineHeight: 1.55 })} />
                  </div>
                ))}
              </div>

              {/* Vínculos */}
              <div className="glass" style={{ borderRadius: 14, padding: "16px 18px" }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)", marginBottom: 12 }}>Vínculos & Organizações</div>
                <div style={{ marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", marginBottom: 5 }}>ORGANIZAÇÃO / ALIADO</div>
                  <input value={char.allyName || ""} onChange={e => upd("allyName", e.target.value)} placeholder="Ordem dos Guardiões, Guildas, NPCs..." style={csInp({ fontSize: 13 })} />
                </div>
                <textarea value={char.allies || ""} onChange={e => upd("allies", e.target.value)} rows={4}
                  placeholder="Descreva aliados, facções, organizações e o que essas relações significam para o personagem..."
                  style={csTA({ fontSize: 12 })} />
              </div>

              {/* Outras habilidades */}
              <div className="glass" style={{ borderRadius: 14, padding: "16px 18px" }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>Outras Habilidades</div>
                <textarea value={char.otherFeatures || ""} onChange={e => upd("otherFeatures", e.target.value)} rows={4}
                  placeholder="Poderes raciais, dons divinos, habilidades especiais fora das classes padrão..."
                  style={csTA({ fontSize: 12 })} />
              </div>

              {/* Tesouro */}
              <div className="glass" style={{ borderRadius: 14, padding: "16px 18px" }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>Tesouro</div>
                <textarea value={char.treasure || ""} onChange={e => upd("treasure", e.target.value)} rows={3}
                  placeholder="Relíquias, itens especiais com significado, objetos que o personagem jamais largaria..."
                  style={csTA({ fontSize: 12 })} />
              </div>
            </div>
          </div>

          {/* Inventário e Moedas — full width */}
          <div className="glass" style={{ borderRadius: 14, padding: "16px 18px", marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)" }}>Inventário</div>
              <button onClick={() => upd("inventory", [...(char.inventory || []), { name: "", qty: 1, weight: 0 }])}
                style={{ padding: "7px 16px", borderRadius: 9, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                + Item
              </button>
            </div>
            <div className="glass-soft" style={{ borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 54px 60px 22px", padding: "7px 12px", background: "rgba(0,0,0,0.28)" }}>
                {["ITEM", "QTD", "PESO", ""].map((h, i) => <span key={i} className="mono" style={{ fontSize: 8, letterSpacing: 1, color: "rgba(218,180,120,0.4)" }}>{h}</span>)}
              </div>
              {(char.inventory || []).map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 54px 60px 22px", padding: "6px 12px", borderBottom: i < char.inventory.length - 1 ? "1px dashed rgba(218,180,120,0.07)" : "none", alignItems: "center" }}>
                  <input value={it.name} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], name: e.target.value }; upd("inventory", inv); }} placeholder="Item..." style={csInp({ fontSize: 12.5 })} />
                  <input type="number" value={it.qty} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], qty: parseInt(e.target.value) || 1 }; upd("inventory", inv); }} style={csInp({ fontSize: 12.5, textAlign: "center" })} />
                  <input type="number" step="0.1" value={it.weight} onChange={e => { const inv = [...char.inventory]; inv[i] = { ...inv[i], weight: parseFloat(e.target.value) || 0 }; upd("inventory", inv); }} style={csInp({ fontSize: 12.5, textAlign: "center" })} />
                  <button onClick={() => upd("inventory", char.inventory.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#c25555", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                </div>
              ))}
              {!(char.inventory || []).length && (
                <div style={{ padding: "16px", color: "var(--t-text-faint)", fontSize: 12, textAlign: "center" }}>Nenhum item no inventário</div>
              )}
            </div>

            {/* Money */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: "rgba(218,180,120,0.45)", flexShrink: 0 }}>MOEDAS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, flex: 1 }}>
                {[["cp", "PC", "#c8643a"], ["pp", "PA", "#cdd5dd"], ["pe", "PE", "#9d7bd8"], ["po", "PO", "var(--t-accent-bright)"], ["pl", "PL", "#a3d4e8"]].map(([k, lbl, color]) => (
                  <div key={k} className="glass-strong" style={{ borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, margin: "0 auto 3px" }} />
                    <div className="mono" style={{ fontSize: 8, color: "rgba(218,180,120,0.38)", marginBottom: 3 }}>{lbl}</div>
                    <input type="number" min="0" value={(char.money || {})[k] || 0}
                      onChange={e => updNested("money", k, Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ width: "100%", textAlign: "center", background: "transparent", border: "none", outline: "none", fontSize: 18, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color, padding: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Luxury save toast ─────────────────────────────────────────────── */}
      {saved && (
        <div style={{
          position: "fixed", bottom: 36, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999, pointerEvents: "none",
          animation: "vg-save-in 380ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}>
          <div className="glass-strong" style={{
            padding: "16px 26px 20px", borderRadius: 22,
            border: "1px solid rgba(218,180,120,0.3)",
            boxShadow: "0 0 60px -12px rgba(218,162,90,0.4), 0 28px 70px -20px rgba(0,0,0,0.9)",
            display: "flex", alignItems: "center", gap: 16,
            minWidth: 270, position: "relative", overflow: "hidden",
          }}>
            {/* Ambient glow */}
            <div style={{ position: "absolute", top: -30, left: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(218,162,90,0.1)", filter: "blur(30px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(123,168,93,0.08)", filter: "blur(20px)", pointerEvents: "none" }} />
            {/* Check circle */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0, zIndex: 1,
              background: "rgba(123,168,93,0.12)", border: "1px solid rgba(123,168,93,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9 L7 12.5 L14.5 5.5"
                  stroke="#7ba85d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="16" strokeDashoffset="16"
                  style={{ animation: "vg-check-draw 440ms 140ms ease-out forwards" }} />
              </svg>
            </div>
            {/* Text */}
            <div style={{ zIndex: 1 }}>
              <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.1, letterSpacing: 0.2 }}>
                Ficha salva
              </div>
              <div className="mono" style={{ fontSize: 10, color: "rgba(218,180,120,0.5)", marginTop: 4, letterSpacing: 0.6 }}>
                {char.name}
              </div>
            </div>
            {/* Sparkle */}
            <div style={{ marginLeft: "auto", zIndex: 1, fontSize: 20, color: "rgba(218,162,90,0.55)", animation: "vg-sparkle-spin 2s ease-in-out infinite" }}>✦</div>
            {/* Progress drain bar */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, height: 2,
              background: "linear-gradient(90deg, rgba(218,162,90,0.85), rgba(240,193,112,0.25))",
              animation: "vg-save-bar 2900ms linear forwards",
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

window.CharacterSheet = CharacterSheet;
