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

// ── session helpers ───────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { id: "combat",      emoji: "⚔",  label: "Combate",    color: "#c25555" },
  { id: "exploration", emoji: "🗺", label: "Exploração", color: "#7ba85d" },
  { id: "roleplay",    emoji: "🎭", label: "Roleplay",   color: "#9d7bd8" },
  { id: "interlude",   emoji: "🏰", label: "Interlúdio", color: "#5b87c4" },
  { id: "climax",      emoji: "🌊", label: "Clímax",     color: "#c8933a" },
];

function _addSession(campaignId, session) {
  const current = window.AppData?.load?.();
  if (!current) return null;
  const updated = (current.CAMPAIGNS || []).map(c =>
    c.id === campaignId
      ? { ...c, sessions: [...(Array.isArray(c.sessions) ? c.sessions : []), session] }
      : c
  );
  window.AppData?.update?.("campaigns", updated);
  window.AppData?.refresh?.();
  return updated.find(c => c.id === campaignId) || null;
}

// ── NewSessionModal ───────────────────────────────────────────────────────────
const NewSessionModal = ({ campaign, onClose, onSaved }) => {
  const nextN = (Array.isArray(campaign.sessions) ? campaign.sessions.length : 0) + 1;
  const today = new Date().toLocaleDateString("pt-BR");
  const [form, setForm] = React.useState({
    title: `Sessão ${nextN}`, date: today, type: "exploration",
    recap: "", highlights: "", xp: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.recap.trim() && !form.title.trim()) return;
    const session = {
      id: `s_${Date.now()}`,
      n: nextN,
      title: form.title.trim() || `Sessão ${nextN}`,
      date: form.date,
      type: form.type,
      recap: form.recap.trim(),
      highlights: form.highlights.trim(),
      xp: parseInt(form.xp) || 0,
    };
    const updated = _addSession(campaign.id, session);
    if (updated) onSaved(updated);
    onClose();
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-strong" style={{ width: 580, borderRadius: 24, padding: "32px 36px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.1 }}>Nova Sessão</div>
            <div className="mono" style={{ fontSize: 10, color: "rgba(218,180,120,0.5)", marginTop: 4, letterSpacing: 0.8 }}>
              {campaign.name} · #{nextN}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-mute)", cursor: "pointer", padding: 6 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Title + date row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 18 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>TÍTULO DA SESSÃO</div>
            <input value={form.title} onChange={e => set("title", e.target.value)} autoFocus style={inp} placeholder={`Sessão ${nextN}`} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>DATA</div>
            <input value={form.date} onChange={e => set("date", e.target.value)} style={inp} placeholder="dd/mm/aaaa" />
          </div>
        </div>

        {/* Session type */}
        <div style={{ marginBottom: 20 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 8 }}>TIPO DE SESSÃO</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SESSION_TYPES.map(t => (
              <button key={t.id} onClick={() => set("type", t.id)} style={{
                padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                background: form.type === t.id ? `${t.color}22` : "rgba(0,0,0,0.3)",
                border: `1px solid ${form.type === t.id ? t.color + "88" : "var(--t-border)"}`,
                color: form.type === t.id ? t.color : "var(--t-text-mute)",
                transition: "all 160ms", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recap */}
        <div style={{ marginBottom: 16 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>O QUE ROLOU — RESUMO *</div>
          <textarea value={form.recap} onChange={e => set("recap", e.target.value)} rows={5}
            placeholder="Narre o que aconteceu nesta sessão — batalhas, revelações, decisões importantes, NPCs encontrados..."
            style={{ ...inp, resize: "vertical", lineHeight: 1.65, fontFamily: "inherit" }} />
        </div>

        {/* Highlights */}
        <div style={{ marginBottom: 16 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>
            DESTAQUES <span style={{ color: "var(--t-text-faint)" }}>· opcional</span>
          </div>
          <textarea value={form.highlights} onChange={e => set("highlights", e.target.value)} rows={2}
            placeholder="Momentos épicos, mortes, traições, segredos revelados..."
            style={{ ...inp, resize: "vertical", lineHeight: 1.65, fontFamily: "inherit" }} />
        </div>

        {/* XP */}
        <div style={{ marginBottom: 28 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>
            XP GANHO <span style={{ color: "var(--t-text-faint)" }}>· opcional</span>
          </div>
          <input type="number" min="0" value={form.xp} onChange={e => set("xp", e.target.value)}
            placeholder="0" style={{ ...inp, width: 120 }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={!form.recap.trim()}
            style={{ flex: 1, padding: "13px 0", borderRadius: 11,
              background: form.recap.trim() ? "var(--t-accent)" : "rgba(218,162,90,0.12)",
              border: "none", color: form.recap.trim() ? "#1a0e04" : "var(--t-text-mute)",
              fontSize: 14, fontWeight: 700, cursor: form.recap.trim() ? "pointer" : "default" }}>
            Registrar Sessão
          </button>
          <button onClick={onClose} style={{ padding: "13px 22px", borderRadius: 11, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 14, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SessionCard ───────────────────────────────────────────────────────────────
const SessionCard = ({ session, isLast }) => {
  const [expanded, setExpanded] = React.useState(false);
  const sType = SESSION_TYPES.find(t => t.id === session.type) || SESSION_TYPES[1];
  const hasHighlights = !!session.highlights;
  const hasXP = session.xp > 0;

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }}>
      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 52, paddingTop: 4 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, var(--t-accent-tint), rgba(218,162,90,0.04))",
          border: "1px solid var(--t-border-strong)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px -6px var(--t-accent-glow)",
        }}>
          <div className="mono" style={{ fontSize: 7.5, letterSpacing: 0.8, color: "rgba(218,180,120,0.5)" }}>S</div>
          <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: "var(--t-accent-bright)", lineHeight: 1 }}>{session.n}</div>
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 16, background: "linear-gradient(to bottom, var(--t-border-strong), transparent)", marginTop: 6 }} />}
      </div>

      {/* Card body */}
      <div className="glass" style={{ flex: 1, borderRadius: 14, marginLeft: 12, marginBottom: isLast ? 0 : 10, overflow: "hidden",
        border: "1px solid var(--t-border)", transition: "border-color 160ms" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--t-border-strong)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--t-border)"}
      >
        <div style={{ padding: "14px 18px" }}>
          {/* Row 1: title + meta */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.2 }}>
              {session.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              {hasXP && (
                <div className="mono" style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 10, background: "rgba(218,162,90,0.12)", border: "1px solid rgba(218,162,90,0.3)", color: "var(--t-accent-bright)", letterSpacing: 0.5 }}>
                  +{session.xp} XP
                </div>
              )}
              <div style={{ padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: `${sType.color}18`, border: `1px solid ${sType.color}50`, color: sType.color }}>
                {sType.emoji} {sType.label}
              </div>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--t-text-faint)" }}>{session.date}</span>
            </div>
          </div>

          {/* Recap preview */}
          <div style={{ fontSize: 13, color: "rgba(232,227,214,0.65)", lineHeight: 1.65,
            display: expanded ? "block" : "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2,
            WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden" }}>
            {session.recap}
          </div>

          {/* Expanded content */}
          {expanded && hasHighlights && (
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10,
              background: "rgba(157,123,216,0.06)", border: "1px solid rgba(157,123,216,0.15)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: 1.4, color: "rgba(157,123,216,0.6)", marginBottom: 6 }}>DESTAQUES</div>
              <div style={{ fontSize: 12.5, color: "rgba(232,227,214,0.6)", lineHeight: 1.6 }}>{session.highlights}</div>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {(session.recap.length > 120 || hasHighlights) && (
          <button onClick={() => setExpanded(e => !e)} style={{
            width: "100%", padding: "8px 18px", borderTop: "1px dashed rgba(218,180,120,0.08)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--t-text-faint)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            transition: "color 140ms",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--t-accent-bright)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--t-text-faint)"}
          >
            <Icon name="chevron" size={11} style={{ transform: expanded ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 200ms" }} />
            {expanded ? "Recolher" : "Ver completo"}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Campaigns ─────────────────────────────────────────────────────────────────
const Campaigns = ({ activeCampaign, setActiveCampaign }) => {
  const { CAMPAIGNS = [], PLAYERS = [] } = useAppMock();
  const { Pill, Btn, SectionTitle, Avatar } = window.UI;
  const [showCreate, setShowCreate] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

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

  const liveSessions = (() => {
    const cur = window.AppData?.load?.();
    const found = (cur?.CAMPAIGNS || []).find(x => x.id === c?.id);
    return Array.isArray(found?.sessions) ? found.sessions : sessions;
  })();

  return (
    <div data-screen-label="Campanhas">
      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onSave={handleCreated} />}
      {showSessionModal && <NewSessionModal campaign={{ ...c, sessions: liveSessions }} onClose={() => setShowSessionModal(false)} onSaved={updated => setActiveCampaign(updated)} />}

      {/* Active campaign hero */}
      <div className="glass" style={{ borderRadius: 22, padding: 32, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: c.bannerImg ? `url(${c.bannerImg}) center/cover no-repeat` : c.cover, opacity: 0.45 }} />
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
              <Btn icon="play" size="lg" onClick={() => setShowSessionModal(true)}>Registrar Sessão {liveSessions.length + 1}</Btn>
              <Btn variant="ghost" icon="map" size="sm">Mapa do mundo</Btn>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { l: "Sessões", v: liveSessions.length, i: "calendar" },
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
          <SectionTitle sub={`${liveSessions.length} sessão${liveSessions.length !== 1 ? "s" : ""} registrada${liveSessions.length !== 1 ? "s" : ""}`}
            action={
              <button onClick={() => setShowSessionModal(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
                background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)",
                color: "var(--t-accent-bright)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                <Icon name="plus" size={12} /> Nova Sessão
              </button>
            }>
            Crônicas da Campanha
          </SectionTitle>

          {liveSessions.length === 0 ? (
            <div className="glass" style={{ borderRadius: 18, padding: "40px 28px", textAlign: "center", position: "relative", overflow: "hidden", border: "1px dashed rgba(218,180,120,0.12)" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 400px 200px at 50% 60%, rgba(218,162,90,0.04), transparent 70%)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>📜</div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--t-text)", marginBottom: 8 }}>
                  Nenhuma sessão registrada ainda
                </div>
                <div style={{ fontSize: 13, color: "var(--t-text-mute)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 22px" }}>
                  Registre o que rolou em cada sessão — batalhas, revelações, momentos épicos — e construa a crônica da sua campanha.
                </div>
                <button onClick={() => setShowSessionModal(true)} style={{
                  padding: "10px 24px", borderRadius: 11, background: "var(--t-accent-soft)",
                  border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  + Registrar Primeira Sessão
                </button>
              </div>
            </div>
          ) : (
            <div style={{ paddingLeft: 4 }}>
              {[...liveSessions].reverse().map((s, i) => (
                <SessionCard key={s.id || s.n} session={s} isLast={i === liveSessions.length - 1} />
              ))}
            </div>
          )}

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
