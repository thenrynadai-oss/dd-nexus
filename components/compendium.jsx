const Compendium = () => {
  const { COMPENDIUM = [] } = window.MOCK || {};
  const { Pill, Btn } = window.UI;

  const [custom, setCustom] = useState(() => {
    try { return JSON.parse(localStorage.getItem("compendium-custom") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("compendium-custom", JSON.stringify(custom)); }, [custom]);

  const all = useMemo(() => [...custom, ...COMPENDIUM], [custom, COMPENDIUM]);

  const [activeFilter, setActiveFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(all[0]);
  const [editing, setEditing] = useState(null);

  const types = ["Todos", "Magia", "Classe", "Habilidade", "Monstro", "Item", "Regra"];
  const filtered = all.filter((c) => {
    if (activeFilter !== "Todos" && c.type !== activeFilter) return false;
    if (query && !`${c.name} ${c.desc} ${c.school} ${c.lvl}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const isCustom = (e) => e?.id?.startsWith("custom-");

  const saveEntry = (entry) => {
    if (entry.id && isCustom(entry)) {
      setCustom((arr) => arr.map((e) => (e.id === entry.id ? entry : e)));
    } else {
      const newEntry = { ...entry, id: `custom-${Date.now()}` };
      setCustom((arr) => [newEntry, ...arr]);
      setSelected(newEntry);
    }
    setEditing(null);
  };

  const deleteEntry = (id) => {
    setCustom((arr) => arr.filter((e) => e.id !== id));
    setSelected(all.find((e) => e.id !== id) || null);
  };

  return (
    <div data-screen-label="Compêndio">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Compêndio Arcano</h1>
          <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>Magias, classes, habilidades, monstros, itens e regras — crie e consulte durante a sessão</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" icon="upload" size="sm">Importar livro</Btn>
          <Btn icon="plus" size="sm" onClick={() => setEditing({ type: activeFilter !== "Todos" ? activeFilter : "Magia" })}>Criar entrada</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {types.map((t) => (
          <button key={t} onClick={() => setActiveFilter(t)} style={{
            padding: "9px 18px", borderRadius: 999,
            background: activeFilter === t ? "linear-gradient(180deg, rgba(218,162,90,0.2), rgba(218,162,90,0.06))" : "rgba(255,245,220,0.03)",
            border: activeFilter === t ? "1px solid var(--t-border-active)" : "1px solid var(--t-border)",
            color: activeFilter === t ? "var(--t-accent-bright)" : "rgba(232,227,214,0.7)",
            fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3,
            backdropFilter: "blur(12px)", cursor: "pointer",
          }}>{t}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <Icon name="search" size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-mute)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar no compêndio..." style={{
            background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)",
            borderRadius: 10, padding: "9px 14px 9px 34px", color: "var(--t-text)", fontSize: 12.5, width: 240,
            outline: "none",
          }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignContent: "start" }}>
          {filtered.map((it) => {
            const isActive = selected?.id === it.id || (selected?.name === it.name && !it.id);
            return (
              <div key={it.id || it.name}
                onClick={() => setSelected(it)}
                className="glass"
                style={{
                  borderRadius: 16, padding: 18, cursor: "pointer",
                  borderColor: isActive ? `${it.color}80` : "var(--t-border)",
                  transition: "all 220ms",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${it.color}, transparent)` }} />
                {isCustom(it) && (
                  <div className="mono" style={{ position: "absolute", top: 8, right: 10, fontSize: 8, letterSpacing: 1.2, color: it.color, fontWeight: 700 }}>★ CUSTOM</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${it.color}1f`, border: `1px solid ${it.color}50`,
                    color: it.color, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={it.icon} size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, letterSpacing: 1.4, color: it.color, fontWeight: 700, textTransform: "uppercase" }} className="mono">{it.type}</div>
                    <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.1 }}>{it.name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginBottom: 8 }}>{it.lvl} · {it.school}</div>
                <div style={{ fontSize: 12.5, color: "rgba(232,227,214,0.7)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.desc}</div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="glass" style={{ gridColumn: "1 / -1", padding: 32, borderRadius: 16, textAlign: "center", color: "var(--t-text-mute)", fontSize: 13 }}>
              Nada encontrado. <span style={{ color: "var(--t-accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => setEditing({ type: activeFilter !== "Todos" ? activeFilter : "Magia" })}>Crie uma nova entrada →</span>
            </div>
          )}
        </div>

        {selected && (
          <DetailPanel entry={selected} isCustom={isCustom(selected)} onEdit={() => setEditing(selected)} onDelete={() => deleteEntry(selected.id)} />
        )}
      </div>

      {editing && <EntryEditor initial={editing} onSave={saveEntry} onCancel={() => setEditing(null)} />}
    </div>
  );
};

const DetailPanel = ({ entry, isCustom, onEdit, onDelete }) => {
  const { Pill, Btn } = window.UI;
  return (
    <div className="glass-strong" style={{
      borderRadius: 18, padding: 28,
      position: "sticky", top: 20, alignSelf: "start",
      borderColor: `${entry.color}50`, maxHeight: "calc(100vh - 120px)", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 14,
          background: `linear-gradient(135deg, ${entry.color}40, ${entry.color}10)`,
          border: `1px solid ${entry.color}60`, color: entry.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 30px -8px ${entry.color}80`, flexShrink: 0,
        }}>
          <Icon name={entry.icon} size={32} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Pill color={entry.color}>{entry.type}</Pill>
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)", margin: "8px 0 4px", lineHeight: 1.1 }}>{entry.name}</h2>
          <div style={{ fontSize: 12, color: "var(--t-text-mute)" }}>{entry.lvl} · {entry.school}</div>
        </div>
      </div>

      <div className="serif" style={{ fontSize: 15, color: "var(--t-text-soft)", lineHeight: 1.7, fontStyle: "italic", paddingLeft: 14, borderLeft: `2px solid ${entry.color}80`, margin: "18px 0" }}>
        {entry.desc}
      </div>

      {entry.type === "Magia" && <MagiaDetail e={entry} />}
      {entry.type === "Classe" && <ClasseDetail e={entry} />}
      {entry.type === "Habilidade" && <HabilidadeDetail e={entry} />}
      {entry.type === "Monstro" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          <DetailCell l="Tipo" v={entry.school.split(" ")[0]} />
          <DetailCell l="ND" v={entry.lvl.replace("ND ", "")} />
          <DetailCell l="PV médio" v="180 (19d10+76)" />
          <DetailCell l="CA" v="18" />
        </div>
      )}
      {entry.type === "Item" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          <DetailCell l="Raridade" v={entry.lvl} />
          <DetailCell l="Sintonização" v="Sim" />
          <DetailCell l="Peso" v="3 kg" />
          <DetailCell l="Categoria" v={entry.school.split(" — ")[0]} />
        </div>
      )}
      {entry.type === "Regra" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          <DetailCell l="Categoria" v={entry.school} />
          <DetailCell l="Livro" v="Manual do Jogador" />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
        <Btn size="sm" icon="plus">Adicionar à ficha</Btn>
        <Btn variant="ghost" size="sm" icon="star">Favoritar</Btn>
        {isCustom && (
          <>
            <Btn variant="ghost" size="sm" icon="settings" onClick={onEdit}>Editar</Btn>
            <Btn variant="danger" size="sm" icon="x" onClick={onDelete}>Excluir</Btn>
          </>
        )}
      </div>
    </div>
  );
};

const MagiaDetail = ({ e }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
      <DetailCell l="Tempo de conjuração" v={e.castTime || "1 ação"} />
      <DetailCell l="Alcance" v={e.range || "—"} />
      <DetailCell l="Componentes" v={
        e.components ? [e.components.v && "V", e.components.s && "S", e.components.m && "M"].filter(Boolean).join(", ") || "—" : "V, S, M"
      } />
      <DetailCell l="Duração" v={e.duration || "Instantânea"} />
      {e.damage && e.damage !== "—" && <DetailCell l="Dano" v={`${e.damage} ${e.damageType || ""}`.trim()} />}
      {e.save && e.save !== "—" && <DetailCell l="Teste de resistência" v={e.save} />}
    </div>
    {e.classes && e.classes.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 8 }}>CLASSES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {e.classes.map((c) => <span key={c} style={{
            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: `${e.color}15`, border: `1px solid ${e.color}40`, color: e.color,
          }}>{c}</span>)}
        </div>
      </div>
    )}
    {e.components?.mDesc && (
      <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--t-text-mute)", fontStyle: "italic" }}>
        Material: {e.components.mDesc}
      </div>
    )}
  </>
);

