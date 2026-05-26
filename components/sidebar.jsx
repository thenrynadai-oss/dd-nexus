const Sidebar = ({ view, setView, openDice, role, setRole }) => {
  const isDM = role === "mestre";
  const [user, setUser] = React.useState(() => window.Auth?.getCurrentUser() || {});
  React.useEffect(() => {
    const refresh = () => setUser(window.Auth?.getCurrentUser() || {});
    window.addEventListener("vg:auth-update", refresh);
    return () => window.removeEventListener("vg:auth-update", refresh);
  }, []);
  const userName = user.nome || (isDM ? "Mestre" : "Jogador");
  const userApelido = user.apelido ? `@${user.apelido}` : "";
  const userImg = user.profileImg || null;
  const dmItems = [
    { id: "dashboard", label: "Mesa", icon: "home" },
    { id: "campaigns", label: "Campanhas", icon: "scroll" },
    { id: "character", label: "Ficha", icon: "shield" },
    { id: "players", label: "Jogadores", icon: "users" },
    { id: "notes", label: "Anotações", icon: "feather" },
    { id: "compendium", label: "Compêndio", icon: "book" },
    { id: "settings", label: "Configurações", icon: "settings" },
  ];
  const playerItems = [
    { id: "dashboard", label: "Mesa", icon: "home" },
    { id: "character", label: "Minha Ficha", icon: "shield" },
    { id: "campaigns", label: "Minhas Campanhas", icon: "scroll" },
    { id: "notes", label: "Minhas Notas", icon: "feather" },
    { id: "compendium", label: "Compêndio", icon: "book" },
    { id: "settings", label: "Configurações", icon: "settings" },
  ];
  const items = isDM ? dmItems : playerItems;
  return (
    <aside style={{
      position: "fixed", left: 18, top: 18, bottom: 18,
      width: 240, zIndex: 30,
      display: "flex", flexDirection: "column",
    }} className="glass-strong" >
      <div style={{
        padding: "22px 22px 18px",
        borderBottom: "1px solid var(--t-border)",
        borderRadius: "12px 12px 0 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {userImg ? (
            <img src={userImg} style={{
              width: 38, height: 38, borderRadius: 10, objectFit: "cover",
              border: "1px solid var(--t-border-strong)",
              boxShadow: "0 0 16px -4px var(--t-accent-glow)",
            }} />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: isDM ? "linear-gradient(135deg, #6e4da0, #3a1f70)" : "linear-gradient(135deg, var(--t-accent), #5a2e10)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,220,170,0.2)",
              boxShadow: "0 0 16px -4px var(--t-accent-glow)",
              fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "serif",
            }}>
              {userName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="serif" style={{
              fontSize: 17, fontWeight: 600, color: "var(--t-text)", lineHeight: 1,
              textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
            }}>{userName}</div>
            {userApelido && (
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1, color: "rgba(218,180,120,0.6)", marginTop: 4 }}>
                {userApelido}
              </div>
            )}
          </div>
        </div>

        {/* Role toggle */}
        <div style={{ display: "flex", marginTop: 16, padding: 3, borderRadius: 10, background: "rgba(0,0,0,0.35)", border: "1px solid var(--t-border)" }}>
          {[{ id: "mestre", l: "Mestre", i: "crown" }, { id: "jogador", l: "Jogador", i: "shield" }].map((r) => {
            const a = role === r.id;
            return (
              <button key={r.id} onClick={() => setRole(r.id)} style={{
                flex: 1, padding: "7px 0", borderRadius: 7,
                background: a ? (r.id === "mestre" ? "linear-gradient(180deg, rgba(157,123,216,0.25), rgba(157,123,216,0.08))" : "linear-gradient(180deg, rgba(218,162,90,0.25), var(--t-accent-soft))") : "transparent",
                border: a ? `1px solid ${r.id === "mestre" ? "rgba(157,123,216,0.5)" : "var(--t-border-active)"}` : "1px solid transparent",
                color: a ? (r.id === "mestre" ? "#c9b0e8" : "var(--t-accent-bright)") : "var(--t-text-mute)",
                fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <Icon name={r.i} size={11} />{r.l}
              </button>
            );
          })}
        </div>
      </div>

      <nav style={{ padding: "14px 12px", flex: 1 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.6, color: "var(--t-text-faint)", padding: "6px 10px 8px" }}>NAVEGAÇÃO</div>
        {items.map((it) => {
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 12px", marginBottom: 2,
                borderRadius: 10,
                background: active ? "linear-gradient(90deg, var(--t-accent-tint), rgba(218,162,90,0.04))" : "transparent",
                border: active ? "1px solid var(--t-border-strong)" : "1px solid transparent",
                color: active ? "var(--t-accent-bright)" : "rgba(232,227,214,0.7)",
                fontSize: 13, fontWeight: 500, textAlign: "left",
                transition: "all 180ms",
                position: "relative",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,245,220,0.04)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {active && <div style={{ position: "absolute", left: -1, top: 8, bottom: 8, width: 2, background: "var(--t-accent-bright)", borderRadius: 2, boxShadow: "0 0 8px var(--t-accent-bright)" }} />}
              <Icon name={it.icon} size={17} />
              <span>{it.label}</span>
            </button>
          );
        })}

        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.6, color: "var(--t-text-faint)", padding: "20px 10px 8px" }}>FERRAMENTAS</div>
        <button onClick={openDice} style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "11px 12px", marginBottom: 2, borderRadius: 10,
          background: "transparent", border: "1px solid transparent",
          color: "rgba(232,227,214,0.7)", fontSize: 13, fontWeight: 500, textAlign: "left",
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,245,220,0.04)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <Icon name="dice" size={17} />
          <span>Mesa de Dados</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(218,180,120,0.5)" }} className="mono">⌘D</span>
        </button>
        {[
          { icon: "map", label: "Mapas", tag: "em breve" },
          { icon: "chat", label: "Chat de Mesa", tag: "em breve" },
        ].map(it => (
          <button key={it.label} title={`${it.label} — em breve`} style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", padding: "11px 12px", marginBottom: 2, borderRadius: 10,
            background: "transparent", border: "1px solid transparent",
            color: "rgba(232,227,214,0.4)", fontSize: 13, fontWeight: 500, textAlign: "left",
            cursor: "default", opacity: 0.6,
          }}>
            <Icon name={it.icon} size={17} />
            <span>{it.label}</span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: 8.5, letterSpacing: 0.8, color: "rgba(218,180,120,0.35)", border: "1px solid rgba(218,180,120,0.15)", borderRadius: 4, padding: "1px 5px" }}>em breve</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: 14, borderTop: "1px solid var(--t-border)" }}>
        <div className="glass-soft" style={{ padding: 10, borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--t-text-mute)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {isDM ? "Mestre · Sem campanha ativa" : "Jogador · Sem personagem atribuído"}
            </div>
          </div>
          <button onClick={() => setView("settings")} title="Configurações" style={{ background: "none", border: "none", color: "var(--t-text-mute)", padding: 4, cursor: "pointer" }}>
            <Icon name="settings" size={15} />
          </button>
          <button
            title="Desconectar"
            onClick={() => {
              if (!confirm("Deseja sair da sua conta?")) return;
              window.Auth?.logout();
              window.location.href = "index.html";
            }}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgba(200,80,80,0.7)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#e05555"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(200,80,80,0.7)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
