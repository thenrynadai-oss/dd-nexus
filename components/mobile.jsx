// Mobile shell — wraps app in iPhone-like frame with bottom nav
const Icon = window.Icon;
const MobileShell = ({ view, setView, role, children }) => {
  const isDM = role === "mestre";
  const navItems = isDM ? [
    { id: "dashboard", label: "Mesa", icon: "home" },
    { id: "campaigns", label: "Campanhas", icon: "scroll" },
    { id: "character", label: "Ficha", icon: "shield" },
    { id: "notes", label: "Notas", icon: "feather" },
    { id: "compendium", label: "Livros", icon: "book" },
  ] : [
    { id: "dashboard", label: "Mesa", icon: "home" },
    { id: "character", label: "Ficha", icon: "shield" },
    { id: "campaigns", label: "Mesas", icon: "scroll" },
    { id: "notes", label: "Notas", icon: "feather" },
    { id: "compendium", label: "Livros", icon: "book" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, paddingBottom: 24, minHeight: "100vh" }}>
      {/* Phone frame */}
      <div style={{
        width: 400, height: 820,
        borderRadius: 52,
        background: "linear-gradient(180deg, #1a1418 0%, #0c0810 100%)",
        border: "1.5px solid rgba(255,255,255,0.08)",
        boxShadow: "0 60px 120px -30px rgba(0,0,0,0.9), 0 0 0 8px #000, 0 0 0 9px rgba(255,255,255,0.05)",
        padding: 10,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
          width: 110, height: 30, background: "#000", borderRadius: 18, zIndex: 20,
        }} />

        {/* Screen */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 42, overflow: "hidden",
          position: "relative",
          background: "var(--t-bg-base)",
        }}>
          {/* Status bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 50,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "16px 32px 0", zIndex: 10,
            color: "var(--t-text)", fontSize: 14, fontWeight: 600,
          }}>
            <span>22:14</span>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 11 }}>●●●</span>
              <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M1 8h2v2H1zm3-2h2v4H4zm3-2h2v6H7zm3-2h2v8h-2z"/></svg>
              <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="1" width="18" height="9" rx="2"/><rect x="3" y="3" width="13" height="5" fill="currentColor"/></svg>
            </div>
          </div>

          {/* Content area */}
          <div style={{
            position: "absolute", top: 50, bottom: 92, left: 0, right: 0,
            overflowY: "auto", padding: "10px 16px 20px",
          }}>
            {children}
          </div>

          {/* Bottom nav */}
          <div style={{
            position: "absolute", bottom: 12, left: 12, right: 12,
            padding: "10px 8px",
            borderRadius: 22,
          }} className="glass-strong">
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
              {navItems.map((it) => {
                const active = view === it.id;
                return (
                  <button key={it.id} onClick={() => setView(it.id)} style={{
                    background: "none", border: "none", padding: "6px 10px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    color: active ? "var(--t-accent-bright)" : "var(--t-text-mute)",
                    transition: "color 200ms",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: active ? "var(--t-accent-tint)" : "transparent",
                      border: active ? "1px solid var(--t-border-active)" : "1px solid transparent",
                    }}>
                      <Icon name={it.icon} size={15} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.3 }}>{it.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Home indicator */}
          <div style={{
            position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
            width: 130, height: 4, background: "rgba(255,255,255,0.5)", borderRadius: 2,
          }} />
        </div>
      </div>

      {/* Caption */}
      <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--t-text-mute)", marginTop: 16, textTransform: "uppercase" }}>
        Vasteria · Pré-visualização móvel
      </div>
    </div>
  );
};