const ClasseDetail = ({ e }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
      <DetailCell l="Dado de vida" v={e.hitDie || "d8"} />
      <DetailCell l="Atributo principal" v={e.primaryAttr || "—"} />
      <DetailCell l="Salvaguardas" v={(e.savingThrows || []).join(", ") || "—"} />
      <DetailCell l="Perícias" v={`Escolha ${e.skillCount || 2}`} />
    </div>
    {e.skills && e.skills.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 8 }}>PERÍCIAS DISPONÍVEIS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {e.skills.map((s) => <span key={s} style={{
            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500,
            background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)", color: "var(--t-text-soft)",
          }}>{s}</span>)}
        </div>
      </div>
    )}
    {e.equipment && (
      <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)" }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 6 }}>EQUIPAMENTO INICIAL</div>
        <div style={{ fontSize: 12.5, color: "var(--t-text-soft)", lineHeight: 1.6 }}>{e.equipment}</div>
      </div>
    )}
    {e.features && e.features.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 10 }}>CARACTERÍSTICAS DE CLASSE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {e.features.map((f, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 10, background: `${e.color}0a`, border: `1px solid ${e.color}30`, position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: 0.5 }} className="mono">NÍVEL {f.level}</div>
              <div className="serif" style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text)", marginBottom: 4 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: "var(--t-text-soft)", lineHeight: 1.55, paddingRight: 60 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
);

