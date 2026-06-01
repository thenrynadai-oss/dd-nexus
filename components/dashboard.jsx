const Dashboard = ({ setView, setActiveCampaign, role = "mestre" }) => {
  const isDM = role === "mestre";
  const { CAMPAIGNS = [], ACTIVITY = [], PLAYERS = [], CHARACTER = {} } = useAppMock();
  const { Pill, Btn, SectionTitle, Avatar } = window.UI;
  const hasCampaigns = CAMPAIGNS.length > 0;
  const hasPlayers = PLAYERS.length > 0;
  const hasActivity = ACTIVITY.length > 0;
  const next = CAMPAIGNS[0] || null;

  // ── EMPTY STATE — usuário novo, sem nenhum dado ─────────────────────────────
  if (!hasCampaigns) {
    return (
      <div data-screen-label="Dashboard">

        {/* ─── BANNER VASTERIA ─────────────────────────────────────── */}
        <div style={{
          position: "relative", borderRadius: 22, overflow: "hidden",
          marginBottom: 20,
          background: "linear-gradient(160deg, #130c38 0%, #0c0820 45%, #180830 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexWrap: "wrap", gap: 28, padding: "44px 48px",
          boxShadow: "inset 0 0 80px rgba(60,20,120,0.3), 0 4px 40px rgba(0,0,0,0.6)",
          border: "1px solid rgba(200,147,58,0.12)",
          minHeight: 180,
        }}>
          {/* Halo de luz */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(90,40,180,0.2), transparent 70%)",
          }} />

          {/* Logo hexágono */}
          <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
            {isDM ? (
              /* Estrela 8 pontas — Mesa do Mestre */
              <svg width="110" height="110" viewBox="0 0 192 192">
                <defs>
                  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0c84a"/>
                    <stop offset="50%" stopColor="#c8933a"/>
                    <stop offset="100%" stopColor="#8a5e18"/>
                  </linearGradient>
                  <linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8b840"/>
                    <stop offset="100%" stopColor="#7a5010"/>
                  </linearGradient>
                </defs>
                <polygon points="54,24 138,24 180,96 138,168 54,168 12,96"
                  fill="none" stroke="url(#mg)" strokeWidth="6" strokeLinejoin="round"/>
                <polygon points="60,34 132,34 168,96 132,158 60,158 24,96"
                  fill="rgba(12,9,24,0.85)" stroke="url(#mg)" strokeWidth="3" strokeLinejoin="round"/>
                <polygon
                  points="96,44 102.7,82.5 132.8,59.2 109.5,90.1 148,96 109.5,101.9 132.8,132.8 102.7,109.5 96,148 89.3,109.5 59.2,132.8 82.5,102.7 44,96 82.5,89.3 59.2,59.2 89.3,82.5"
                  fill="url(#mg2)" stroke="url(#mg)" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="96" y1="96" x2="96" y2="44" stroke="#f0c84a" strokeWidth="1" opacity="0.6"/>
                <line x1="96" y1="96" x2="148" y2="96" stroke="#f0c84a" strokeWidth="1" opacity="0.6"/>
                <line x1="96" y1="96" x2="96" y2="148" stroke="#f0c84a" strokeWidth="1" opacity="0.6"/>
                <line x1="96" y1="96" x2="44" y2="96" stroke="#f0c84a" strokeWidth="1" opacity="0.6"/>
                <line x1="96" y1="96" x2="132.8" y2="59.2" stroke="#f0c84a" strokeWidth="1" opacity="0.35"/>
                <line x1="96" y1="96" x2="132.8" y2="132.8" stroke="#f0c84a" strokeWidth="1" opacity="0.35"/>
                <line x1="96" y1="96" x2="59.2" y2="132.8" stroke="#f0c84a" strokeWidth="1" opacity="0.35"/>
                <line x1="96" y1="96" x2="59.2" y2="59.2" stroke="#f0c84a" strokeWidth="1" opacity="0.35"/>
              </svg>
            ) : (
              /* D20 — Mesa do Jogador */
              <svg width="110" height="110" viewBox="0 0 192 192">
                <defs>
                  <linearGradient id="jg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0c84a"/>
                    <stop offset="50%" stopColor="#c8933a"/>
                    <stop offset="100%" stopColor="#8a5e18"/>
                  </linearGradient>
                </defs>
                <polygon points="54,24 138,24 180,96 138,168 54,168 12,96"
                  fill="none" stroke="url(#jg)" strokeWidth="6" strokeLinejoin="round"/>
                <polygon points="60,34 132,34 168,96 132,158 60,158 24,96"
                  fill="rgba(12,9,24,0.85)" stroke="url(#jg)" strokeWidth="3" strokeLinejoin="round"/>
                {/* Círculo do dado */}
                <circle cx="96" cy="96" r="52" fill="none" stroke="url(#jg)" strokeWidth="2"/>
                {/* Pentágono central */}
                <polygon points="96,74 116.9,89.2 108.9,113.8 83.1,113.8 75.1,89.2"
                  fill="none" stroke="url(#jg)" strokeWidth="2"/>
                {/* 5 triângulos do pentágono aos vértices externos */}
                <line x1="96" y1="74" x2="96" y2="44" stroke="url(#jg)" strokeWidth="1.5"/>
                <line x1="116.9" y1="89.2" x2="145.5" y2="79.9" stroke="url(#jg)" strokeWidth="1.5"/>
                <line x1="108.9" y1="113.8" x2="126.6" y2="138.1" stroke="url(#jg)" strokeWidth="1.5"/>
                <line x1="83.1" y1="113.8" x2="65.4" y2="138.1" stroke="url(#jg)" strokeWidth="1.5"/>
                <line x1="75.1" y1="89.2" x2="46.5" y2="79.9" stroke="url(#jg)" strokeWidth="1.5"/>
                {/* Arestas externas do dado */}
                <line x1="96" y1="44" x2="145.5" y2="79.9" stroke="url(#jg)" strokeWidth="1" opacity="0.55"/>
                <line x1="145.5" y1="79.9" x2="126.6" y2="138.1" stroke="url(#jg)" strokeWidth="1" opacity="0.55"/>
                <line x1="126.6" y1="138.1" x2="96" y2="148" stroke="url(#jg)" strokeWidth="1" opacity="0.55"/>
                <line x1="96" y1="148" x2="65.4" y2="138.1" stroke="url(#jg)" strokeWidth="1" opacity="0.55"/>
                <line x1="65.4" y1="138.1" x2="46.5" y2="79.9" stroke="url(#jg)" strokeWidth="1" opacity="0.55"/>
                <line x1="46.5" y1="79.9" x2="96" y2="44" stroke="url(#jg)" strokeWidth="1" opacity="0.55"/>
                {/* Números */}
                <text x="96" y="68" textAnchor="middle" fill="#c8933a" fontSize="11" fontFamily="sans-serif" opacity="0.85">18</text>
                <text x="122" y="96" textAnchor="middle" fill="#c8933a" fontSize="10" fontFamily="sans-serif" opacity="0.7">7</text>
                <text x="112" y="132" textAnchor="middle" fill="#c8933a" fontSize="10" fontFamily="sans-serif" opacity="0.7">2</text>
                <text x="80" y="132" textAnchor="middle" fill="#c8933a" fontSize="10" fontFamily="sans-serif" opacity="0.7">8</text>
                <text x="70" y="96" textAnchor="middle" fill="#c8933a" fontSize="10" fontFamily="sans-serif" opacity="0.7">14</text>
                {/* 20 central */}
                <text x="96" y="105" textAnchor="middle" fill="#f0c84a" fontSize="20" fontFamily="sans-serif" fontWeight="bold">20</text>
              </svg>
            )}
          </div>

          {/* Texto VASTERIA + subtítulo */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: "clamp(36px, 6vw, 70px)", fontWeight: 700,
              letterSpacing: "0.06em",
              background: "linear-gradient(180deg, #f0c84a 0%, #c8933a 55%, #8a5e18 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1, marginBottom: 8,
            }}>VASTERIA</div>
            <div style={{
              fontFamily: "'IM Fell English', 'Georgia', serif",
              fontSize: "clamp(13px, 2vw, 20px)", fontStyle: "italic",
              background: "linear-gradient(180deg, #d4a030 0%, #8a5e18 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.05em",
            }}>{isDM ? "Mesa do Mestre" : "Mesa do Jogador"}</div>
          </div>

          {/* Diamante decorativo */}
          <div style={{ position: "absolute", right: 22, bottom: 18, color: "rgba(200,147,58,0.45)", fontSize: 18, zIndex: 1 }}>✦</div>
        </div>

        {/* ─── GRID DE AÇÕES ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { icon: "scroll", label: "Campanhas", desc: "Crie e gerencie suas mesas de jogo", action: () => setView("campaigns") },
            { icon: "shield", label: "Personagens", desc: "Fichas, atributos e habilidades", action: () => setView("character") },
            { icon: "book", label: "Compêndio", desc: "Magias, monstros, itens e regras", action: () => setView("compendium") },
          ].map((card) => (
            <button
              key={card.label}
              onClick={card.action}
              className="glass"
              style={{
                borderRadius: 16, padding: "24px 22px", textAlign: "left",
                border: "1px solid var(--t-border)", cursor: "pointer",
                transition: "border-color 180ms, transform 180ms",
                background: "rgba(255,245,220,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--t-border-strong)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--t-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Icon name={card.icon} size={22} style={{ color: "var(--t-accent)", marginBottom: 14, display: "block" }} />
              <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)", marginBottom: 6 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--t-text-mute)", lineHeight: 1.55 }}>
                {card.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ESTADO ATIVO — tem campanhas ───────────────────────────────────────────
  return (
    <div data-screen-label="Dashboard">
      {/* Hero da campanha ativa */}
      <div className="glass" style={{
        position: "relative", borderRadius: 22, padding: 32, marginBottom: 24, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: next.cover, opacity: 0.35, zIndex: 0 }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(10,7,15,0.9) 0%, rgba(10,7,15,0.4) 60%, transparent 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Pill color={next.status === "ativa" ? "#7ba85d" : "var(--t-accent-bright)"}>
                {next.status === "ativa" ? "● Em curso" : next.status || "campanha"}
              </Pill>
              <span className="mono" style={{ fontSize: 11, color: "var(--t-text-mute)" }}>
                {[next.system, next.level, next.sessions > 0 ? `${next.sessions}ª sessão` : null]
                  .filter(Boolean).join(" · ")}
              </span>
            </div>
            <h1 className="serif" style={{
              fontSize: 44, fontWeight: 600, margin: 0,
              color: "var(--t-text)", lineHeight: 1.05, letterSpacing: 0.3,
            }}>{next.name}</h1>
            {next.setting && (
              <div style={{ fontSize: 13, color: "rgba(232,227,214,0.6)", marginTop: 8, fontStyle: "italic" }}>
                {next.setting}
              </div>
            )}
            {next.summary && (
              <p style={{ fontSize: 14.5, color: "rgba(232,227,214,0.78)", lineHeight: 1.6, maxWidth: 540, marginTop: 18 }}>
                {next.summary}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <Btn icon="play" onClick={() => { setActiveCampaign(next); setView("campaigns"); }}>
                Continuar Sessão
              </Btn>
              <Btn variant="ghost" icon="feather" onClick={() => setView("notes")}>Anotações</Btn>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            {next.nextSession && (
              <div className="glass-strong" style={{ padding: 16, borderRadius: 14 }}>
                <div className="mono" style={{
                  fontSize: 10, letterSpacing: 1.4,
                  color: "rgba(218,180,120,0.6)", marginBottom: 8,
                }}>PRÓXIMA SESSÃO</div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)" }}>
                  {next.nextSession}
                </div>
                {next.progress > 0 && (
                  <>
                    <div style={{ marginTop: 14, height: 6, background: "rgba(0,0,0,0.4)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${next.progress * 100}%`, height: "100%",
                        background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-bright))", borderRadius: 3,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 8 }}>
                      {Math.round(next.progress * 100)}% concluído
                    </div>
                  </>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <div className="glass-strong" style={{ flex: 1, padding: 14, borderRadius: 14, textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 30, color: "var(--t-accent-bright)", fontWeight: 600, lineHeight: 1 }}>
                  {next.players || 0}
                </div>
                <div style={{ fontSize: 10, color: "var(--t-text-mute)", letterSpacing: 1, marginTop: 4 }}>JOGADORES</div>
              </div>
              <div className="glass-strong" style={{ flex: 1, padding: 14, borderRadius: 14, textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 30, color: "var(--t-accent-bright)", fontWeight: 600, lineHeight: 1 }}>
                  {Array.isArray(next.sessions) ? next.sessions.length : (next.sessions || 0)}
                </div>
                <div style={{ fontSize: 10, color: "var(--t-text-mute)", letterSpacing: 1, marginTop: 4 }}>SESSÕES</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade inferior */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22 }}>
        {/* Campanhas */}
        <div>
          <SectionTitle
            sub="Suas mesas em curso"
            action={
              <Btn variant="ghost" icon="plus" size="sm" onClick={() => setView("campaigns")}>
                Nova campanha
              </Btn>
            }
          >
            Campanhas
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CAMPAIGNS.map((c) => (
              <div
                key={c.id}
                onClick={() => { setActiveCampaign(c); setView("campaigns"); }}
                className="glass"
                style={{
                  borderRadius: 16, overflow: "hidden", cursor: "pointer",
                  transition: "transform 200ms",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ height: 90, background: c.cover, position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(180deg, transparent 30%, rgba(10,7,15,0.85))",
                  }} />
                  <div style={{ position: "absolute", top: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between" }}>
                    <Pill color={c.status === "ativa" ? "#7ba85d" : "#9d7bd8"}>{c.status}</Pill>
                    <span className="mono" style={{ fontSize: 9.5, color: "rgba(255,245,220,0.7)" }}>{c.level}</span>
                  </div>
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)", marginBottom: 4 }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginBottom: 10 }}>{c.setting}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10.5, color: "var(--t-text-mute)" }}>
                    <span><Icon name="users" size={11} style={{ verticalAlign: "-2px" }} /> {c.players}</span>
                    <span><Icon name="calendar" size={11} style={{ verticalAlign: "-2px" }} /> {Array.isArray(c.sessions) ? c.sessions.length : (c.sessions || 0)}</span>
                    <span style={{ marginLeft: "auto", color: "var(--t-accent-bright)" }} className="mono">
                      {Math.round((c.progress || 0) * 100)}%
                    </span>
                  </div>
                  <div style={{ marginTop: 8, height: 3, background: "rgba(0,0,0,0.4)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      width: `${(c.progress || 0) * 100}%`, height: "100%",
                      background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-bright))",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna lateral — só renderiza se houver dados */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {hasPlayers && (
            <div>
              <SectionTitle sub="Jogadores online">Mesa</SectionTitle>
              <div className="glass" style={{ borderRadius: 14, padding: 8 }}>
                {PLAYERS.slice(0, 5).map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                      borderBottom: i < Math.min(PLAYERS.length, 5) - 1
                        ? "1px dashed rgba(218,180,120,0.08)" : "none",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Avatar name={p.name} size={34} color={p.accent} />
                      <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 9, height: 9, borderRadius: "50%",
                        background: p.online === "online" ? "#7ba85d"
                          : p.online === "ausente" ? "var(--t-accent)" : "rgba(255,255,255,0.2)",
                        border: "1.5px solid var(--t-bg-base)",
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: "var(--t-text)",
                        textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                      }}>{p.name}</div>
                      <div style={{ fontSize: 10.5, color: "var(--t-text-mute)" }}>
                        {p.char} · Nv. {p.level}
                      </div>
                    </div>
                    <span className="mono" style={{
                      fontSize: 11,
                      color: p.hp && p.hp.split("/")[0] === p.hp.split("/")[1]
                        ? "#7ba85d" : "var(--t-accent-bright)",
                    }}>{p.hp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasActivity && (
            <div>
              <SectionTitle sub="Últimos eventos da mesa">Crônica</SectionTitle>
              <div className="glass" style={{ borderRadius: 14, padding: 12 }}>
                {ACTIVITY.slice(0, 5).map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex", gap: 10, padding: "8px 0",
                      borderBottom: i < Math.min(ACTIVITY.length, 5) - 1
                        ? "1px dashed var(--t-border)" : "none",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: `${a.color}1a`, border: `1px solid ${a.color}40`,
                      color: a.color, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon name={a.icon} size={13} />
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45 }}>
                      <div>
                        <span style={{ color: "var(--t-text)", fontWeight: 600 }}>{a.who}</span>{" "}
                        <span style={{ color: "var(--t-text-soft)" }}>{a.what}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 1 }}>
                        {a.when}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