const MobileDashboard = ({ setView, role }) => {
  const { CAMPAIGNS = [], ACTIVITY = [], PLAYERS = [], CHARACTER = {} } = window.MOCK || {};
  const { Pill, Btn } = window.UI;
  const isDM = role === "mestre";
  const next = CAMPAIGNS[0] || {
    cover: "linear-gradient(135deg, #111 0%, #222 100%)",
    name: "Nenhuma campanha ativa",
    nextSession: "—",
    progress: 0,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: "8px 4px 4px" }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--t-text-mute)" }}>
          BOA NOITE
        </div>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)", margin: "4px 0 0", lineHeight: 1.1 }}>
          {isDM ? "Mesa do Mestre" : "Sua Mesa"}
        </h1>
      </div>

      <div className="glass" style={{ borderRadius: 20, overflow: "hidden", position: "relative" }}>
        <div style={{ height: 100, background: next.cover, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7))" }} />
          <div style={{ position: "absolute", top: 12, left: 14, display: "flex", gap: 6 }}>
            <Pill color="var(--t-accent-bright)">● próxima</Pill>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.15 }}>{next.name}</div>
          <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 4 }}>{next.nextSession}</div>
          <div style={{ marginTop: 12, height: 4, background: "rgba(0,0,0,0.3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${next.progress * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-bright))" }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            <button style={{ flex: 1, padding: 10, borderRadius: 10, background: "var(--t-accent)", border: "none", color: "#1a0e04", fontSize: 12, fontWeight: 700 }}>
              ▸ Iniciar sessão
            </button>
            <button style={{ padding: "10px 14px", borderRadius: 10, background: "var(--t-glass-soft)", border: "1px solid var(--t-border)", color: "var(--t-text-soft)" }}>
              <Icon name="map" size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {(isDM ? [
          { l: "Campanhas", v: CAMPAIGNS.length || "—", i: "scroll", c: "var(--t-accent)" },
          { l: "Jogadores", v: PLAYERS.length || "—", i: "users", c: "var(--t-success)" },
          { l: "Fichas", v: CHARACTER.name ? "1" : "—", i: "shield", c: "var(--t-magic)" },
          { l: "Próximas sessões", v: CAMPAIGNS.some((c) => c.nextSession) ? "Agendadas" : "—", i: "calendar", c: "var(--t-info)" },
        ] : [
          { l: "Personagem", v: CHARACTER.name || "Nenhuma ficha", i: "shield", c: "var(--t-accent)" },
          { l: "PV", v: CHARACTER.hp ? `${CHARACTER.hp.current}/${CHARACTER.hp.max}` : "—", i: "heart", c: "var(--t-danger)" },
          { l: "Mesas", v: CAMPAIGNS.length || "—", i: "scroll", c: "var(--t-magic)" },
          { l: "Próximo jogo", v: CAMPAIGNS.some((c) => c.nextSession) ? "Agendado" : "—", i: "calendar", c: "var(--t-info)" },
        ]).map((s) => (
          <div key={s.l} className="glass" style={{ padding: 12, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "var(--t-text-mute)" }}>{s.l.toUpperCase()}</span>
              <Icon name={s.i} size={11} style={{ color: s.c }} />
            </div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--t-text)", lineHeight: 1 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", padding: "4px 4px 8px" }}>CRÔNICA</div>
        <div className="glass" style={{ borderRadius: 14, padding: 12 }}>
          {ACTIVITY.slice(0, 4).map((a, i, arr) => (
            <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i === arr.length - 1 ? "none" : "1px dashed var(--t-border)" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${a.color}1a`, border: `1px solid ${a.color}40`, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={a.icon} size={12} />
              </div>
              <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.4 }}>
                <div><span style={{ color: "var(--t-text)", fontWeight: 600 }}>{a.who}</span> <span style={{ color: "var(--t-text-soft)" }}>{a.what}</span></div>
                <div style={{ fontSize: 9.5, color: "var(--t-text-faint)", marginTop: 1 }} className="mono">{a.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileCharacter = () => {
  const { CHARACTER = {
    name: "",
    race: "",
    class: "",
    level: 0,
    xp: 0,
    xpNext: 1,
    hp: 0,
    hpMax: 0,
    ac: 0,
    init: 0,
    speed: 0,
    abilities: [],
    attacks: [],
    skills: [],
  } } = window.MOCK || {};
  const c = CHARACTER;
  const sign = (n) => n >= 0 ? `+${n}` : `${n}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="glass" style={{ borderRadius: 20, padding: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--t-accent), var(--t-accent-deep))",
            border: "2px solid var(--t-border-active)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1a0e04", fontWeight: 700, fontSize: 22,
          }} className="serif">AL</div>
          <div style={{ flex: 1 }}>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)", margin: 0, lineHeight: 1 }}>{c.name}</h2>
            <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 4 }}>{c.race} · {c.class} Nv. {c.level}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 4, background: "rgba(0,0,0,0.4)", borderRadius: 2 }}>
          <div style={{ width: `${(c.xp / c.xpNext) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-bright))", borderRadius: 2 }} />
        </div>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--t-text-mute)", marginTop: 6 }}>{c.xp.toLocaleString()} / {c.xpNext.toLocaleString()} XP</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        {[
          { l: "PV", v: `${c.hp}`, sub: `/${c.hpMax}`, c: "var(--t-danger)" },
          { l: "CA", v: c.ac, sub: "", c: "var(--t-info)" },
          { l: "INIC", v: sign(c.init), sub: "", c: "var(--t-accent-bright)" },
          { l: "DESL", v: c.speed, sub: "pés", c: "var(--t-success)" },
        ].map((s) => (
          <div key={s.l} className="glass" style={{ padding: "10px 8px", borderRadius: 10, textAlign: "center", borderTop: `2px solid ${s.c}` }}>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.2, color: "var(--t-text-mute)" }}>{s.l}</div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.1, marginTop: 2 }}>{s.v}</div>
            {s.sub && <div style={{ fontSize: 9, color: "var(--t-text-faint)" }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", padding: "4px 4px 8px" }}>ATRIBUTOS · TOQUE PARA ROLAR</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {c.abilities.map((a) => (
            <div key={a.name} className="glass" style={{ padding: 10, borderRadius: 12, textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>{a.name}</div>
              <div className="serif" style={{ fontSize: 22, color: "var(--t-accent-bright)", fontWeight: 600, lineHeight: 1, margin: "4px 0" }}>{sign(a.mod)}</div>
              <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", fontSize: 9, color: "var(--t-text-soft)" }}>{a.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", padding: "4px 4px 8px" }}>ATAQUES</div>
        <div className="glass" style={{ borderRadius: 14, padding: 6 }}>
          {c.attacks.map((a, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: i === arr.length - 1 ? "none" : "1px dashed var(--t-border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: "var(--t-text)", fontWeight: 600 }}>{a.name}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--t-text-mute)" }}>{a.dmg} · {a.type}</div>
              </div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-accent-bright)" }}>{sign(a.bonus)}</div>
              <button style={{ padding: "5px 10px", borderRadius: 6, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-active)", color: "var(--t-accent-bright)", fontSize: 10, fontWeight: 700 }}>ROLAR</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)", padding: "4px 4px 8px" }}>PERÍCIAS PROFICIENTES</div>
        <div className="glass" style={{ borderRadius: 14, padding: 4 }}>
          {c.skills.filter((s) => s.prof).map((s, i, arr) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: i === arr.length - 1 ? "none" : "1px dashed var(--t-border)", fontSize: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--t-accent-bright)", boxShadow: "0 0 6px var(--t-accent-glow)" }} />
              <span style={{ flex: 1, color: "var(--t-text)" }}>{s.name}</span>
              <span className="mono" style={{ fontSize: 9.5, color: "var(--t-text-mute)" }}>{s.abil}</span>
              <span className="serif" style={{ fontSize: 14, fontWeight: 600, color: "var(--t-accent-bright)" }}>{sign(s.mod)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileCampaigns = () => {
  const { CAMPAIGNS = [] } = window.MOCK || {};
  const { Pill } = window.UI;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: "8px 4px 0" }}>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>Campanhas</h1>
        <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>{CAMPAIGNS.length} mesas</div>
      </div>
      {CAMPAIGNS.length === 0 ? (
        <div className="glass" style={{ borderRadius: 16, padding: 20, color: "var(--t-text-mute)", textAlign: "center" }}>
          Nenhuma campanha cadastrada. Importe ou crie campanhas para preencher esta tela.
        </div>
      ) : CAMPAIGNS.map((c) => (
        <div key={c.id} className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
          <div style={{ height: 80, background: c.cover, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.6))" }} />
            <div style={{ position: "absolute", top: 10, left: 12 }}>
              <Pill color={c.status === "ativa" ? "var(--t-success)" : "var(--t-magic)"}>{c.status}</Pill>
            </div>
          </div>
          <div style={{ padding: 14 }}>
            <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)" }}>{c.name}</div>
            <div style={{ fontSize: 10.5, color: "var(--t-text-mute)", marginBottom: 8 }}>{c.setting}</div>
            <p style={{ fontSize: 12, color: "var(--t-text-soft)", lineHeight: 1.5, margin: 0 }}>{c.summary}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 10.5, color: "var(--t-text-mute)" }}>
              <span><Icon name="users" size={11} style={{ verticalAlign: "-2px" }} /> {c.players}</span>
              <span><Icon name="calendar" size={11} style={{ verticalAlign: "-2px" }} /> {c.sessions} sessões</span>
              <span style={{ marginLeft: "auto", color: "var(--t-accent-bright)" }} className="mono">{Math.round(c.progress * 100)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MobileNotes = ({ role }) => {
  const isDM = role === "mestre";
  const notes = [
    { t: "Sir Tellam de Vorlan", c: "NPC", color: "var(--t-magic)", ex: "Capitão da guarda. Cabelo grisalho, cicatriz no maxilar.", time: "2h", priv: isDM },
    { t: "Estalagem da Lua Quebrada", c: "Local", color: "var(--t-info)", ex: "Atendida por Bruna. 5 PO/noite.", time: "1d" },
    { t: "Resumo — Sessão 14", c: "Sessão", color: "var(--t-accent)", ex: "Casa Sem Janelas. Pegadas de gnolls.", time: "5h" },
    { t: "Pista — medalhão de Aelar", c: "Personagem", color: "var(--t-accent-bright)", ex: "Brilha perto de criaturas mágicas.", time: "1h" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ padding: "8px 4px 0" }}>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>{isDM ? "Caderno do Mestre" : "Minhas Notas"}</h1>
        <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>{notes.length} notas{isDM ? " · 3 privadas 🔒" : ""}</div>
      </div>
      <div className="glass" style={{ borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="search" size={13} style={{ color: "var(--t-text-mute)" }} />
        <input placeholder="Buscar notas..." style={{ background: "none", border: "none", outline: "none", color: "var(--t-text-soft)", fontSize: 12, flex: 1 }} />
      </div>
      {notes.map((n, i) => (
        <div key={i} className="glass" style={{ borderRadius: 14, padding: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: n.color }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: n.color, fontWeight: 700 }}>{n.c.toUpperCase()}{n.priv ? " 🔒" : ""}</span>
            <span className="mono" style={{ fontSize: 9.5, color: "var(--t-text-faint)" }}>{n.time}</span>
          </div>
          <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: "var(--t-text)" }}>{n.t}</div>
          <div style={{ fontSize: 11.5, color: "var(--t-text-mute)", marginTop: 4, lineHeight: 1.45 }}>{n.ex}</div>
        </div>
      ))}
    </div>
  );
};

const MobileCompendium = () => {
  const { COMPENDIUM = [] } = window.MOCK || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ padding: "8px 4px 0" }}>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)", margin: 0 }}>Compêndio</h1>
        <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>Magias, monstros, itens, regras</div>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {["Todos", "Magia", "Monstro", "Item", "Regra"].map((t, i) => (
          <button key={t} style={{
            padding: "7px 14px", borderRadius: 999, whiteSpace: "nowrap",
            background: i === 0 ? "var(--t-accent-tint)" : "var(--t-glass-soft)",
            border: i === 0 ? "1px solid var(--t-border-active)" : "1px solid var(--t-border)",
            color: i === 0 ? "var(--t-accent-bright)" : "var(--t-text-mute)",
            fontSize: 11, fontWeight: 600,
          }}>{t}</button>
        ))}
      </div>
      {COMPENDIUM.length === 0 ? (
        <div className="glass" style={{ borderRadius: 14, padding: 18, color: "var(--t-text-mute)", textAlign: "center" }}>
          Nenhum item no compêndio. Crie ou importe conteúdo para que ele apareça aqui.
        </div>
      ) : COMPENDIUM.map((it) => (
        <div key={it.name} className="glass" style={{ borderRadius: 14, padding: 14, display: "flex", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${it.color}1f`, border: `1px solid ${it.color}50`,
            color: it.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name={it.icon} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 1.2, color: it.color, fontWeight: 700 }}>{it.type.toUpperCase()}</div>
            <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: "var(--t-text)" }}>{it.name}</div>
            <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2, lineHeight: 1.4 }}>{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

window.MobileShell = MobileShell;
window.MobileScreens = { MobileDashboard, MobileCharacter, MobileCampaigns, MobileNotes, MobileCompendium };
