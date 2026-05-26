const CharacterSheet = () => {
  const { CHARACTER = {
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
  } } = window.MOCK || {};
  const { Pill, Btn, AbilityHex, RuneDivider, Avatar, SectionTitle } = window.UI;
  const c = CHARACTER;
  const [tab, setTab] = useState("combate");
  const [hp, setHp] = useState(c.hp);
  const tabs = ["combate", "magias", "habilidades", "inventário", "anotações"];
  const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);

  return (
    <div data-screen-label="Ficha">
      {/* Character header */}
      <div className="glass" style={{
        position: "relative", borderRadius: 22, padding: 28, marginBottom: 22,
        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 28, alignItems: "center",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 0% 50%, rgba(216,162,90,0.15), transparent 50%)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--t-accent), #5a2e10)",
            border: "3px solid rgba(255,220,170,0.3)",
            boxShadow: "0 0 40px -8px var(--t-accent-glow)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="serif" style={{ fontSize: 46, fontWeight: 600, color: "#1a0e04" }}>AL</span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Pill color="#9d7bd8">{c.race}</Pill>
            <Pill color="var(--t-accent)">{c.class} · {c.subclass}</Pill>
            <Pill color="#7ba85d">{c.background}</Pill>
          </div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 600, margin: 0, color: "var(--t-text)", letterSpacing: 0.3, lineHeight: 1 }}>{c.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10, fontSize: 12.5, color: "rgba(232,227,214,0.6)" }}>
            <span><span style={{ color: "var(--t-text-faint)" }}>Jogadora</span> · {c.player}</span>
            <span style={{ width: 3, height: 3, background: "rgba(232,227,214,0.3)", borderRadius: "50%" }} />
            <span><span style={{ color: "var(--t-text-faint)" }}>Tendência</span> · {c.alignment}</span>
            <span style={{ width: 3, height: 3, background: "rgba(232,227,214,0.3)", borderRadius: "50%" }} />
            <span><span style={{ color: "var(--t-text-faint)" }}>XP</span> · <span className="mono">{c.xp.toLocaleString()}/{c.xpNext.toLocaleString()}</span></span>
          </div>
          <div style={{ marginTop: 12, height: 4, background: "rgba(0,0,0,0.4)", borderRadius: 2, maxWidth: 380 }}>
            <div style={{ width: `${(c.xp / c.xpNext) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-bright))", borderRadius: 2 }} />
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div className="serif" style={{ fontSize: 64, lineHeight: 1, fontWeight: 600, color: "var(--t-accent-bright)" }}>{c.level}</div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(218,180,120,0.7)" }}>NÍVEL</div>
          {c.inspiration && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Icon name="star" size={13} className="gold-bright" />
              <span style={{ fontSize: 11, color: "var(--t-accent-bright)", fontWeight: 600 }}>Inspiração</span>
            </div>
          )}
        </div>
      </div>

      {/* Vital stats — floating row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
        <div className="glass" style={{ padding: 18, borderRadius: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #c25555, #c25555 60%, transparent)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>PONTOS DE VIDA</div>
            <Icon name="heart" size={14} style={{ color: "#c25555" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="serif" style={{ fontSize: 36, fontWeight: 600, color: "var(--t-text)", lineHeight: 1 }}>{hp}</span>
            <span style={{ fontSize: 16, color: "var(--t-text-faint)" }}>/ {c.hpMax}</span>
          </div>
          <div style={{ height: 6, background: "rgba(0,0,0,0.4)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
            <div style={{ width: `${(hp / c.hpMax) * 100}%`, height: "100%", background: "linear-gradient(90deg, #c25555, #e07b7b)" }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button onClick={() => setHp(Math.max(0, hp - 1))} style={btnMini}>−1</button>
            <button onClick={() => setHp(Math.max(0, hp - 5))} style={btnMini}>−5</button>
            <button onClick={() => setHp(Math.min(c.hpMax, hp + 1))} style={{ ...btnMini, color: "#7ba85d" }}>+1</button>
            <button onClick={() => setHp(Math.min(c.hpMax, hp + 5))} style={{ ...btnMini, color: "#7ba85d" }}>+5</button>
          </div>
        </div>

        <VitalStat label="CA" icon="shield" value={c.ac} accent="#6da5c8" />
        <VitalStat label="Iniciativa" icon="bolt" value={sign(c.init)} accent="var(--t-accent-bright)" />
        <VitalStat label="Deslocamento" icon="leaf" value={`${c.speed}`} sub="pés" accent="#7ba85d" />
        <VitalStat label="Proficiência" icon="target" value={sign(c.prof)} accent="#9d7bd8" />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22 }}>
        {/* Left: abilities + skills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <SectionTitle sub="Clique para rolar d20">Atributos</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {c.abilities.map((a) => <AbilityHex key={a.name} {...a} />)}
            </div>
          </div>

          <div>
            <SectionTitle sub="Proficiências marcadas">Perícias</SectionTitle>
            <div className="glass" style={{ borderRadius: 14, padding: 6 }}>
              {c.skills.map((s, i) => (
                <div key={s.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8,
                  borderBottom: i === c.skills.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)",
                  fontSize: 12.5,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: s.prof ? "var(--t-accent-bright)" : "transparent",
                    border: `1.5px solid ${s.prof ? "var(--t-accent-bright)" : "rgba(232,227,214,0.3)"}`,
                    boxShadow: s.prof ? "0 0 6px var(--t-accent-glow)" : "none",
                  }} />
                  <span style={{ flex: 1, color: s.prof ? "var(--t-text)" : "rgba(232,227,214,0.7)", fontWeight: s.prof ? 500 : 400 }}>{s.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--t-text-faint)", marginRight: 4 }}>{s.abil}</span>
                  <span className="serif" style={{ fontSize: 16, fontWeight: 600, color: s.prof ? "var(--t-accent-bright)" : "var(--t-text-soft)", minWidth: 28, textAlign: "right" }}>{sign(s.mod)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: tabbed content */}
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 18, padding: 5, background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid var(--t-border)" }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "10px 14px", borderRadius: 8,
                background: tab === t ? "linear-gradient(180deg, var(--t-accent-tint), rgba(218,162,90,0.06))" : "transparent",
                border: tab === t ? "1px solid var(--t-border-strong)" : "1px solid transparent",
                color: tab === t ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)",
                fontSize: 12.5, fontWeight: 600, letterSpacing: 0.4, textTransform: "capitalize",
              }}>{t}</button>
            ))}
          </div>

          {tab === "combate" && <CombateTab c={c} />}
          {tab === "magias" && <MagiasTab c={c} />}
          {tab === "habilidades" && <HabilidadesTab c={c} />}
          {tab === "inventário" && <InventarioTab c={c} />}
          {tab === "anotações" && <NotasTab c={c} />}
        </div>
      </div>
    </div>
  );
};

const btnMini = {
  flex: 1, padding: "5px 0", borderRadius: 6,
  background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)",
  color: "#c25555", fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
};

const VitalStat = ({ label, icon, value, sub, accent }) => (
  <div className="glass" style={{ padding: 18, borderRadius: 16, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}80 60%, transparent)` }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>{label.toUpperCase()}</div>
      <Icon name={icon} size={14} style={{ color: accent }} />
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span className="serif" style={{ fontSize: 36, fontWeight: 600, color: "var(--t-text)", lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "var(--t-text-faint)" }}>{sub}</span>}
    </div>
  </div>
);