const HabilidadeDetail = ({ e }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
      <DetailCell l="Classe" v={e.className || "—"} />
      <DetailCell l="Nível mínimo" v={e.levelReq != null ? `Nível ${e.levelReq}` : "—"} />
      <DetailCell l="Tipo" v={e.kind || "—"} />
      <DetailCell l="Custo" v={e.cost || "—"} />
    </div>
    {e.effect && (
      <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: `${e.color}10`, border: `1px solid ${e.color}40` }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: e.color, marginBottom: 6, fontWeight: 700 }}>EFEITO MECÂNICO</div>
        <div style={{ fontSize: 12.5, color: "var(--t-text)", lineHeight: 1.6 }}>{e.effect}</div>
      </div>
    )}
  </>
);

const DetailCell = ({ l, v }) => (
  <div className="glass-soft" style={{ padding: 12, borderRadius: 10 }}>
    <div className="mono" style={{ fontSize: 9, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 4 }}>{l.toUpperCase()}</div>
    <div style={{ fontSize: 13, color: "var(--t-text)", fontWeight: 500 }}>{v}</div>
  </div>
);

const TYPE_PRESETS = {
  Magia:      { color: "#9d7bd8", icon: "spark",   defaultLvl: "1º nível",  defaultSchool: "Evocação" },
  Classe:     { color: "#d8a25a", icon: "shield",  defaultLvl: "Classe",     defaultSchool: "Dado de vida d8" },
  Habilidade: { color: "#7ba85d", icon: "zap",     defaultLvl: "Nível 1",    defaultSchool: "Geral" },
  Monstro:    { color: "#c25555", icon: "skull",   defaultLvl: "ND 1",       defaultSchool: "Humanoide" },
  Item:       { color: "#6da5c8", icon: "sword",   defaultLvl: "Comum",      defaultSchool: "Item" },
  Regra:      { color: "#f0c170", icon: "dice",    defaultLvl: "Regra",      defaultSchool: "Mecânica" },
};

