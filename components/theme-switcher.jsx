// Theme + Viewport switcher — floating control panel
const { useState: useStateTS } = React;
const Icon_TS = window.Icon;
const ThemeSwitcher = ({ theme, setTheme, viewport, setViewport }) => {
  const [open, setOpen] = useStateTS(false);
  const themes = [
    {
      id: "default", name: "Vasteria", sub: "Alta fantasia",
      glyph: "✦",
      colors: ["#d8a25a", "#9d7bd8", "#0a0712"],
    },
    {
      id: "blood", name: "Noite do Sangue", sub: "Horror moderno",
      glyph: "†",
      colors: ["#c8243a", "#ff5060", "#060304"],
    },
    {
      id: "cthulhu", name: "O Chamado", sub: "Horror cósmico",
      glyph: "Ψ",
      colors: ["#4a9b8e", "#7dc8b8", "#0a1318"],
    },
    {
      id: "kh-sora", name: "Kingdom Key", sub: "Sora · Destiny Islands",
      glyph: "♛",
      colors: ["#ffd64a", "#5fbfff", "#06122a"],
    },
    {
      id: "kh-dark", name: "Reino das Trevas", sub: "Sem-Coração",
      glyph: "♥",
      colors: ["#b860ff", "#ffcc40", "#050208"],
    },
  ];

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", top: 32, right: 32, zIndex: 60,
          width: 46, height: 46, borderRadius: "50%",
          background: "var(--t-glass-strong)",
          border: "1px solid var(--t-border-active)",
          backdropFilter: "blur(20px)",
          color: "var(--t-accent-bright)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        title="Trocar tema"
      >
        <Icon_TS name="spark" size={18} />
      </button>

      {open && (
        <div
          className="glass-strong"
          style={{
            position: "fixed", top: 88, right: 32, zIndex: 60,
            width: 300, padding: 18, borderRadius: 16,
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)" }}>Aparência</div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--t-text-mute)", padding: 4 }}>
              <Icon_TS name="close" size={14} />
            </button>
          </div>

          <div className="mono" style={{ fontSize: 9, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>TEMA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {themes.map((t) => {
              const active = theme === t.id;
              return (
                <button key={t.id} onClick={() => setTheme(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: 12, borderRadius: 10,
                  background: active ? "var(--t-accent-tint)" : "var(--t-glass-soft)",
                  border: active ? "1px solid var(--t-border-active)" : "1px solid var(--t-border)",
                  textAlign: "left", color: "var(--t-text-soft)",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[2]})`,
                    border: `1px solid ${t.colors[0]}80`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, color: t.colors[1], fontFamily: "serif", flexShrink: 0,
                    boxShadow: `0 0 12px -2px ${t.colors[0]}80`,
                  }}>{t.glyph}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{t.sub}</div>
                  </div>
                  {active && <Icon_TS name="check" size={14} style={{ color: "var(--t-accent-bright)" }} />}
                </button>
              );
            })}
          </div>

          <div className="mono" style={{ fontSize: 9, letterSpacing: 1.4, color: "var(--t-text-mute)", marginBottom: 8 }}>DISPOSITIVO</div>
          <div style={{ display: "flex", gap: 6, padding: 4, background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid var(--t-border)" }}>
            {[
              { id: "desktop", l: "Desktop", i: "grid" },
              { id: "mobile", l: "Mobile", i: "shield" },
            ].map((v) => {
              const a = viewport === v.id;
              return (
                <button key={v.id} onClick={() => setViewport(v.id)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 7,
                  background: a ? "var(--t-accent-tint)" : "transparent",
                  border: a ? "1px solid var(--t-border-active)" : "1px solid transparent",
                  color: a ? "var(--t-accent-bright)" : "var(--t-text-mute)",
                  fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <Icon_TS name={v.i} size={12} />{v.l}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

window.ThemeSwitcher = ThemeSwitcher;