const CombateTab = ({ c }) => {
  const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>Ataques</div>
        <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.4fr 1.6fr 60px", padding: "10px 16px", fontSize: 10, letterSpacing: 1.2, color: "var(--t-text-mute)", fontWeight: 600, borderBottom: "1px solid var(--t-border)" }} className="mono">
            <span>NOME</span><span>BÔNUS</span><span>DANO</span><span>TIPO</span><span>ALCANCE</span><span></span>
          </div>
          {c.attacks.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.4fr 1.6fr 60px", padding: "14px 16px", alignItems: "center", fontSize: 13, borderBottom: i === c.attacks.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)" }}>
              <span style={{ color: "var(--t-text)", fontWeight: 500 }}>{a.name}</span>
              <span className="serif gold-bright" style={{ fontSize: 18, fontWeight: 600 }}>{sign(a.bonus)}</span>
              <span className="mono" style={{ fontSize: 12 }}>{a.dmg}</span>
              <span style={{ fontSize: 11, color: "rgba(232,227,214,0.6)" }}>{a.type}</span>
              <span style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{a.range}</span>
              <window.Dice3D notation="1d20" mod={a.bonus} label={`Ataque · ${a.name}`} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>Recursos & Salvaguardas de Morte</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="glass" style={{ padding: 18, borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 8 }}>DADOS DE VIDA</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-accent-bright)" }}>{c.hitDice}</div>
            <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 4 }}>Recupera-se com descanso longo</div>
          </div>
          <div className="glass" style={{ padding: 18, borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 10 }}>SALVAGUARDAS DE MORTE</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, color: "#7ba85d", marginBottom: 4 }}>SUCESSOS</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #7ba85d", background: i < c.deathSaves.s ? "#7ba85d" : "transparent" }} />)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#c25555", marginBottom: 4 }}>FALHAS</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #c25555", background: i < c.deathSaves.f ? "#c25555" : "transparent" }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MagiasTab = ({ c }) => {
  const { Pill } = window.UI;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>Espaços de Magia</div>
        <div style={{ display: "flex", gap: 14 }}>
          {c.spellSlots.map((s) => (
            <div key={s.level} className="glass" style={{ flex: 1, padding: 16, borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="serif gold-bright" style={{ fontSize: 22, fontWeight: 600 }}>{s.level}º Nível</div>
                <div className="mono" style={{ fontSize: 11, color: "rgba(232,227,214,0.6)" }}>{s.total - s.used}/{s.total}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: s.total }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 26, borderRadius: 4,
                    background: i < s.used ? "transparent" : "linear-gradient(180deg, var(--t-border-active), var(--t-accent-tint))",
                    border: `1px solid ${i < s.used ? "var(--t-border)" : "var(--t-border-active)"}`,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 10 }}>Grimório</div>
        <div className="glass" style={{ borderRadius: 14, padding: 6 }}>
          {c.spells.map((sp, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: i === c.spells.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: sp.prep ? "var(--t-accent-tint)" : "rgba(0,0,0,0.3)",
                border: `1px solid ${sp.prep ? "var(--t-accent)" : "rgba(232,227,214,0.2)"}`,
                color: sp.prep ? "var(--t-accent-bright)" : "var(--t-text-faint)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
              }} className="serif">{sp.lvl}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: "var(--t-text)", fontWeight: 500 }}>{sp.name}</div>
                <div style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{sp.school}</div>
              </div>
              {sp.prep && <Pill color="#7ba85d">preparada</Pill>}
              <window.Dice3D notation="1d20" mod={c.spellAttack || 7} label={`Conjurar · ${sp.name}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HabilidadesTab = ({ c }) => (
  <div className="glass" style={{ borderRadius: 14, padding: 6 }}>
    {c.features.map((f, i) => (
      <div key={i} style={{ padding: "16px 18px", borderBottom: i === c.features.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon name="spark" size={16} className="gold" />
          <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)" }}>{f.name}</div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(232,227,214,0.7)", lineHeight: 1.6, paddingLeft: 26 }}>{f.desc}</div>
      </div>
    ))}
  </div>
);

const InventarioTab = ({ c }) => {
  const totalWeight = c.inventory.reduce((s, i) => s + i.weight * i.qty, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className="glass" style={{ borderRadius: 14, padding: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px", padding: "10px 16px", fontSize: 10, letterSpacing: 1.2, color: "var(--t-text-mute)", fontWeight: 600, borderBottom: "1px solid var(--t-border)" }} className="mono">
            <span>ITEM</span><span style={{ textAlign: "center" }}>QTD</span><span style={{ textAlign: "center" }}>PESO</span><span></span>
          </div>
          {c.inventory.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px", padding: "12px 16px", alignItems: "center", fontSize: 13, borderBottom: i === c.inventory.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)" }}>
              <span style={{ color: "var(--t-text)" }}>{it.name}</span>
              <span className="mono" style={{ textAlign: "center", color: "rgba(232,227,214,0.7)" }}>{it.qty}</span>
              <span className="mono" style={{ textAlign: "center", color: "var(--t-text-mute)", fontSize: 11 }}>{it.weight} kg</span>
              <button style={{ padding: 4, background: "none", border: "none", color: "var(--t-text-faint)" }}><Icon name="edit" size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="glass" style={{ padding: 18, borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 12 }}>BOLSA DE MOEDAS</div>
            {[
              { k: "po", l: "Ouro", c: "var(--t-accent-bright)" },
              { k: "pp", l: "Prata", c: "#cdd5dd" },
              { k: "pe", l: "Eletro", c: "#9d7bd8" },
              { k: "pc", l: "Cobre", c: "#c8643a" },
              { k: "pl", l: "Platina", c: "#a3d4e8" },
            ].map((x) => (
              <div key={x.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(232,227,214,0.7)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: x.c }} />{x.l}
                </span>
                <span className="mono serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)" }}>{c.money[x.k]}</span>
              </div>
            ))}
          </div>
          <div className="glass" style={{ padding: 18, borderRadius: 14 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.3, color: "var(--t-text-mute)", marginBottom: 8 }}>CARGA</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-accent-bright)" }}>{totalWeight.toFixed(1)} <span style={{ fontSize: 14, color: "var(--t-text-faint)" }}>/ 90 kg</span></div>
            <div style={{ height: 5, background: "rgba(0,0,0,0.4)", borderRadius: 3, marginTop: 10 }}>
              <div style={{ width: `${(totalWeight / 90) * 100}%`, height: "100%", background: "#7ba85d", borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotasTab = ({ c }) => (
  <div className="glass" style={{ padding: 24, borderRadius: 14, minHeight: 300 }}>
    <div className="mono" style={{ fontSize: 10, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 12 }}>HISTÓRIA DO PERSONAGEM</div>
    <div className="serif" style={{ fontSize: 16, lineHeight: 1.8, color: "var(--t-text-soft)", fontStyle: "italic" }}>{c.notes}</div>
  </div>
);

window.CharacterSheet = CharacterSheet;
