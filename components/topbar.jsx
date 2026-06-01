const TopBar = ({ title, subtitle, breadcrumbs = [], openDice, onBack }) => {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 22px", marginBottom: 22,
      gap: 16,
    }} className="glass" >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {onBack ? (
          <button
            onClick={onBack}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-border-strong)"; e.currentTarget.style.color = "var(--t-text)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-mute)"; }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 9,
              background: "rgba(218,162,90,0.05)", border: "1px solid var(--t-border)",
              color: "var(--t-text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "border-color 160ms, color 160ms", flexShrink: 0,
            }}
          >
            <Icon name="chevron" size={12} style={{ transform: "rotate(180deg)", display: "block" }} />
            Voltar
          </button>
        ) : breadcrumbs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--t-text-mute)" }} className="mono">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <span>{b}</span>
                {i < breadcrumbs.length - 1 && <Icon name="chevron" size={11} />}
              </React.Fragment>
            ))}
          </div>
        )}
        <div>
          <h1 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--t-text)", lineHeight: 1.1 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 12, color: "var(--t-text-mute)", marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 10,
          background: "rgba(0,0,0,0.25)", border: "1px solid var(--t-border)",
          width: 280,
        }}>
          <Icon name="search" size={14} style={{ color: "var(--t-text-faint)" }} />
          <input
            placeholder="Buscar fichas, magias, monstros..."
            style={{ background: "none", border: "none", color: "var(--t-text-soft)", fontSize: 12.5, outline: "none", flex: 1 }}
          />
          <span className="mono" style={{ fontSize: 9, padding: "1px 5px", background: "var(--t-border)", borderRadius: 4, color: "var(--t-text-mute)" }}>⌘K</span>
        </div>
        <button onClick={openDice} style={{
          width: 38, height: 38, borderRadius: 10,
          background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)",
          color: "var(--t-accent-bright)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="dice" size={16} />
        </button>
        <button style={{
          width: 38, height: 38, borderRadius: 10,
          background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)",
          color: "rgba(232,227,214,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <Icon name="bell" size={16} />
          <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#c25555", border: "2px solid #1a1322" }} />
        </button>
      </div>
    </div>
  );
};

window.TopBar = TopBar;
