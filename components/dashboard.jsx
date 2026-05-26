const Dashboard = ({ setView, setActiveCampaign, role = "mestre" }) => {
  const isDM = role === "mestre";
  const { CAMPAIGNS = [], ACTIVITY = [], PLAYERS = [], CHARACTER = {} } = window.MOCK || {};
  const { Pill, Btn, StatBlock, RuneDivider, Avatar, SectionTitle } = window.UI;
  const next = CAMPAIGNS[0] || {
    cover: "linear-gradient(135deg, #111 0%, #222 100%)",
    system: "",
    level: "",
    sessions: 0,
    name: "Nenhuma campanha ativa",
    setting: "Ainda não há campanhas carregadas.",
    summary: "Importe ou crie uma campanha para visualizar o dashboard.",
    nextSession: "—",
    progress: 0,
    players: 0,
    accent: "var(--t-accent)",
    status: "sem dados",
  };

  return (
    <div data-screen-label="Dashboard">
      {/* Hero — Active campaign */}
      <div className="glass" style={{
        position: "relative", borderRadius: 22, padding: 32, marginBottom: 24,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: next.cover, opacity: 0.35, zIndex: 0,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,7,15,0.9) 0%, rgba(10,7,15,0.4) 60%, transparent 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Pill color="var(--t-accent-bright)">● Sessão ativa</Pill>
              <span className="mono" style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{next.system} · {next.level} · {next.sessions}ª sessão</span>
            </div>
            <h1 className="serif" style={{ fontSize: 44, fontWeight: 600, margin: 0, color: "var(--t-text)", lineHeight: 1.05, letterSpacing: 0.3 }}>{next.name}</h1>
            <div style={{ fontSize: 13, color: "rgba(232,227,214,0.6)", marginTop: 8, fontStyle: "italic" }}>{next.setting}</div>
            <p style={{ fontSize: 14.5, color: "rgba(232,227,214,0.78)", lineHeight: 1.6, maxWidth: 540, marginTop: 18 }}>{next.summary}</p>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <Btn icon="play" onClick={() => { setActiveCampaign(next); setView("campaigns"); }}>Continuar Sessão</Btn>
              <Btn variant="ghost" icon="map">Abrir mapa</Btn>
              <Btn variant="ghost" icon="feather">Anotações da sessão</Btn>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <div className="glass-strong" style={{ padding: 16, borderRadius: 14 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: 1.4, color: "rgba(218,180,120,0.6)", marginBottom: 8 }}>PRÓXIMA SESSÃO</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)" }}>{next.nextSession}</div>
              <div style={{ marginTop: 14, height: 6, background: "rgba(0,0,0,0.4)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${next.progress * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--t-accent), var(--t-accent-bright))", borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 8 }}>{Math.round(next.progress * 100)}% da campanha · arco 2 de 3</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="glass-strong" style={{ flex: 1, padding: 14, borderRadius: 14, textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 30, color: "var(--t-accent-bright)", fontWeight: 600, lineHeight: 1 }}>{next.players}</div>
                <div style={{ fontSize: 10, color: "var(--t-text-mute)", letterSpacing: 1, marginTop: 4 }}>JOGADORES</div>
              </div>
              <div className="glass-strong" style={{ flex: 1, padding: 14, borderRadius: 14, textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 30, color: "var(--t-accent-bright)", fontWeight: 600, lineHeight: 1 }}>{next.sessions}</div>
                <div style={{ fontSize: 10, color: "var(--t-text-mute)", letterSpacing: 1, marginTop: 4 }}>SESSÕES</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {isDM ? (
          <>
            <StatBlock
              label="Campanhas ativas"
              value={CAMPAIGNS.length.toString()}
              sub={CAMPAIGNS.length === 0 ? "nenhuma campanha" : `${CAMPAIGNS.length} no total`}
              accent="var(--t-accent)"
            />
            <StatBlock
              label="Jogadores"
              value={PLAYERS.length.toString()}
              sub={PLAYERS.length === 0 ? "nenhum jogador" : `${PLAYERS.length} jogadores`}
              accent="#7ba85d"
            />
            <StatBlock
              label="Fichas criadas"
              value={CHARACTER.name ? "1" : "0"}
              sub={CHARACTER.name ? "uma ficha cadastrada" : "nenhuma ficha"}
              accent="#9d7bd8"
            />
            <StatBlock
              label="Próximas sessões"
              value="—"
              sub="sem agendamento"
              accent="#6da5c8"
            />
          </>
        ) : (
          <>
            <StatBlock
              label="Personagem"
              value={CHARACTER.name || "Nenhum personagem"}
              sub={CHARACTER.name ? `${CHARACTER.class || ""} · Nv. ${CHARACTER.level || 0}` : "sem ficha"}
              accent="var(--t-accent)"
            />
            <StatBlock
              label="PV atuais"
              value={CHARACTER.hp ? `${CHARACTER.hp}/${CHARACTER.hpMax}` : "0/0"}
              sub={CHARACTER.hp ? "status" : "sem dados"}
              accent="#c25555"
            />
            <StatBlock
              label="Mesas"
              value={CAMPAIGNS.length.toString()}
              sub={CAMPAIGNS.length === 0 ? "nenhuma mesa" : `${CAMPAIGNS.length} em curso`}
              accent="#9d7bd8"
            />
            <StatBlock
              label="Próxima sessão"
              value="—"
              sub="sem sessão marcada"
              accent="#6da5c8"
            />
          </>
        )}
      </div>

      {/* Two-column lower section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22 }}>
        {/* Campaigns grid */}
        <div>
          <SectionTitle sub="Suas mesas em curso" action={<Btn variant="ghost" icon="plus" size="sm">Nova campanha</Btn>}>
            Campanhas
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CAMPAIGNS.map((c) => (
              <div key={c.id} className="glass" style={{
                position: "relative", borderRadius: 16, overflow: "hidden",
                cursor: "pointer", transition: "transform 200ms",
              }}
                onClick={() => { setActiveCampaign(c); setView("campaigns"); }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ height: 90, background: c.cover, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,7,15,0.9))" }} />
                  <div style={{ position: "absolute", top: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between" }}>
                    <Pill color={c.status === "ativa" ? "#7ba85d" : "#9d7bd8"}>{c.status}</Pill>
                    <span className="mono" style={{ fontSize: 10, color: "rgba(255,245,220,0.7)" }}>{c.level}</span>
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginBottom: 12 }}>{c.setting}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(232,227,214,0.6)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="users" size={12} /><span>{c.players}</span>
                      <span style={{ width: 3, height: 3, background: "rgba(232,227,214,0.3)", borderRadius: "50%", margin: "0 4px" }} />
                      <Icon name="calendar" size={12} /><span>{c.sessions}</span>
                    </div>
                    <span className="mono gold" style={{ fontSize: 10 }}>{Math.round(c.progress * 100)}%</span>
                  </div>
                  <div style={{ marginTop: 8, height: 3, background: "rgba(0,0,0,0.3)", borderRadius: 2 }}>
                    <div style={{ width: `${c.progress * 100}%`, height: "100%", background: c.accent, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
            {/* New campaign card */}
            <div className="glass-soft" style={{
              borderRadius: 16, padding: 24, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              border: "1px dashed var(--t-border-strong)", cursor: "pointer", minHeight: 200,
              transition: "all 200ms",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(218,180,120,0.5)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--t-border-strong)"}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="plus" size={20} className="gold" />
              </div>
              <div className="serif" style={{ fontSize: 16, color: "var(--t-text)" }}>Nova campanha</div>
              <div style={{ fontSize: 11, color: "var(--t-text-mute)", textAlign: "center" }}>Comece uma aventura do zero ou a partir de um módulo.</div>
            </div>
          </div>
        </div>

        {/* Side rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Players online */}
          <div>
            <SectionTitle sub="Jogadores online">Mesa</SectionTitle>
            <div className="glass" style={{ borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {PLAYERS.length === 0 ? (
                <div style={{ color: "var(--t-text-mute)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                  Nenhum jogador disponível. Dados reais aparecerão aqui quando houver jogadores cadastrados.
                </div>
              ) : PLAYERS.slice(0, 5).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={p.name} size={34} color={p.accent} />
                    <span style={{
                      position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%",
                      background: p.status === "online" ? "#7ba85d" : p.status === "ausente" ? "var(--t-accent-bright)" : "#54545c",
                      border: "2px solid #181226",
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t-text)" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{p.char} · Nv. {p.level}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{p.hp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <SectionTitle sub="Últimos eventos da mesa">Crônica</SectionTitle>
            <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
              {ACTIVITY.length === 0 ? (
                <div style={{ color: "var(--t-text-mute)", fontSize: 13, textAlign: "center", padding: "28px 0" }}>
                  Nenhuma atividade registrada. Eventos recentes aparecerão aqui quando houver histórico.
                </div>
              ) : ACTIVITY.map((a, i) => (
                <div key={a.id} style={{
                  display: "flex", gap: 12, paddingBottom: i === ACTIVITY.length - 1 ? 0 : 14,
                  marginBottom: i === ACTIVITY.length - 1 ? 0 : 14,
                  borderBottom: i === ACTIVITY.length - 1 ? "none" : "1px dashed var(--t-border)",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${a.color}1a`, border: `1px solid ${a.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: a.color,
                  }}>
                    <Icon name={a.icon} size={15} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5 }}>
                    <div><span style={{ color: "var(--t-text)", fontWeight: 600 }}>{a.who}</span> <span style={{ color: "rgba(232,227,214,0.7)" }}>{a.what}</span></div>
                    <div style={{ fontSize: 10.5, color: "var(--t-text-faint)", marginTop: 2 }} className="mono">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
