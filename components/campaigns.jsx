const Campaigns = ({ activeCampaign, setActiveCampaign }) => {
  const { CAMPAIGNS = [], PLAYERS = [] } = window.MOCK || {};
  const { Pill, Btn, SectionTitle, Avatar } = window.UI;
  const [view, setLocalView] = useState("grid");
  const c = activeCampaign || CAMPAIGNS[0] || {
    id: "",
    name: "Sem campanha selecionada",
    setting: "Nenhum dado de campanha disponível.",
    dm: "",
    status: "sem dados",
    tags: [],
    sessions: 0,
    players: 0,
    level: "",
    nextSession: "—",
    progress: 0,
    summary: "Importe ou crie uma campanha para visualizar o conteúdo.",
    cover: "linear-gradient(135deg, #111 0%, #222 100%)",
    accent: "var(--t-accent)",
  };
  const playersInCampaign = PLAYERS.slice(0, c.players || 0);
  const sessions = c.sessions || [];

  return (
    <div data-screen-label="Campanhas">
      {/* Active campaign hero */}
      <div className="glass" style={{ borderRadius: 22, padding: 32, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: c.cover, opacity: 0.4 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(10,7,15,0.92), rgba(10,7,15,0.4))" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28, marginBottom: 22 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Pill color={c.status === "ativa" ? "#7ba85d" : "#9d7bd8"}>{c.status === "ativa" ? "● em curso" : "pausada"}</Pill>
                {c.tags.map((t) => <Pill key={t} color="var(--t-accent)">{t}</Pill>)}
              </div>
              <h1 className="serif" style={{ fontSize: 48, fontWeight: 600, margin: 0, color: "var(--t-text)", lineHeight: 1, letterSpacing: 0.3 }}>{c.name}</h1>
              <div style={{ fontSize: 14, color: "rgba(232,227,214,0.6)", marginTop: 8, fontStyle: "italic" }}>{c.setting} · Mestrada por {c.dm}</div>
              <p style={{ fontSize: 15, color: "rgba(232,227,214,0.78)", lineHeight: 1.6, maxWidth: 640, marginTop: 16 }}>{c.summary}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <Btn icon="play" size="lg">Iniciar Sessão {c.sessions + 1}</Btn>
              <Btn variant="ghost" icon="map" size="sm">Mapa do mundo</Btn>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { l: "Sessões", v: c.sessions, i: "calendar" },
              { l: "Nível médio", v: c.level.replace("Nível ", ""), i: "crown" },
              { l: "Jogadores", v: c.players, i: "users" },
              { l: "Próxima", v: c.nextSession === "—" ? "—" : c.nextSession.split("•")[0].trim(), i: "moon" },
              { l: "Progresso", v: `${Math.round(c.progress * 100)}%`, i: "target" },
            ].map((s) => (
              <div key={s.l} className="glass-strong" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: c.accent }}>
                  <Icon name={s.i} size={13} />
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-mute)" }}>{s.l.toUpperCase()}</span>
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22 }}>
        <div>
          <SectionTitle sub="Histórico de sessões — clique para ler o resumo" action={<Btn variant="ghost" icon="plus" size="sm">Nova sessão</Btn>}>
            Crônicas da Campanha
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.length === 0 ? (
              <div className="glass" style={{ borderRadius: 14, padding: 28, textAlign: "center", color: "var(--t-text-mute)", fontSize: 14 }}>
                Nenhuma sessão registrada. Adicione a primeira sessão para ver o histórico aqui.
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.n} className="glass" style={{ borderRadius: 14, padding: 18, display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 18, alignItems: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: "linear-gradient(135deg, var(--t-accent-tint), rgba(218,162,90,0.04))",
                    border: "1px solid var(--t-border-strong)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: 1, color: "rgba(218,180,120,0.6)" }}>SES.</div>
                    <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-accent-bright)", lineHeight: 1 }}>{s.n}</div>
                  </div>
                  <div>
                    <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--t-text)", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(232,227,214,0.65)", lineHeight: 1.55 }}>{s.recap}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{s.date}</span>
                    <button style={{ padding: "5px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--t-border-strong)", color: "rgba(232,227,214,0.7)", fontSize: 11 }}>Abrir</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Campaign switcher */}
          <SectionTitle sub="Trocar de mesa">Outras Campanhas</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CAMPAIGNS.filter((x) => x.id !== c.id).map((cc) => (
              <div key={cc.id} onClick={() => setActiveCampaign(cc)} className="glass" style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ height: 60, background: cc.cover, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(10,7,15,0.7))" }} />
                </div>
                <div style={{ padding: 14 }}>
                  <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)" }}>{cc.name}</div>
                  <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>{cc.level} · {cc.players} jogadores</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <SectionTitle sub="Personagens da mesa">O Grupo</SectionTitle>
            <div className="glass" style={{ borderRadius: 14, padding: 12 }}>
              {playersInCampaign.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: i === playersInCampaign.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)" }}>
                  <Avatar name={p.name} size={38} color={p.accent} />
                  <div style={{ flex: 1 }}>
                    <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: "var(--t-text)" }}>{p.char}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{p.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 11, color: p.hp.split("/")[0] === p.hp.split("/")[1] ? "#7ba85d" : "var(--t-accent-bright)" }}>{p.hp}</div>
                    <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>Nv. {p.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle sub="Cenas, NPCs e ganchos preparados">Caderno do Mestre</SectionTitle>
            <div className="glass" style={{ borderRadius: 14, padding: 28, textAlign: "center", color: "var(--t-text-mute)", fontSize: 14 }}>
              Nenhuma informação de mestre disponível. Use notas e estatísticas de campanha para começar a documentar NPCs, locais e ganchos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Campaigns = Campaigns;
