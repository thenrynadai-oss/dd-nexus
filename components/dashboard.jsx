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
        {/* Hero de boas-vindas */}
        <div className="glass" style={{
          borderRadius: 22, padding: "88px 40px 80px",
          textAlign: "center", position: "relative", overflow: "hidden",
          minHeight: 440,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 700px 500px at 50% 40%, rgba(218,162,90,0.07), transparent 70%)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20, margin: "0 auto 28px",
              background: "linear-gradient(135deg, var(--t-accent-tint), var(--t-accent-soft))",
              border: "1px solid var(--t-border-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px -10px var(--t-accent-glow)",
              animation: "float-soft 6s ease-in-out infinite",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="var(--t-accent-bright)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" />
                <path d="M12 8 L12 16 M8 10 L16 14 M16 10 L8 14" />
              </svg>
            </div>

            <h1 className="serif" style={{
              fontSize: 42, fontWeight: 600, color: "var(--t-text)",
              margin: "0 0 16px", lineHeight: 1.1,
            }}>
              Bem-vindo ao Vasteria
            </h1>

            <p style={{
              fontSize: 16, color: "var(--t-text-mute)", lineHeight: 1.7,
              maxWidth: 460, margin: "0 auto 36px",
            }}>
              Sua mesa de RPG digital está pronta.<br />
              Comece criando sua primeira campanha ou personagem.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn icon="plus" onClick={() => setView("campaigns")}>Nova campanha</Btn>
              <Btn variant="ghost" icon="shield" onClick={() => setView("character")}>Criar personagem</Btn>
              <Btn variant="ghost" icon="book" onClick={() => setView("compendium")}>Explorar compêndio</Btn>
            </div>
          </div>
        </div>

        {/* 3 cards de acesso rápido */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 20 }}>
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