const ICON_CHOICES = ["spark", "flame", "heart", "shield", "sword", "book", "skull", "eye", "feather", "dice", "zap", "star"];
const CLASSES_LIST = ["Bardo", "Bárbaro", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guerreiro", "Ladino", "Mago", "Monge", "Paladino", "Ranger"];
const ATTRIBUTES = ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"];
const SCHOOLS = ["Abjuração", "Adivinhação", "Conjuração", "Encantamento", "Evocação", "Ilusão", "Necromancia", "Transmutação"];
const SPELL_LEVELS = ["Truque", "1º nível", "2º nível", "3º nível", "4º nível", "5º nível", "6º nível", "7º nível", "8º nível", "9º nível"];
const HIT_DICE = ["d6", "d8", "d10", "d12"];
const ABILITY_KINDS = ["Passiva", "Ativa", "Reação", "Livre"];

const EntryEditor = ({ initial, onSave, onCancel }) => {
  const { Btn } = window.UI;
  const [type, setType] = useState(initial.type || "Magia");
  const preset = TYPE_PRESETS[type];
  const [form, setForm] = useState(() => ({
    id: initial.id,
    type,
    name: initial.name || "",
    desc: initial.desc || "",
    color: initial.color || preset.color,
    icon: initial.icon || preset.icon,
    lvl: initial.lvl || preset.defaultLvl,
    school: initial.school || preset.defaultSchool,
    classes: initial.classes || [],
    castTime: initial.castTime || "1 ação",
    range: initial.range || "9 m",
    components: initial.components || { v: true, s: true, m: false, mDesc: "" },
    duration: initial.duration || "Instantânea",
    damage: initial.damage || "",
    damageType: initial.damageType || "",
    save: initial.save || "—",
    hitDie: initial.hitDie || "d8",
    primaryAttr: initial.primaryAttr || "Força",
    savingThrows: initial.savingThrows || [],
    skillCount: initial.skillCount || 2,
    skills: initial.skills || [],
    equipment: initial.equipment || "",
    features: initial.features || [],
    className: initial.className || "Guerreiro",
    levelReq: initial.levelReq != null ? initial.levelReq : 1,
    kind: initial.kind || "Ativa",
    cost: initial.cost || "1 ação",
    effect: initial.effect || "",
  }));

  useEffect(() => {
    if (initial.id) return;
    setForm((f) => ({ ...f, type, color: preset.color, icon: preset.icon, lvl: preset.defaultLvl, school: preset.defaultSchool }));
  }, [type]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return alert("Dê um nome à entrada");
    if (!form.desc.trim()) return alert("Adicione uma descrição");

    const base = { id: form.id, type, name: form.name.trim(), desc: form.desc.trim(), color: form.color, icon: form.icon, lvl: form.lvl, school: form.school };
    let entry = base;
    if (type === "Magia") {
      entry = { ...base, classes: form.classes, castTime: form.castTime, range: form.range, components: form.components, duration: form.duration, damage: form.damage || "—", damageType: form.damageType || "—", save: form.save };
    } else if (type === "Classe") {
      entry = { ...base, school: `Dado de vida ${form.hitDie}`, hitDie: form.hitDie, primaryAttr: form.primaryAttr, savingThrows: form.savingThrows, skillCount: form.skillCount, skills: form.skills, equipment: form.equipment, features: form.features };
    } else if (type === "Habilidade") {
      entry = { ...base, school: form.className, lvl: `Nível ${form.levelReq}`, className: form.className, levelReq: form.levelReq, kind: form.kind, cost: form.cost, effect: form.effect };
    }
    onSave(entry);
  };

  return (
    <div onClick={onCancel} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(8,5,2,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong" style={{
        width: "min(880px, 100%)", maxHeight: "90vh", overflowY: "auto",
        borderRadius: 22, padding: 32, borderColor: `${form.color}50`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12,
              background: `linear-gradient(135deg, ${form.color}40, ${form.color}10)`,
              border: `1px solid ${form.color}60`, color: form.color,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={form.icon} size={24} />
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>{form.id ? "Editar" : "Criar"} entrada</h2>
              <div style={{ fontSize: 12, color: "var(--t-text-mute)", marginTop: 2 }}>Adicione ao compêndio global da campanha</div>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "transparent", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 8 }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {!form.id && (
          <CField label="Tipo de entrada">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.keys(TYPE_PRESETS).map((t) => (
                <button key={t} onClick={() => setType(t)} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  background: type === t ? `linear-gradient(180deg, ${TYPE_PRESETS[t].color}30, ${TYPE_PRESETS[t].color}10)` : "rgba(255,245,220,0.04)",
                  border: type === t ? `1px solid ${TYPE_PRESETS[t].color}80` : "1px solid var(--t-border)",
                  color: type === t ? TYPE_PRESETS[t].color : "var(--t-text-soft)",
                }}>{t}</button>
              ))}
            </div>
          </CField>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <CField label="Nome"><CTextInput value={form.name} onChange={(v) => set("name", v)} placeholder={`Ex: ${type === "Magia" ? "Raio Arcano" : type === "Classe" ? "Sentinela das Sombras" : "Vislumbre"}`} /></CField>
          <CField label="Cor temática">
            <div style={{ display: "flex", gap: 6 }}>
              {["#9d7bd8","#c8643a","#7ba85d","#6da5c8","#d8a25a","#c25555","#f0c170","#b87bd8"].map((c) => (
                <button key={c} onClick={() => set("color", c)} style={{
                  width: 28, height: 28, borderRadius: 8, background: c,
                  border: form.color === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer", boxShadow: form.color === c ? `0 0 12px ${c}` : "none",
                }} />
              ))}
            </div>
          </CField>
        </div>

        <CField label="Ícone">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ICON_CHOICES.map((ic) => (
              <button key={ic} onClick={() => set("icon", ic)} style={{
                width: 38, height: 38, borderRadius: 9, cursor: "pointer",
                background: form.icon === ic ? `${form.color}30` : "rgba(255,245,220,0.04)",
                border: form.icon === ic ? `1px solid ${form.color}80` : "1px solid var(--t-border)",
                color: form.icon === ic ? form.color : "var(--t-text-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Icon name={ic} size={16} /></button>
            ))}
          </div>
        </CField>

        <CField label="Descrição">
          <CTextArea value={form.desc} onChange={(v) => set("desc", v)} placeholder="Texto narrativo da entrada..." rows={3} />
        </CField>

        {type === "Magia" && <MagiaFields form={form} set={set} />}
        {type === "Classe" && <ClasseFields form={form} set={set} />}
        {type === "Habilidade" && <HabilidadeFields form={form} set={set} />}
        {(type === "Monstro" || type === "Item" || type === "Regra") && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <CField label={type === "Monstro" ? "ND" : type === "Item" ? "Raridade" : "Categoria"}><CTextInput value={form.lvl} onChange={(v) => set("lvl", v)} /></CField>
            <CField label="Subcategoria"><CTextInput value={form.school} onChange={(v) => set("school", v)} /></CField>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--t-border)" }}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn icon="check" onClick={submit}>{form.id ? "Salvar alterações" : "Criar entrada"}</Btn>
        </div>
      </div>
    </div>
  );
};

const MagiaFields = ({ form, set }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <CField label="Nível"><CSelect value={form.lvl} onChange={(v) => set("lvl", v)} options={SPELL_LEVELS} /></CField>
      <CField label="Escola"><CSelect value={form.school} onChange={(v) => set("school", v)} options={SCHOOLS} /></CField>
    </div>
    <CField label="Classes que conjuram">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CLASSES_LIST.map((c) => {
          const on = form.classes.includes(c);
          return (
            <button key={c} onClick={() => set("classes", on ? form.classes.filter((x) => x !== c) : [...form.classes, c])} style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              background: on ? `${form.color}20` : "rgba(255,245,220,0.04)",
              border: on ? `1px solid ${form.color}80` : "1px solid var(--t-border)",
              color: on ? form.color : "var(--t-text-soft)",
            }}>{c}</button>
          );
        })}
      </div>
    </CField>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <CField label="Tempo de conjuração"><CTextInput value={form.castTime} onChange={(v) => set("castTime", v)} placeholder="1 ação" /></CField>
      <CField label="Alcance"><CTextInput value={form.range} onChange={(v) => set("range", v)} placeholder="9 m" /></CField>
      <CField label="Duração"><CTextInput value={form.duration} onChange={(v) => set("duration", v)} placeholder="Instantânea" /></CField>
      <CField label="Componentes">
        <div style={{ display: "flex", gap: 8, alignItems: "center", height: 40 }}>
          {["v","s","m"].map((k) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--t-text-soft)", fontSize: 12.5, fontWeight: 600 }}>
              <input type="checkbox" checked={!!form.components[k]} onChange={(e) => set("components", { ...form.components, [k]: e.target.checked })} />
              {k.toUpperCase()}
            </label>
          ))}
        </div>
      </CField>
    </div>
    {form.components.m && (
      <CField label="Componente material"><CTextInput value={form.components.mDesc} onChange={(v) => set("components", { ...form.components, mDesc: v })} placeholder="ex: pena de fênix" /></CField>
    )}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      <CField label="Dano (dados)"><CTextInput value={form.damage} onChange={(v) => set("damage", v)} placeholder="8d6" /></CField>
      <CField label="Tipo de dano"><CTextInput value={form.damageType} onChange={(v) => set("damageType", v)} placeholder="fogo" /></CField>
      <CField label="Teste de resistência"><CSelect value={form.save} onChange={(v) => set("save", v)} options={["—", ...ATTRIBUTES]} /></CField>
    </div>
  </>
);

