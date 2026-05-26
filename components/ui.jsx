// Shared UI primitives
const { useState, useEffect, useRef, useMemo } = React;

const Pill = ({ children, color = "var(--t-accent)", soft = true, style = {}, className = "" }) => (
  <span
    className={className}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: soft ? color : "#0a0610",
      background: soft ? `${color}1f` : color,
      border: `1px solid ${color}40`,
      ...style,
    }}
  >
    {children}
  </span>
);

const Btn = ({ children, variant = "primary", size = "md", icon, onClick, style = {}, className = "" }) => {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12, gap: 6 },
    md: { padding: "10px 16px", fontSize: 13, gap: 8 },
    lg: { padding: "12px 22px", fontSize: 14, gap: 10 },
  };
  const variants = {
    primary: {
      background: "linear-gradient(180deg, var(--t-accent) 0%, var(--t-accent-deep) 100%)",
      color: "#1a0e04",
      border: "1px solid rgba(255, 220, 170, 0.4)",
      boxShadow: "0 6px 18px -4px var(--t-accent-glow), 0 0 0 1px rgba(255,255,255,0.1) inset",
    },
    ghost: {
      background: "rgba(255, 245, 220, 0.04)",
      color: "var(--t-text-soft)",
      border: "1px solid var(--t-border-strong)",
    },
    outline: {
      background: "transparent",
      color: "var(--t-accent)",
      border: "1px solid var(--t-border-active)",
    },
    danger: {
      background: "rgba(194, 85, 85, 0.15)",
      color: "#f0a0a0",
      border: "1px solid rgba(194, 85, 85, 0.4)",
    },
  };
  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        fontWeight: 600,
        letterSpacing: 0.2,
        cursor: "pointer",
        transition: "transform 120ms ease, filter 200ms",
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
};

const StatBlock = ({ label, value, sub, accent = "var(--t-accent)" }) => (
  <div className="glass-soft" style={{ padding: 14, borderRadius: 14, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: "100%", background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--t-text-mute)", fontWeight: 600 }}>{label}</div>
    <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--t-text)", marginTop: 4, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 6 }}>{sub}</div>}
  </div>
);

// Hex-shaped ability score block (D&D feel without copying any brand)
const AbilityHex = ({ name, full, score, mod, save, saveProf }) => {
  const [open, setOpen] = useState(false);
  const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
  return (
    <>
    <div
      className="glass"
      style={{
        position: "relative",
        padding: "16px 14px",
        borderRadius: 16,
        textAlign: "center",
        cursor: "pointer",
        transition: "transform 200ms, border-color 200ms",
      }}
      onClick={() => setOpen(true)}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--t-border-active)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--t-border)"; }}
    >
      <div style={{ fontSize: 10, letterSpacing: 1.6, color: "var(--t-text-mute)", fontWeight: 700 }}>{name}</div>
      <div className="serif" style={{ fontSize: 36, fontWeight: 600, color: "var(--t-accent-bright)", lineHeight: 1, margin: "6px 0 4px" }}>{sign(mod)}</div>
      <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)", fontSize: 11, fontWeight: 600, color: "var(--t-text-soft)" }}>{score}</div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed rgba(218,180,120,0.18)", fontSize: 10, color: "var(--t-text-mute)" }}>
        Salv. <span style={{ color: saveProf ? "var(--t-accent-bright)" : "var(--t-text-soft)", fontWeight: 600 }}>{sign(save)}</span>
        {saveProf && <span className="gold" style={{ marginLeft: 4 }}>●</span>}
      </div>
    </div>
    {open && window.Dice3D && <window.Dice3D notation="1d20" mod={mod} label={`Teste · ${full || name}`} autoOpen key={Date.now()} />}
    </>
  );
};

// Animated D20 roller — floating dice tray
const DiceTray = ({ open, onClose }) => {
  const [history, setHistory] = useState([
    { die: "d20", roll: 17, total: 20, label: "Percepção", time: "agora" },
    { die: "d8", roll: 5, total: 9, label: "Dano arco", time: "1m" },
    { die: "d20", roll: 1, total: 1, label: "Atletismo", time: "3m" },
  ]);
  const [rolling, setRolling] = useState(false);
  const { QUICK_DICE = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] } = useAppMock();

  const rollDie = (die) => {
    const sides = parseInt(die.slice(1));
    setRolling(true);
    setTimeout(() => {
      const r = Math.floor(Math.random() * sides) + 1;
      setHistory((h) => [{ die, roll: r, total: r, label: "rolagem rápida", time: "agora" }, ...h].slice(0, 8));
      setRolling(false);
    }, 600);
  };

  if (!open) return null;
  return (
    <div className="glass-strong" style={{
      position: "fixed", right: 24, bottom: 24, width: 320, borderRadius: 20, padding: 18, zIndex: 50,
      boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="dice" size={18} className="gold" />
          <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Mesa de Dados</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", padding: 4 }}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
        {quickDice.map((d) => (
          <button key={d} onClick={() => rollDie(d)}
            style={{
              padding: "12px 0", borderRadius: 10,
              background: "var(--t-accent-soft)", border: "1px solid rgba(218,162,90,0.25)",
              color: "var(--t-accent-bright)", fontWeight: 600, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--t-accent-tint)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--t-accent-soft)"}
          >{d}</button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--t-text-faint)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Histórico</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
        {history.map((h, i) => (
          <div key={i} className="glass-soft" style={{ padding: "8px 12px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono gold" style={{ fontSize: 10, padding: "2px 6px", background: "var(--t-accent-soft)", borderRadius: 4 }}>{h.die}</span>
              <span style={{ color: "rgba(232,227,214,0.7)" }}>{h.label}</span>
            </div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: h.total >= 18 ? "var(--t-accent-bright)" : h.total <= 4 ? "#c25555" : "var(--t-text-soft)" }}>{h.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Decorative rune divider
const RuneDivider = ({ glyph = "✦" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(218,180,120,0.3)" }}>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--t-border-strong), transparent)" }} />
    <span style={{ fontSize: 14 }}>{glyph}</span>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--t-border-strong), transparent)" }} />
  </div>
);

// Avatar with initials
const Avatar = ({ name, size = 36, color = "var(--t-accent)" }) => {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}66, ${color}22)`,
      border: `1px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.36, color: "var(--t-text)", letterSpacing: 0.5, flexShrink: 0,
    }}>{initials}</div>
  );
};

// Section heading with rune
const SectionTitle = ({ children, sub, action }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
    <div>
      <h2 className="serif" style={{ fontSize: 28, fontWeight: 600, margin: 0, color: "var(--t-text)", letterSpacing: 0.3 }}>{children}</h2>
      {sub && <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

window.UI = { Pill, Btn, StatBlock, AbilityHex, DiceTray, RuneDivider, Avatar, SectionTitle };
