// ── banner resize helper ──────────────────────────────────────────────────────
function _resizeBanner(file, maxW = 1200, maxH = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ev => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const CreateCampaignModal = ({ onClose, onSave }) => {
  const systems = ["D&D 5E", "Pathfinder 2E", "Call of Cthulhu", "Savage Worlds", "Outro"];
  const coverOptions = [
    "linear-gradient(135deg, rgba(157,123,216,0.45), rgba(218,162,90,0.15))",
    "linear-gradient(135deg, rgba(218,162,90,0.4), rgba(100,60,20,0.35))",
    "linear-gradient(135deg, rgba(107,158,93,0.4), rgba(30,70,50,0.35))",
    "linear-gradient(135deg, rgba(200,80,90,0.35), rgba(60,10,20,0.5))",
    "linear-gradient(135deg, rgba(72,154,185,0.35), rgba(20,50,90,0.45))",
  ];
  const [form, setForm] = React.useState({
    name: "", system: "D&D 5E", setting: "", summary: "", status: "ativa", cover: coverOptions[0], bannerImg: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [dragging, setDragging] = React.useState(false);
  const [bannerHover, setBannerHover] = React.useState(false);
  const [bannerLoading, setBannerLoading] = React.useState(false);
  const bannerRef = React.useRef();

  const handleBannerFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBannerLoading(true);
    try {
      const data = await _resizeBanner(file);
      set("bannerImg", data);
    } finally { setBannerLoading(false); }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const res = window.AppData?.createCampaign(form.name.trim(), form);
    if (!res || !res.ok) { alert(res?.msg || "Erro ao criar campanha."); return; }
    onSave(res.campaign);
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-strong" style={{ width: 520, borderRadius: 22, padding: 32, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)" }}>Nova Campanha</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 6 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Banner upload zone */}
        <input ref={bannerRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerFile(f); e.target.value = ""; }} />
        <div
          onClick={() => bannerRef.current?.click()}
          onMouseEnter={() => setBannerHover(true)}
          onMouseLeave={() => setBannerHover(false)}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleBannerFile(f); }}
          style={{
            height: 110, borderRadius: 14, marginBottom: 10, cursor: "pointer",
            position: "relative", overflow: "hidden",
            background: form.bannerImg ? `url(${form.bannerImg}) center/cover no-repeat` : form.cover,
            border: dragging ? "1.5px dashed var(--t-accent-bright)" : "1px solid var(--t-border)",
            transition: "border-color 150ms",
          }}
        >
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(8,5,18,0.72) 100%)" }} />

          {/* Campaign name */}
          {form.name && (
            <div className="serif" style={{ position: "absolute", bottom: 10, left: 14, fontSize: 16, color: "rgba(255,255,255,0.9)", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
              {form.name}
            </div>
          )}

          {/* Hover / drag overlay */}
          {!bannerLoading && (bannerHover || dragging) && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
              background: dragging ? "rgba(218,162,90,0.12)" : "rgba(0,0,0,0.35)",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(218,180,120,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="upload" size={16} style={{ color: "var(--t-accent-bright)" }} />
              </div>
              <span style={{ fontSize: 11.5, color: "rgba(218,180,120,0.85)", fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                {form.bannerImg ? "Trocar banner" : dragging ? "Solte aqui" : "Adicionar banner"}
              </span>
              <span style={{ fontSize: 10, color: "rgba(218,180,120,0.45)" }}>PNG · JPG · WEBP</span>
            </div>
          )}
          {bannerLoading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--t-accent-bright)" }}>processando…</span>
            </div>
          )}

          {/* "add banner" hint when empty and no hover */}
          {!form.bannerImg && (
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <div style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(218,180,120,0.25)", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="upload" size={11} style={{ color: "rgba(218,180,120,0.6)" }} />
                <span className="mono" style={{ fontSize: 9.5, color: "rgba(218,180,120,0.6)", letterSpacing: 0.5 }}>Banner</span>
              </div>
            </div>
          )}
          {form.bannerImg && (
            <button
              onClick={e => { e.stopPropagation(); set("bannerImg", ""); }}
              style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 7, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(232,227,214,0.7)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Remover banner"
            >✕</button>
          )}
        </div>

        {/* Gradient swatches */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {coverOptions.map((c, i) => (
            <button key={i} onClick={() => set("cover", c)} style={{
              width: 32, height: 32, borderRadius: 7, background: c, cursor: "pointer", flexShrink: 0,
              border: form.cover === c && !form.bannerImg ? "2px solid var(--t-accent-bright)" : "2px solid rgba(255,255,255,0.1)",
            }} />
          ))}
          <span style={{ alignSelf: "center", fontSize: 10.5, color: "var(--t-text-faint)", marginLeft: 2 }}>cor de fundo</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>NOME DA CAMPANHA *</div>
          <input
            value={form.name}
            onChange={e => set("name", e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="A Coroa do Crepúsculo..."
            autoFocus
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>SISTEMA</div>
            <select value={form.system} onChange={e => set("system", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
              {systems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>STATUS</div>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
              <option value="ativa">Ativa</option>
              <option value="pausada">Pausada</option>
              <option value="planejando">Planejando</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CENÁRIO</div>
          <input value={form.setting} onChange={e => set("setting", e.target.value)} placeholder="Mundo de Vasteria, Era dos Dragões..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>DESCRIÇÃO</div>
          <textarea value={form.summary} onChange={e => set("summary", e.target.value)} placeholder="Uma linha sobre a premissa da campanha..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text-soft)", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 10,
              background: form.name.trim() ? "var(--t-accent)" : "rgba(218,162,90,0.15)",
              border: "none", color: form.name.trim() ? "#1a0e04" : "var(--t-text-mute)",
              fontSize: 14, fontWeight: 700, cursor: form.name.trim() ? "pointer" : "default",
            }}
          >
            Criar campanha
          </button>
          <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 14, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const Campaigns = ({ activeCampaign, setActiveCampaign }) => {
  const { CAMPAIGNS = [], PLAYERS = [] } = useAppMock();
  const { Pill, Btn, SectionTitle, Avatar } = window.UI;
  const [showCreate, setShowCreate] = useState(false);

  const handleCreated = (campaign) => {
    setActiveCampaign(campaign);
  };

  // Empty state
  if (CAMPAIGNS.length === 0 && !activeCampaign) {
    return (
      <div data-screen-label="Campanhas">
        {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onSave={handleCreated} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Campanhas</h1>
            <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>Suas mesas e crônicas</div>
          </div>
        </div>
        <div className="glass" style={{ borderRadius: 22, padding: "72px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 500px 350px at 50% 50%, rgba(218,162,90,0.05), transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 24px", background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px -10px var(--t-accent-tint)", animation: "float-soft 6s ease-in-out infinite" }}>
              <Icon name="scroll" size={38} style={{ color: "var(--t-accent)", opacity: 0.8 }} />
            </div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--t-text)", marginBottom: 12 }}>Nenhuma campanha criada ainda</div>
            <p style={{ fontSize: 15, color: "var(--t-text-mute)", lineHeight: 1.65, maxWidth: 440, margin: "0 auto 32px" }}>
              Quando uma nova aventura nascer, ela aparecerá aqui. Crie sua primeira campanha para começar.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn icon="plus" onClick={() => setShowCreate(true)}>Criar campanha</Btn>
              <Btn variant="ghost" icon="upload">Importar módulo</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const c = activeCampaign || CAMPAIGNS[0];
  const sessions = Array.isArray(c.sessions) ? c.sessions : [];
  const sessionCount = sessions.length;
  const playersInCampaign = PLAYERS.slice(0, c.players || 0);
  const campaignTags = c.tags || [];
  const campaignAccent = c.accent || "var(--t-accent)";
  const levelLabel = typeof c.level === "string" ? c.level.replace("Nível ", "") : (c.level || "—");

  return (
    <div data-screen-label="Campanhas">
      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onSave={handleCreated} />}

      {/* Active campaign hero */}
      <div className="glass" style={{ borderRadius: 22, padding: 32, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: c.cover, opacity: 0.4 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(10,7,15,0.92), rgba(10,7,15,0.4))" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28, marginBottom: 22 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Pill color={c.status === "ativa" ? "#7ba85d" : "#9d7bd8"}>{c.status === "ativa" ? "● em curso" : (c.status || "pausada")}</Pill>
                {campaignTags.map(t => <Pill key={t} color={campaignAccent}>{t}</Pill>)}
              </div>
              <h1 className="serif" style={{ fontSize: 48, fontWeight: 600, margin: 0, color: "var(--t-text)", lineHeight: 1, letterSpacing: 0.3 }}>{c.name}</h1>
              <div style={{ fontSize: 14, color: "rgba(232,227,214,0.6)", marginTop: 8, fontStyle: "italic" }}>
                {[c.setting, c.dm && `Mestrada por ${c.dm}`].filter(Boolean).join(" · ")}
              </div>
              {c.summary && (
                <p style={{ fontSize: 15, color: "rgba(232,227,214,0.78)", lineHeight: 1.6, maxWidth: 640, marginTop: 16 }}>{c.summary}</p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <Btn icon="play" size="lg">Iniciar Sessão {sessionCount + 1}</Btn>
              <Btn variant="ghost" icon="map" size="sm">Mapa do mundo</Btn>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { l: "Sessões", v: sessionCount, i: "calendar" },
              { l: "Nível médio", v: levelLabel || "—", i: "crown" },
              { l: "Jogadores", v: c.players || 0, i: "users" },
              { l: "Próxima", v: c.nextSession || "—", i: "moon" },
              { l: "Progresso", v: `${Math.round((c.progress || 0) * 100)}%`, i: "target" },
            ].map(s => (
              <div key={s.l} className="glass-strong" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: campaignAccent }}>
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
          <SectionTitle sub="Histórico de sessões" action={<Btn variant="ghost" icon="plus" size="sm" onClick={() => setShowCreate(true)}>Nova campanha</Btn>}>
            Crônicas da Campanha
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.length === 0 ? (
              <div className="glass" style={{ borderRadius: 14, padding: 28, textAlign: "center", color: "var(--t-text-mute)", fontSize: 14 }}>
                Nenhuma sessão registrada. Inicie a primeira sessão para começar o histórico.
              </div>
            ) : (
              sessions.map(s => (
                <div key={s.n} className="glass" style={{ borderRadius: 14, padding: 18, display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 18, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, var(--t-accent-tint), rgba(218,162,90,0.04))", border: "1px solid var(--t-border-strong)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
          {CAMPAIGNS.filter(x => x.id !== c.id).length > 0 && (
            <>
              <SectionTitle sub="Trocar de mesa">Outras Campanhas</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {CAMPAIGNS.filter(x => x.id !== c.id).map(cc => (
                  <div key={cc.id} onClick={() => setActiveCampaign(cc)} className="glass" style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "transform 200ms" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                    <div style={{ height: 60, background: cc.cover || "var(--t-accent-soft)", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(10,7,15,0.7))" }} />
                    </div>
                    <div style={{ padding: 14 }}>
                      <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)" }}>{cc.name}</div>
                      <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>
                        {cc.level || "Nível 1"} · {cc.players || 0} jogador{cc.players !== 1 ? "es" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {playersInCampaign.length > 0 && (
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
                      <div className="mono" style={{ fontSize: 11, color: "var(--t-accent-bright)" }}>{p.hp}</div>
                      <div style={{ fontSize: 10, color: "var(--t-text-faint)" }}>Nv. {p.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {playersInCampaign.length === 0 && (
            <div>
              <SectionTitle sub="Personagens da mesa">O Grupo</SectionTitle>
              <div className="glass" style={{ borderRadius: 14, padding: 24, textAlign: "center" }}>
                <Icon name="users" size={24} style={{ color: "var(--t-text-faint)", marginBottom: 10, display: "block" }} />
                <div style={{ fontSize: 13, color: "var(--t-text-mute)", lineHeight: 1.55 }}>
                  Nenhum jogador na campanha ainda.
                </div>
              </div>
            </div>
          )}

          <div>
            <SectionTitle sub="Cenas, NPCs e ganchos preparados">Caderno do Mestre</SectionTitle>
            <div className="glass" style={{ borderRadius: 14, padding: 24, textAlign: "center" }}>
              <Icon name="feather" size={24} style={{ color: "var(--t-text-faint)", marginBottom: 10, display: "block" }} />
              <div style={{ fontSize: 13, color: "var(--t-text-mute)", lineHeight: 1.55 }}>
                Use a seção de Anotações para documentar NPCs, locais e segredos desta campanha.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Campaigns = Campaigns;