const ClasseFields = ({ form, set }) => {
  const toggleSave = (a) => set("savingThrows", form.savingThrows.includes(a) ? form.savingThrows.filter((x) => x !== a) : [...form.savingThrows, a]);
  const toggleSkill = (s) => set("skills", form.skills.includes(s) ? form.skills.filter((x) => x !== s) : [...form.skills, s]);
  const ALL_SKILLS = ["Acrobacia", "Adestrar Animais", "Arcanismo", "Atletismo", "Atuação", "Enganação", "Furtividade", "História", "Intimidação", "Intuição", "Investigação", "Medicina", "Natureza", "Percepção", "Persuasão", "Prestidigitação", "Religião", "Sobrevivência"];
  const addFeature = () => set("features", [...form.features, { level: 1, name: "", desc: "" }]);
  const updateFeature = (i, k, v) => set("features", form.features.map((f, j) => j === i ? { ...f, [k]: v } : f));
  const removeFeature = (i) => set("features", form.features.filter((_, j) => j !== i));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <CField label="Dado de vida"><CSelect value={form.hitDie} onChange={(v) => set("hitDie", v)} options={HIT_DICE} /></CField>
        <CField label="Atributo principal"><CSelect value={form.primaryAttr} onChange={(v) => set("primaryAttr", v)} options={[...ATTRIBUTES, "Força ou Destreza", "Inteligência ou Carisma"]} /></CField>
        <CField label="Perícias para escolher"><CTextInput value={String(form.skillCount)} onChange={(v) => set("skillCount", parseInt(v) || 2)} type="number" /></CField>
      </div>
      <CField label="Salvaguardas (escolha 2)">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ATTRIBUTES.map((a) => {
            const on = form.savingThrows.includes(a);
            return <button key={a} onClick={() => toggleSave(a)} style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              background: on ? `${form.color}20` : "rgba(255,245,220,0.04)",
              border: on ? `1px solid ${form.color}80` : "1px solid var(--t-border)",
              color: on ? form.color : "var(--t-text-soft)",
            }}>{a}</button>;
          })}
        </div>
      </CField>
      <CField label="Perícias disponíveis">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ALL_SKILLS.map((s) => {
            const on = form.skills.includes(s);
            return <button key={s} onClick={() => toggleSkill(s)} style={{
              padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: "pointer",
              background: on ? `${form.color}20` : "rgba(255,245,220,0.04)",
              border: on ? `1px solid ${form.color}80` : "1px solid var(--t-border)",
              color: on ? form.color : "var(--t-text-soft)",
            }}>{s}</button>;
          })}
        </div>
      </CField>
      <CField label="Equipamento inicial"><CTextArea value={form.equipment} onChange={(v) => set("equipment", v)} placeholder="Cota de malha · Espada longa · Escudo · Mochila..." rows={2} /></CField>
      <CField label="Características de classe" action={<button onClick={addFeature} style={{ background: "transparent", border: "none", color: form.color, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Icon name="plus" size={12}/> Adicionar</button>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {form.features.map((f, i) => (
            <div key={i} className="glass-soft" style={{ padding: 12, borderRadius: 10, display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 8, alignItems: "start" }}>
              <CTextInput value={String(f.level)} onChange={(v) => updateFeature(i, "level", parseInt(v) || 1)} type="number" placeholder="Nv" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <CTextInput value={f.name} onChange={(v) => updateFeature(i, "name", v)} placeholder="Nome da característica" />
                <CTextArea value={f.desc} onChange={(v) => updateFeature(i, "desc", v)} placeholder="O que faz..." rows={2} />
              </div>
              <button onClick={() => removeFeature(i)} style={{ background: "rgba(194,85,85,0.15)", border: "1px solid rgba(194,85,85,0.4)", color: "#f0a0a0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          {form.features.length === 0 && <div style={{ fontSize: 12, color: "var(--t-text-mute)", fontStyle: "italic", padding: 10 }}>Nenhuma característica ainda. Clique em "Adicionar" para começar.</div>}
        </div>
      </CField>
    </>
  );
};

const HabilidadeFields = ({ form, set }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      <CField label="Classe associada"><CSelect value={form.className} onChange={(v) => set("className", v)} options={CLASSES_LIST} /></CField>
      <CField label="Nível mínimo"><CTextInput value={String(form.levelReq)} onChange={(v) => set("levelReq", parseInt(v) || 1)} type="number" /></CField>
      <CField label="Tipo"><CSelect value={form.kind} onChange={(v) => set("kind", v)} options={ABILITY_KINDS} /></CField>
    </div>
    <CField label="Custo / uso"><CTextInput value={form.cost} onChange={(v) => set("cost", v)} placeholder="1 ação · 2 usos por descanso longo" /></CField>
    <CField label="Efeito mecânico"><CTextArea value={form.effect} onChange={(v) => set("effect", v)} placeholder="Regras precisas: rolagens, durações, modificadores..." rows={3} /></CField>
  </>
);

const CField = ({ label, children, action }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", fontWeight: 700 }}>{label.toUpperCase()}</div>
      {action}
    </div>
    {children}
  </div>
);

const CTextInput = ({ value, onChange, placeholder, type = "text" }) => (
  <input value={value} type={type} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
    width: "100%", background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)",
    borderRadius: 9, padding: "9px 12px", color: "var(--t-text)", fontSize: 13, outline: "none",
    fontFamily: "inherit",
  }} onFocus={(e) => e.currentTarget.style.borderColor = "var(--t-border-active)"}
     onBlur={(e) => e.currentTarget.style.borderColor = "var(--t-border)"} />
);

const CTextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{
    width: "100%", background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)",
    borderRadius: 9, padding: "9px 12px", color: "var(--t-text)", fontSize: 13, outline: "none",
    fontFamily: "inherit", resize: "vertical", lineHeight: 1.5,
  }} onFocus={(e) => e.currentTarget.style.borderColor = "var(--t-border-active)"}
     onBlur={(e) => e.currentTarget.style.borderColor = "var(--t-border)"} />
);

const CSelect = ({ value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{
    width: "100%", background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)",
    borderRadius: 9, padding: "9px 12px", color: "var(--t-text)", fontSize: 13, outline: "none",
    fontFamily: "inherit", cursor: "pointer",
  }}>
    {options.map((o) => <option key={o} value={o} style={{ background: "#1a1410" }}>{o}</option>)}
  </select>
);

window.Compendium = Compendium;
