// ── HeroCard ──────────────────────────────────────────────────────────────────
const HeroCard = ({ hero, idx, onClick }) => {
  const hpPct = hero.hpMax > 0 ? Math.min(100, Math.round((hero.hp / hero.hpMax) * 100)) : 0;
  const hpColor = hpPct > 60 ? "#7ba85d" : hpPct > 30 ? "#c8933a" : "#c25555";
  const hasPhoto = !!hero.photo;

  return (
    <div
      onClick={onClick}
      className="glass"
      style={{
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        border: "1px solid var(--t-border)",
        transition: "border-color 180ms, transform 180ms",
        position: "relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-border-strong)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Photo / gradient header */}
      <div style={{
        height: 110, position: "relative",
        background: hasPhoto
          ? `url(${hero.photo}) center/cover no-repeat`
          : "linear-gradient(160deg, #1a1038 0%, #0e0820 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(8,5,18,0.85) 100%)" }} />
        {!hasPhoto && (
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(157,123,216,0.2)", border: "2px solid rgba(157,123,216,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
            color: "rgba(218,180,120,0.7)", zIndex: 1,
          }}>
            {(hero.name || "?")[0].toUpperCase()}
          </div>
        )}
        {/* Level badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          padding: "3px 9px", borderRadius: 20,
          background: "rgba(200,147,58,0.22)", border: "1px solid rgba(200,147,58,0.5)",
          color: "#f0c170", fontSize: 10, fontWeight: 700, letterSpacing: 0.9, zIndex: 2,
        }} className="mono">Nv {hero.level || 1}</div>
      </div>

      <div style={{ padding: "12px 16px 16px" }}>
        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.2, marginBottom: 3 }}>
          {hero.name || "Sem nome"}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--t-text-mute)", marginBottom: 12 }}>
          {[hero.species || hero.race, hero.class].filter(Boolean).join(" · ") || "—"}
        </div>

        {/* HP bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: 1, color: "var(--t-text-faint)" }}>PV</span>
            <span className="mono" style={{ fontSize: 9, color: hpColor }}>
              {hero.hp ?? 0}/{hero.hpMax || 0}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
            <div style={{ width: `${hpPct}%`, height: "100%", borderRadius: 2, background: hpColor, transition: "width 300ms" }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--t-border)" }}>
          <div style={{ textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-accent-bright)" }}>{hero.ac || 10}</div>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1, color: "var(--t-text-faint)" }}>CA</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "#9d7bd8" }}>{hero.speed || 30}</div>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1, color: "var(--t-text-faint)" }}>DESL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CharacterList ─────────────────────────────────────────────────────────────
const CharacterList = ({ setView, setActiveHeroIndex }) => {
  const [heroes, setHeroes] = React.useState(() => window.Auth?.getHeroes?.() || []);

  React.useEffect(() => {
    const refresh = () => setHeroes(window.Auth?.getHeroes?.() || []);
    window.addEventListener("vg:auth-update", refresh);
    window.addEventListener("vg:appdata-update", refresh);
    return () => {
      window.removeEventListener("vg:auth-update", refresh);
      window.removeEventListener("vg:appdata-update", refresh);
    };
  }, []);

  const openHero = (idx) => {
    setActiveHeroIndex(idx);
    setView("character");
  };

  const createNew = () => {
    setActiveHeroIndex(null);
    setView("character");
  };

  return (
    <div data-screen-label="Fichas">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>
            Fichas de Personagem
          </h2>
          <div style={{ fontSize: 12.5, color: "var(--t-text-mute)", marginTop: 4 }}>
            {heroes.length} personagem{heroes.length !== 1 ? "s" : ""} criado{heroes.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={createNew}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 11,
            background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)",
            color: "var(--t-accent-bright)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "opacity 150ms",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <Icon name="plus" size={14} />
          Nova Ficha
        </button>
      </div>

      {heroes.length === 0 ? (
        <div className="glass" style={{
          borderRadius: 20, padding: "60px 24px", textAlign: "center",
          border: "1px dashed rgba(218,180,120,0.14)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚔</div>
          <div className="serif" style={{ fontSize: 22, color: "var(--t-text)", marginBottom: 8 }}>
            Nenhum personagem ainda
          </div>
          <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginBottom: 24 }}>
            Crie sua primeira ficha e comece a aventura
          </div>
          <button
            onClick={createNew}
            style={{
              padding: "11px 28px", borderRadius: 12,
              background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)",
              color: "var(--t-accent-bright)", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Criar Personagem
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 }}>
          {heroes.map((h, idx) => (
            <HeroCard key={idx} hero={h} idx={idx} onClick={() => openHero(idx)} />
          ))}
          {/* Add new card */}
          <div
            onClick={createNew}
            style={{
              borderRadius: 18, overflow: "hidden", cursor: "pointer",
              border: "1px dashed rgba(218,180,120,0.2)",
              background: "rgba(255,245,220,0.02)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: 240, gap: 10,
              transition: "border-color 180ms, background 180ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(218,180,120,0.45)"; e.currentTarget.style.background = "rgba(255,245,220,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(218,180,120,0.2)"; e.currentTarget.style.background = "rgba(255,245,220,0.02)"; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1px dashed rgba(218,180,120,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(218,180,120,0.4)", fontSize: 22,
            }}>+</div>
            <div style={{ fontSize: 12.5, color: "var(--t-text-faint)" }}>Nova Ficha</div>
          </div>
        </div>
      )}
    </div>
  );
};

window.CharacterList = CharacterList;
