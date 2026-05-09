// 3D Dice Roller — CSS 3D transforms, no deps
const Dice3D = ({ notation = "1d20", mod = 0, label, onRoll, advantage = false, disadvantage = false, autoOpen = false }) => {
  const [open, setOpen] = useState(autoOpen);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const parseNotation = (n) => {
    const m = n.match(/^(\d*)d(\d+)$/i);
    if (!m) return { count: 1, sides: 20 };
    return { count: parseInt(m[1] || "1"), sides: parseInt(m[2]) };
  };
  const { count, sides } = parseNotation(notation);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    const finalRolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    let total = finalRolls.reduce((a, b) => a + b, 0);
    let advRolls = null;
    let chosenRoll = null;
    if ((advantage || disadvantage) && count === 1 && sides === 20) {
      advRolls = [finalRolls[0], 1 + Math.floor(Math.random() * 20)];
      chosenRoll = advantage ? Math.max(...advRolls) : Math.min(...advRolls);
      total = chosenRoll;
    }
    setTimeout(() => {
      setRolling(false);
      const out = { rolls: finalRolls, advRolls, chosen: chosenRoll, total: total + mod, mod, sides, label };
      setResult(out);
      setHistory((h) => [out, ...h].slice(0, 5));
      onRoll?.(out);
    }, 1400);
  };

  const sign = mod >= 0 ? "+" : "";
  const isCrit = result && sides === 20 && (result.chosen ?? result.rolls[0]) === 20;
  const isFumble = result && sides === 20 && (result.chosen ?? result.rolls[0]) === 1;

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "7px 12px", borderRadius: 8,
        background: "rgba(0,0,0,0.35)",
        border: "1px solid var(--t-border)",
        color: "var(--t-accent-bright)",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        fontFamily: "var(--t-font-mono)", letterSpacing: 0.5,
      }}>
        <span style={{ fontSize: 14 }}>⬢</span>
        {notation}{mod !== 0 && <span style={{ color: "var(--t-text-mute)" }}>{sign}{mod}</span>}
      </button>

      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "d3d-fade 220ms ease-out",
        }}>
          <div className="glass-strong" style={{
            position: "relative", width: 460, padding: 28,
            borderRadius: 20, border: "1px solid var(--t-border-strong)",
            boxShadow: "0 30px 80px -10px rgba(0,0,0,0.7), 0 0 60px -10px var(--t-accent-glow)",
          }}>
            <button onClick={() => setOpen(false)} style={{
              position: "absolute", top: 14, right: 14,
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)",
              color: "var(--t-text-mute)", cursor: "pointer", fontSize: 14,
            }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: 8 }}>
              {label && <div className="mono" style={{ fontSize: 10.5, letterSpacing: 1.5, color: "var(--t-text-mute)" }}>{label.toUpperCase()}</div>}
              <div className="serif" style={{ fontSize: 22, color: "var(--t-text)", fontWeight: 600, margin: "4px 0" }}>
                {notation}{mod !== 0 && <span style={{ color: "var(--t-accent-bright)" }}> {sign}{mod}</span>}
                {advantage && <Pill_local c="#7ba85d">VANTAGEM</Pill_local>}
                {disadvantage && <Pill_local c="#c25555">DESVANTAGEM</Pill_local>}
              </div>
            </div>

            {/* Dice arena */}
            <div style={{
              position: "relative", height: 240, margin: "10px 0 14px",
              perspective: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 32,
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.4), transparent 70%)",
              borderRadius: 14,
            }}>
              {sides === 20 ? (
                <D20 rolling={rolling} face={result?.chosen ?? result?.rolls[0]} crit={isCrit} fumble={isFumble} />
              ) : sides === 6 ? (
                Array.from({ length: count }).map((_, i) => (
                  <D6 key={i} rolling={rolling} face={result?.rolls[i]} delay={i * 80} />
                ))
              ) : (
                <DPoly key={`poly-${result?.rolls[0]}`} rolling={rolling} sides={sides} face={result?.rolls[0]} />
              )}
            </div>

            {/* Result strip */}
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: isCrit ? "rgba(123,168,93,0.18)" : isFumble ? "rgba(194,85,85,0.18)" : "rgba(0,0,0,0.3)",
              border: `1px solid ${isCrit ? "rgba(123,168,93,0.55)" : isFumble ? "rgba(194,85,85,0.55)" : "var(--t-border)"}`,
              minHeight: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              {!result && !rolling && <span style={{ color: "var(--t-text-mute)", fontSize: 13 }}>Pressione "Rolar" para começar</span>}
              {rolling && <span className="mono" style={{ color: "var(--t-accent-bright)", fontSize: 13, letterSpacing: 1 }}>rolando…</span>}
              {result && (
                <>
                  <div style={{ fontSize: 11, color: "var(--t-text-mute)", lineHeight: 1.5 }}>
                    <div className="mono">
                      {result.advRolls
                        ? result.advRolls.map((r, i) => <span key={i} style={{ color: r === result.chosen ? "var(--t-accent-bright)" : "var(--t-text-faint)", textDecoration: r === result.chosen ? "none" : "line-through", marginRight: 8 }}>{r}</span>)
                        : result.rolls.join(" + ")}
                      {result.mod !== 0 && <span style={{ color: "var(--t-text-mute)" }}> {result.mod >= 0 ? "+" : ""}{result.mod}</span>}
                    </div>
                    {isCrit && <div className="serif" style={{ color: "#a8d97c", fontSize: 14, fontWeight: 600, marginTop: 2 }}>✦ Acerto crítico</div>}
                    {isFumble && <div className="serif" style={{ color: "#e88080", fontSize: 14, fontWeight: 600, marginTop: 2 }}>✗ Falha crítica</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="serif" style={{ fontSize: 44, fontWeight: 600, color: isCrit ? "#a8d97c" : isFumble ? "#e88080" : "var(--t-accent-bright)", lineHeight: 1 }}>{result.total}</div>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-faint)", marginTop: 2 }}>TOTAL</div>
                  </div>
                </>
              )}
            </div>

            {history.length > 1 && (
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 9.5, color: "var(--t-text-faint)", letterSpacing: 1.2, alignSelf: "center" }}>HISTÓRICO</span>
                {history.slice(1).map((h, i) => (
                  <span key={i} className="mono" style={{ fontSize: 11, padding: "3px 8px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", borderRadius: 6, color: "var(--t-text-mute)" }}>{h.total}</span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={roll} disabled={rolling} style={{
                flex: 1, padding: "12px 16px", borderRadius: 10,
                background: rolling ? "rgba(0,0,0,0.3)" : "linear-gradient(180deg, var(--t-accent), var(--t-accent-deep))",
                border: "1px solid var(--t-border-active)",
                color: rolling ? "var(--t-text-mute)" : "#1a0e04",
                fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
                cursor: rolling ? "wait" : "pointer",
                fontFamily: "var(--t-font-mono)",
                boxShadow: rolling ? "none" : "0 4px 20px -4px var(--t-accent-glow)",
              }}>{rolling ? "ROLANDO…" : result ? "ROLAR DE NOVO" : "ROLAR"}</button>
              {result && <button onClick={() => { setResult(null); setHistory([]); }} style={{
                padding: "12px 16px", borderRadius: 10,
                background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)",
                color: "var(--t-text-mute)", fontSize: 12, cursor: "pointer",
              }}>Limpar</button>}
            </div>
          </div>

          <style>{`
            @keyframes d3d-fade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes d20-tumble {
              0%   { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0); }
              25%  { transform: rotateX(540deg) rotateY(360deg) rotateZ(180deg) translateY(-60px); }
              50%  { transform: rotateX(1080deg) rotateY(720deg) rotateZ(360deg) translateY(0); }
              75%  { transform: rotateX(1440deg) rotateY(1080deg) rotateZ(540deg) translateY(-30px); }
              100% { transform: rotateX(1800deg) rotateY(1440deg) rotateZ(720deg) translateY(0); }
            }
            @keyframes d6-tumble {
              0%   { transform: rotateX(0deg) rotateY(0deg) translateY(0); }
              50%  { transform: rotateX(720deg) rotateY(540deg) translateY(-50px); }
              100% { transform: rotateX(1440deg) rotateY(1080deg) translateY(0); }
            }
            @keyframes d3d-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.08); }
            }
            @keyframes d3d-crit-glow {
              0%, 100% { filter: drop-shadow(0 0 12px rgba(168,217,124,0.7)); }
              50% { filter: drop-shadow(0 0 26px rgba(168,217,124,1)); }
            }
            @keyframes d3d-fumble-glow {
              0%, 100% { filter: drop-shadow(0 0 12px rgba(232,128,128,0.7)); }
              50% { filter: drop-shadow(0 0 24px rgba(232,128,128,1)); }
            }
            @keyframes d3d-shadow-grow {
              0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.4; }
              50% { transform: translate(-50%, 0) scale(0.5); opacity: 0.15; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

const Pill_local = ({ c, children }) => (
  <span style={{
    display: "inline-block", marginLeft: 8, padding: "2px 8px",
    borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
    background: `${c}22`, color: c, border: `1px solid ${c}55`,
  }}>{children}</span>
);

const D20 = ({ rolling, face, crit, fumble }) => {
  const size = 130;
  const animation = rolling ? "d20-tumble 1.4s cubic-bezier(.4,.1,.3,1) forwards" : crit ? "d3d-crit-glow 1.6s ease-in-out infinite" : fumble ? "d3d-fumble-glow 1.6s ease-in-out infinite" : "d3d-pulse 3s ease-in-out infinite";
  return (
    <div style={{ position: "relative", width: size, height: size + 30 }}>
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: size * 0.7, height: 14, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)",
        filter: "blur(3px)",
        animation: rolling ? "d3d-shadow-grow 1.4s ease-in-out" : "none",
      }} />
      <div style={{
        width: size, height: size, position: "relative",
        transformStyle: "preserve-3d",
        animation,
      }}>
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.6))" }}>
          <defs>
            <linearGradient id="d20a" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--t-accent-bright)" />
              <stop offset="1" stopColor="var(--t-accent-deep)" />
            </linearGradient>
            <linearGradient id="d20b" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--t-accent)" />
              <stop offset="1" stopColor="#3a1f0a" />
            </linearGradient>
            <linearGradient id="d20c" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--t-accent-deep)" />
              <stop offset="1" stopColor="#0a0604" />
            </linearGradient>
          </defs>
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" fill="url(#d20c)" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
          <polygon points="100,10 180,55 100,100" fill="url(#d20a)" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <polygon points="100,10 20,55 100,100" fill="url(#d20b)" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <polygon points="180,55 180,145 100,100" fill="url(#d20a)" opacity="0.7" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <polygon points="20,55 20,145 100,100" fill="url(#d20b)" opacity="0.7" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <polygon points="180,145 100,190 100,100" fill="url(#d20c)" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <polygon points="20,145 100,190 100,100" fill="url(#d20c)" opacity="0.85" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          {!rolling && face != null && (
            <>
              <polygon points="80,80 120,80 100,120" fill="rgba(0,0,0,0.55)" />
              <text x="100" y="106" textAnchor="middle" fill={crit ? "#cfff80" : fumble ? "#ffb0b0" : "#fff5d9"}
                style={{ font: "700 32px/1 var(--t-font-serif), serif", letterSpacing: 0.5 }}>{face}</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

const D6 = ({ rolling, face, delay = 0 }) => {
  const finalRotation = (() => {
    switch (face) {
      case 1: return "rotateX(0deg) rotateY(0deg)";
      case 2: return "rotateX(0deg) rotateY(-90deg)";
      case 3: return "rotateX(-90deg) rotateY(0deg)";
      case 4: return "rotateX(90deg) rotateY(0deg)";
      case 5: return "rotateX(0deg) rotateY(90deg)";
      case 6: return "rotateX(180deg) rotateY(0deg)";
      default: return "rotateX(0deg) rotateY(0deg)";
    }
  })();
  const size = 80;
  const half = size / 2;
  const faceStyle = {
    position: "absolute", width: size, height: size,
    border: "1.5px solid rgba(0,0,0,0.5)",
    background: "linear-gradient(135deg, var(--t-accent-bright), var(--t-accent-deep))",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 38, fontWeight: 700, color: "#1a0e04",
    fontFamily: "var(--t-font-serif), serif",
    borderRadius: 6,
    boxShadow: "inset 0 0 20px rgba(0,0,0,0.3)",
  };
  return (
    <div style={{ position: "relative", width: size, height: size + 24 }}>
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: size * 0.7, height: 10, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)",
        filter: "blur(2px)",
      }} />
      <div style={{
        width: size, height: size, position: "relative",
        transformStyle: "preserve-3d",
        animation: rolling ? `d6-tumble 1.4s ${delay}ms cubic-bezier(.4,.1,.3,1) forwards` : "none",
        transform: rolling ? undefined : finalRotation,
        transition: rolling ? undefined : "transform 200ms ease-out",
      }}>
        <div style={{ ...faceStyle, transform: `translateZ(${half}px)` }}>1</div>
        <div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${half}px)` }}>5</div>
        <div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${half}px)` }}>2</div>
        <div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${half}px)` }}>3</div>
        <div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${half}px)` }}>4</div>
        <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${half}px)` }}>6</div>
      </div>
    </div>
  );
};

