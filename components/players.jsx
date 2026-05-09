const Players = () => {
  const { PLAYERS } = window.MOCK;
  const { Pill, Btn, Avatar, SectionTitle } = window.UI;
  const [filter, setFilter] = useState("todos");
  const [layout, setLayout] = useState("grid");

  const filtered = PLAYERS.filter((p) =>
    filter === "todos" ? true : filter === "online" ? p.status === "online" : p.status !== "online"
  );

  return (
    <div data-screen-label="Jogadores">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Jogadores</h1>
          <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>{PLAYERS.length} aventureiros em suas mesas</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="glass-soft" style={{ padding: 4, borderRadius: 10, display: "flex", gap: 2 }}>
            {["todos", "online", "offline"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "8px 14px", borderRadius: 7,
                background: filter === f ? "var(--t-accent-tint)" : "transparent",
                color: filter === f ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)",
                border: "none", fontSize: 12, fontWeight: 600, textTransform: "capitalize",
              }}>{f}</button>
            ))}
          </div>
          <div className="glass-soft" style={{ padding: 4, borderRadius: 10, display: "flex", gap: 2 }}>
            <button onClick={() => setLayout("grid")} style={{ padding: 8, borderRadius: 7, background: layout === "grid" ? "var(--t-accent-tint)" : "transparent", color: layout === "grid" ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)", border: "none" }}><Icon name="grid" size={14} /></button>
            <button onClick={() => setLayout("list")} style={{ padding: 8, borderRadius: 7, background: layout === "list" ? "var(--t-accent-tint)" : "transparent", color: layout === "list" ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)", border: "none" }}><Icon name="list" size={14} /></button>
          </div>
          <Btn icon="plus">Convidar</Btn>
        </div>
      </div>

      {layout === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {filtered.map((p) => {
            const hpVal = parseInt(p.hp.split("/")[0]);
            const hpMax = parseInt(p.hp.split("/")[1]);
            return (
              <div key={p.id} className="glass" style={{ borderRadius: 18, padding: 22, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 90, background: `radial-gradient(ellipse at 50% 0%, ${p.accent}40, transparent 70%)` }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div style={{ position: "relative", marginBottom: 14 }}>
                    <Avatar name={p.name} size={68} color={p.accent} />
                    <span style={{
                      position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%",
                      background: p.status === "online" ? "#7ba85d" : p.status === "ausente" ? "var(--t-accent-bright)" : "#54545c",
                      border: "3px solid #181226",
                    }} />
                  </div>
                  <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)" }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 14 }}>{p.handle}</div>
                  <Pill color={p.accent}>{p.char}</Pill>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, width: "100%", marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--t-border)" }}>
                    <div>
                      <div className="serif gold-bright" style={{ fontSize: 18, fontWeight: 600 }}>{p.level}</div>
                      <div style={{ fontSize: 9.5, letterSpacing: 1, color: "var(--t-text-faint)" }} className="mono">NÍVEL</div>
                    </div>
                    <div>
                      <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: hpVal === hpMax ? "#7ba85d" : "var(--t-accent-bright)" }}>{p.hp.split("/")[0]}</div>
                      <div style={{ fontSize: 9.5, letterSpacing: 1, color: "var(--t-text-faint)" }} className="mono">PV</div>
                    </div>
                    <div>
                      <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "#9d7bd8" }}>{p.campaigns}</div>
                      <div style={{ fontSize: 9.5, letterSpacing: 1, color: "var(--t-text-faint)" }} className="mono">MESAS</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 14 }}>
                    <button style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, fontWeight: 600 }}>Ver Ficha</button>
                    <button style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)", color: "rgba(232,227,214,0.7)" }}><Icon name="chat" size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 1.5fr 80px 100px 100px 100px 80px", padding: "14px 22px", fontSize: 10, letterSpacing: 1.3, color: "var(--t-text-mute)", fontWeight: 600, borderBottom: "1px solid var(--t-border)" }} className="mono">
            <span></span><span>JOGADOR</span><span>PERSONAGEM</span><span>NÍVEL</span><span>PV</span><span>MESAS</span><span>STATUS</span><span></span>
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} style={{
              display: "grid", gridTemplateColumns: "60px 1.5fr 1.5fr 80px 100px 100px 100px 80px",
              padding: "14px 22px", alignItems: "center", fontSize: 13,
              borderBottom: i === filtered.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)",
            }}>
              <Avatar name={p.name} size={36} color={p.accent} />
              <div>
                <div style={{ color: "var(--t-text)", fontWeight: 600 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--t-text-mute)" }}>{p.handle}</div>
              </div>
              <span className="serif" style={{ fontSize: 15, color: "var(--t-text-soft)" }}>{p.char}</span>
              <span className="serif gold-bright" style={{ fontSize: 18, fontWeight: 600 }}>{p.level}</span>
              <span className="mono" style={{ fontSize: 12 }}>{p.hp}</span>
              <span style={{ color: "rgba(232,227,214,0.7)" }}>{p.campaigns}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.status === "online" ? "#7ba85d" : p.status === "ausente" ? "var(--t-accent-bright)" : "#54545c" }} />
                <span style={{ fontSize: 11.5, color: "rgba(232,227,214,0.7)", textTransform: "capitalize" }}>{p.status}</span>
              </span>
              <button style={{ padding: "6px 10px", borderRadius: 6, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, fontWeight: 600 }}>Ver</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.Players = Players;