const DPoly = ({ rolling, sides, face }) => {
  const size = 110;
  const shapes = {
    4:   "100,15 185,170 15,170",
    8:   "100,15 175,100 100,185 25,100",
    10:  "100,10 165,55 165,145 100,190 35,145 35,55",
    12:  "100,15 165,55 175,135 130,180 70,180 25,135 35,55",
    100: "100,10 165,55 165,145 100,190 35,145 35,55",
  };
  const shape = shapes[sides] || shapes[8];
  return (
    <div style={{ position: "relative", width: size, height: size + 24 }}>
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: size * 0.7, height: 12, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)",
        filter: "blur(3px)",
      }} />
      <div style={{
        width: size, height: size, position: "relative",
        animation: rolling ? "d20-tumble 1.4s cubic-bezier(.4,.1,.3,1) forwards" : "d3d-pulse 3s ease-in-out infinite",
      }}>
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 5px 14px rgba(0,0,0,0.5))" }}>
          <defs>
            <linearGradient id={`dp-${sides}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--t-accent-bright)" />
              <stop offset="1" stopColor="var(--t-accent-deep)" />
            </linearGradient>
          </defs>
          <polygon points={shape} fill={`url(#dp-${sides})`} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
          <polygon points={shape} fill="rgba(0,0,0,0.0)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" transform="translate(-2,-2)" />
          {!rolling && face != null && (
            <text x="100" y="118" textAnchor="middle" fill="#fff5d9"
              style={{ font: "700 44px/1 var(--t-font-serif), serif" }}>{face}</text>
          )}
          <text x="100" y="180" textAnchor="middle" fill="rgba(0,0,0,0.5)"
            style={{ font: "600 12px/1 var(--t-font-mono), monospace", letterSpacing: 1 }}>d{sides}</text>
        </svg>
      </div>
    </div>
  );
};

window.Dice3D = Dice3D;
