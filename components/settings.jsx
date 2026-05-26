// Injeta keyframes uma vez
if (!document.getElementById("settings-toast-style")) {
  const s = document.createElement("style");
  s.id = "settings-toast-style";
  s.textContent = `
    @keyframes toast-in {
      0%   { opacity: 0; transform: translateY(24px) scale(0.94); }
      60%  { opacity: 1; transform: translateY(-4px) scale(1.02); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toast-out {
      0%   { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(12px) scale(0.96); }
    }
    @keyframes shimmer-h {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 28px -4px rgba(218,162,90,0.55), 0 8px 32px -8px rgba(0,0,0,0.6); }
      50%       { box-shadow: 0 0 48px -2px rgba(218,162,90,0.85), 0 8px 32px -8px rgba(0,0,0,0.6); }
    }
  `;
  document.head.appendChild(s);
}

const SaveToast = ({ visible, leaving }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 9999,
      animation: leaving ? "toast-out 380ms ease forwards" : "toast-in 420ms cubic-bezier(0.22,1,0.36,1) forwards",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 22px",
        background: "linear-gradient(135deg, #1a1208 0%, #2a1e0a 50%, #1a1208 100%)",
        border: "1px solid rgba(218,162,90,0.5)",
        borderRadius: 16,
        animation: "glow-pulse 2s ease-in-out infinite",
        minWidth: 260,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(105deg, transparent 35%, rgba(218,162,90,0.12) 50%, transparent 65%)",
          backgroundSize: "200% 100%",
          animation: "shimmer-h 2.2s linear infinite",
        }} />
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(218,162,90,0.25), rgba(218,162,90,0.08))",
          border: "1px solid rgba(218,162,90,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>✦</div>
        <div>
          <div className="serif" style={{ fontSize: 15, fontWeight: 600, color: "var(--t-accent-bright)", lineHeight: 1.1 }}>Perfil salvo</div>
          <div style={{ fontSize: 11.5, color: "rgba(218,180,120,0.65)", marginTop: 3 }}>Suas alterações foram aplicadas</div>
        </div>
      </div>
    </div>
  );
};

// Helpers fora do Settings para não recriar a cada render
const SettingsField = ({ label, hint, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
      <label style={{ fontSize: 11.5, color: "var(--t-text-mute)", fontWeight: 600, letterSpacing: 0.3 }}>{label}</label>
      {hint && <span className="mono" style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const SettingsInput = (props) => (
  <input {...props} style={{
    width: "100%", padding: "10px 12px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid var(--t-border)",
    borderRadius: 8, color: "var(--t-text)",
    fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  }} onFocus={(e) => e.target.style.borderColor = "var(--t-border-active)"}
     onBlur={(e) => e.target.style.borderColor = "var(--t-border)"} />
);

const SettingsToggle = ({ on, onChange, label, desc }) => (
  <button onClick={() => onChange(!on)} style={{
    display: "flex", alignItems: "center", gap: 14,
    width: "100%", padding: "12px 14px",
    background: "rgba(0,0,0,0.2)",
    border: `1px solid ${on ? "var(--t-border-strong)" : "var(--t-border)"}`,
    borderRadius: 10, cursor: "pointer", textAlign: "left",
  }}>
    <div style={{
      width: 38, height: 22, borderRadius: 999,
      background: on ? "var(--t-accent)" : "rgba(0,0,0,0.5)",
      border: "1px solid var(--t-border)",
      position: "relative", flexShrink: 0, transition: "background 180ms",
    }}>
      <div style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "#1a0e04" : "var(--t-text-mute)",
        transition: "left 180ms",
      }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, color: "var(--t-text)", fontWeight: 500 }}>{label}</div>
      {desc && <div style={{ fontSize: 11.5, color: "var(--t-text-mute)", marginTop: 2 }}>{desc}</div>}
    </div>
  </button>
);

// Conta + Personalização do site
const Settings = ({ role, theme, setTheme }) => {
  const Icon = window.Icon;
  const { Pill, Btn, SectionTitle } = window.UI;
  const isDM = role === "mestre";

  const [tab, setTab] = useState("conta");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profileImg, setProfileImg] = useState(null);
  const [bannerImg, setBannerImg] = useState(null);
  const [avatarHue, setAvatarHue] = useState(180);
  const avatarFileRef = React.useRef(null);
  const bannerFileRef = React.useRef(null);

  React.useEffect(() => {
    const u = window.Auth?.getCurrentUser() || {};
    if (u.nome) setName(u.nome);
    if (u.apelido) setHandle(u.apelido);
    if (u.email) setEmail(u.email);
    if (u.profileImg) setProfileImg(u.profileImg);
    if (u.bannerImg) setBannerImg(u.bannerImg);
  }, []);

  const [density, setDensity] = useState("confortável");
  const [animations, setAnimations] = useState(true);
  const [particles, setParticles] = useState(true);
  const [diceSound, setDiceSound] = useState(true);
  const [diceStyle, setDiceStyle] = useState("clássico");
  const [fontSize, setFontSize] = useState(100);
  const [pingDM, setPingDM] = useState(true);
  const [pingMention, setPingMention] = useState(true);
  const [pingSession, setPingSession] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [toast, setToast] = useState(false);
  const [toastLeaving, setToastLeaving] = useState(false);

  const showToast = () => {
    setToastLeaving(false);
    setToast(true);
    setTimeout(() => setToastLeaving(true), 2400);
    setTimeout(() => setToast(false), 2800);
  };

  const readFile = (file, cb) => {
    const r = new FileReader();
    r.onload = (ev) => cb(ev.target.result);
    r.readAsDataURL(file);
  };

  const themes = [
    { id: "default", l: "Vasteria", c1: "#1a1410", c2: "#d8a25a", desc: "Padrão · pergaminho dourado" },
    { id: "blood", l: "Sangue", c1: "#1a0608", c2: "#c8243a", desc: "Horror gótico · vampírico" },
    { id: "cthulhu", l: "Profundezas", c1: "#0a1318", c2: "#4a9b8e", desc: "Mistério · cósmico" },
    { id: "kh-sora", l: "Kingdom Key", c1: "#0a1a3a", c2: "#ffcc33", desc: "Céu de Destiny Islands" },
    { id: "kh-dark", l: "Reino das Trevas", c1: "#050208", c2: "#b860ff", desc: "Sem-Coração · Anti-Form" },
  ];

  const Field = SettingsField;
  const Input = SettingsInput;
  const Toggle = SettingsToggle;

  const Tabs = [
    { id: "conta", l: "Conta", i: "user" },
    { id: "tema", l: "Tema do site", i: "spark" },
    { id: "interface", l: "Interface", i: "settings" },
    { id: "dados", l: "Dados", i: "dice" },
    { id: "notificações", l: "Notificações", i: "chat" },
    { id: "privacidade", l: "Privacidade", i: "shield" },
  ];

  const initials = name ? name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

      {/* ── Header com banner estilo Discord ── */}
      <div className="glass" style={{ borderRadius: 16, border: "1px solid var(--t-border)", marginBottom: 18, overflow: "hidden" }}>
        {/* Banner */}
        <div style={{
          height: 130, position: "relative", overflow: "hidden",
          background: bannerImg ? "transparent" : "linear-gradient(135deg, rgba(218,162,90,0.12) 0%, rgba(90,46,16,0.25) 100%)",
        }}>
          {bannerImg && (
            <img src={bannerImg} style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }} />
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, transparent 40%, rgba(10,7,15,0.75) 100%)",
          }} />
        </div>

        {/* Perfil abaixo do banner */}
        <div style={{ padding: "0 28px 22px", position: "relative" }}>
          {/* Avatar sobreposto ao banner */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -44 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {profileImg ? (
                <img src={profileImg} style={{
                  width: 86, height: 86, borderRadius: "50%", objectFit: "cover",
                  border: "3px solid var(--t-bg-base)",
                  boxShadow: "0 0 24px -4px var(--t-accent-glow)",
                }} />
              ) : (
                <div style={{
                  width: 86, height: 86, borderRadius: "50%",
                  background: `conic-gradient(from 180deg, hsl(${avatarHue},65%,55%), hsl(${(avatarHue+60)%360},65%,45%), hsl(${avatarHue},65%,55%))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, fontWeight: 700, color: "#1a0e04",
                  fontFamily: "var(--t-font-serif)",
                  border: "3px solid var(--t-bg-base)",
                  boxShadow: "0 0 24px -4px var(--t-accent-glow)",
                }}>{initials}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
              <Pill color={isDM ? "#c9b0e8" : "var(--t-accent-bright)"}>{isDM ? "MESTRE" : "JOGADOR"}</Pill>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h1 className="serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--t-text)", margin: "0 0 4px" }}>{name || "Usuário Vasteria"}</h1>
            <div className="mono" style={{ fontSize: 12, color: "var(--t-text-mute)", marginBottom: 6 }}>
              {handle ? `@${handle}` : "@seu.usuario"}
              {email && <span style={{ marginLeft: 10, color: "rgba(218,180,120,0.45)" }}>· {email}</span>}
            </div>
            {bio && <div style={{ fontSize: 13, color: "var(--t-text-soft)", lineHeight: 1.5, maxWidth: 520 }}>{bio}</div>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 18, padding: 4,
        background: "rgba(0,0,0,0.3)", borderRadius: 12,
        border: "1px solid var(--t-border)", overflowX: "auto",
      }}>
        {Tabs.map((t) => {
          const a = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 8,
              background: a ? "var(--t-accent-tint)" : "transparent",
              border: a ? "1px solid var(--t-border-active)" : "1px solid transparent",
              color: a ? "var(--t-accent-bright)" : "var(--t-text-mute)",
              fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
            }}>
              <Icon name={t.i} size={13} />{t.l}
            </button>
          );
        })}
      </div>

      {/* ── CONTA ── */}
      {tab === "conta" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }}>

          {/* Identidade */}
          <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid var(--t-border)" }}>
            <SectionTitle>Identidade</SectionTitle>
            <Field label="Nome de exibição">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Identificador" hint="único">
              <Input value={handle} onChange={(e) => setHandle(e.target.value)} />
            </Field>
            <Field label="Bio" hint={`${bio.length}/240`}>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 240))} rows={3} style={{
                width: "100%", padding: "10px 12px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--t-border)",
                borderRadius: 8, color: "var(--t-text)",
                fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none",
                boxSizing: "border-box",
              }} />
            </Field>

            {/* Email read-only */}
            <Field label="E-mail">
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "rgba(0,0,0,0.15)",
                border: "1px solid var(--t-border)",
                borderRadius: 8,
              }}>
                <Icon name="shield" size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--t-text-mute)", flex: 1 }}>{email || "—"}</span>
                <span className="mono" style={{ fontSize: 9.5, color: "var(--t-text-faint)", letterSpacing: 1 }}>CONTA</span>
              </div>
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Btn onClick={() => {
                if (!window.Auth) { alert("Auth não disponível. Recarregue a página."); return; }
                const res = window.Auth.updateCurrentUser({ nome: name, apelido: handle, profileImg, bannerImg });
                if (!res || !res.ok) { alert(res?.msg || "Erro ao salvar."); return; }
                window.dispatchEvent(new Event("vg:auth-update"));
                showToast();
                setTimeout(() => window.location.reload(), 1600);
              }}>Salvar alterações</Btn>
              <Btn variant="ghost" onClick={() => {
                const u = window.Auth?.getCurrentUser() || {};
                setName(u.nome || "");
                setHandle(u.apelido || "");
                setProfileImg(u.profileImg || null);
                setBannerImg(u.bannerImg || null);
              }}>Cancelar</Btn>
            </div>
          </div>

          {/* Coluna direita */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Banner */}
            <div className="glass" style={{ padding: 22, borderRadius: 14, border: "1px solid var(--t-border)" }}>
              <SectionTitle>Banner do perfil</SectionTitle>
              <input ref={bannerFileRef} type="file" accept="image/*,image/gif" style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  readFile(file, setBannerImg);
                  e.target.value = "";
                }} />
              {/* Preview do banner */}
              <div style={{
                height: 80, borderRadius: 10, marginBottom: 12, overflow: "hidden",
                background: bannerImg ? "transparent" : "rgba(0,0,0,0.3)",
                border: "1px solid var(--t-border)",
                position: "relative",
              }}>
                {bannerImg ? (
                  <img src={bannerImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>sem banner</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="ghost" onClick={() => bannerFileRef.current?.click()}>↑ Enviar banner</Btn>
                {bannerImg && <Btn size="sm" variant="danger" onClick={() => setBannerImg(null)}>Remover</Btn>}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--t-text-faint)", marginTop: 8 }}>
                Suporta imagens e GIFs animados
              </div>
            </div>

            {/* Avatar */}
            <div className="glass" style={{ padding: 22, borderRadius: 14, border: "1px solid var(--t-border)" }}>
              <SectionTitle>Ícone da conta</SectionTitle>
              <input ref={avatarFileRef} type="file" accept="image/*,image/gif" style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  readFile(file, setProfileImg);
                  e.target.value = "";
                }} />
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {profileImg ? (
                  <img src={profileImg} style={{
                    width: 72, height: 72, borderRadius: "50%", objectFit: "cover",
                    border: "2px solid var(--t-border-active)", flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: `conic-gradient(from 180deg, hsl(${avatarHue},65%,55%), hsl(${(avatarHue+60)%360},65%,45%), hsl(${avatarHue},65%,55%))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, fontWeight: 700, color: "#1a0e04",
                    fontFamily: "var(--t-font-serif)",
                    border: "2px solid var(--t-border-active)", flexShrink: 0,
                  }}>{initials}</div>
                )}
                <div style={{ flex: 1 }}>
                  {!profileImg && (
                    <>
                      <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginBottom: 6 }}>matiz</div>
                      <input type="range" min={0} max={359} value={avatarHue} onChange={(e) => setAvatarHue(+e.target.value)} style={{ width: "100%", accentColor: "var(--t-accent)" }} />
                    </>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Btn size="sm" variant="ghost" onClick={() => avatarFileRef.current?.click()}>↑ Enviar foto</Btn>
                    {profileImg && <Btn size="sm" variant="danger" onClick={() => setProfileImg(null)}>Remover</Btn>}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--t-text-faint)", marginTop: 8 }}>
                    Suporta imagens e GIFs animados
                  </div>
                </div>
              </div>
            </div>

            {/* Senha */}
            <div className="glass" style={{ padding: 22, borderRadius: 14, border: "1px solid var(--t-border)" }}>
              <SectionTitle>Senha</SectionTitle>
              <Field label="Senha atual"><Input type="password" placeholder="••••••••" /></Field>
              <Field label="Nova senha"><Input type="password" placeholder="•••••••••" /></Field>
              <Btn size="sm">Trocar senha</Btn>
            </div>

            {/* Zona de perigo */}
            <div className="glass" style={{ padding: 22, borderRadius: 14, border: "1px solid var(--t-border)" }}>
              <SectionTitle>Zona de perigo</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn size="sm" variant="danger">Sair de todas as sessões</Btn>
                <Btn size="sm" variant="danger">Excluir minha conta</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMA ── */}
      {tab === "tema" && (
        <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid var(--t-border)" }}>
          <SectionTitle>Tema do site</SectionTitle>
          <p style={{ fontSize: 13, color: "var(--t-text-soft)", marginBottom: 18, maxWidth: 600 }}>
            Escolha a atmosfera da sua plataforma. Aplica em tudo: fontes, cores, animações de fundo.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {themes.map((t) => {
              const a = theme === t.id;
              return (
                <button key={t.id} onClick={() => setTheme(t.id)} style={{
                  padding: 0, overflow: "hidden", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: a ? "2px solid var(--t-accent)" : "1px solid var(--t-border)",
                  background: "rgba(0,0,0,0.3)", position: "relative",
                }}>
                  <div style={{
                    height: 90,
                    background: `linear-gradient(135deg, ${t.c1} 0%, ${t.c2}aa 100%)`,
                    position: "relative", display: "flex", alignItems: "flex-end", padding: 12,
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.c2, boxShadow: `0 0 12px ${t.c2}` }} />
                    {a && <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: "var(--t-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e04" }}>
                      <Icon name="check" size={12} />
                    </div>}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div className="serif" style={{ fontSize: 16, color: "var(--t-text)", fontWeight: 600 }}>{t.l}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-mute)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 22 }}>
            <SectionTitle>Tamanho do texto</SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 11, color: "var(--t-text-mute)" }}>A</span>
              <input type="range" min={85} max={120} step={5} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} style={{ flex: 1, accentColor: "var(--t-accent)" }} />
              <span style={{ fontSize: 18, color: "var(--t-text-mute)" }}>A</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--t-accent-bright)", minWidth: 50, textAlign: "right" }}>{fontSize}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERFACE ── */}
      {tab === "interface" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="glass" style={{ padding: 22, borderRadius: 14, border: "1px solid var(--t-border)" }}>
            <SectionTitle>Densidade</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["compacto", "confortável", "espaçoso"].map((d) => (
                <button key={d} onClick={() => setDensity(d)} style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: density === d ? "var(--t-accent-tint)" : "rgba(0,0,0,0.2)",
                  border: density === d ? "1px solid var(--t-border-active)" : "1px solid var(--t-border)",
                  color: density === d ? "var(--t-accent-bright)" : "var(--t-text-soft)",
                  fontSize: 13, textAlign: "left", cursor: "pointer", textTransform: "capitalize",
                }}>{d}</button>
              ))}
            </div>
          </div>
          <div className="glass" style={{ padding: 22, borderRadius: 14, border: "1px solid var(--t-border)" }}>
            <SectionTitle>Animações</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Toggle on={animations} onChange={setAnimations} label="Animações da interface" desc="Transições suaves, hover, rolagem" />
              <Toggle on={particles} onChange={setParticles} label="Partículas de fundo" desc="Brasas, estrelas, criaturas que vagam" />
            </div>
          </div>
        </div>
      )}

      {/* ── DADOS ── */}
      {tab === "dados" && (
        <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid var(--t-border)" }}>
          <SectionTitle>Mesa de dados</SectionTitle>
          <Toggle on={diceSound} onChange={setDiceSound} label="Som ao rolar" desc="Clique satisfatório quando os dados pousam" />
          <div style={{ height: 12 }} />
          <Field label="Estilo dos dados">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { id: "clássico", l: "Clássico", desc: "Madeira e ouro" },
                { id: "obsidiana", l: "Obsidiana", desc: "Negro polido" },
                { id: "cristal", l: "Cristal", desc: "Translúcido" },
              ].map((s) => (
                <button key={s.id} onClick={() => setDiceStyle(s.id)} style={{
                  padding: 12, borderRadius: 10,
                  background: diceStyle === s.id ? "var(--t-accent-tint)" : "rgba(0,0,0,0.2)",
                  border: diceStyle === s.id ? "1px solid var(--t-border-active)" : "1px solid var(--t-border)",
                  cursor: "pointer", textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>⬢</div>
                  <div style={{ fontSize: 12, color: "var(--t-text)", fontWeight: 600 }}>{s.l}</div>
                  <div style={{ fontSize: 10, color: "var(--t-text-mute)", marginTop: 2 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* ── NOTIFICAÇÕES ── */}
      {tab === "notificações" && (
        <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid var(--t-border)" }}>
          <SectionTitle>Quando me avisar</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Toggle on={pingMention} onChange={setPingMention} label="Quando me mencionarem" desc="@seu-nome em qualquer chat ou anotação" />
            <Toggle on={pingDM} onChange={setPingDM} label="Mensagem direta" desc="Alguém te chama em privado" />
            <Toggle on={pingSession} onChange={setPingSession} label="Sessão começando" desc="30 minutos antes da próxima sessão agendada" />
          </div>
        </div>
      )}

      {/* ── PRIVACIDADE ── */}
      {tab === "privacidade" && (
        <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid var(--t-border)" }}>
          <SectionTitle>Privacidade</SectionTitle>
          <div style={{ padding: 14, marginBottom: 14, background: "var(--t-accent-soft)", border: "1px solid var(--t-border)", borderRadius: 10, fontSize: 12.5, color: "var(--t-text-soft)" }}>
            <strong style={{ color: "var(--t-accent-bright)" }}>Vasteria é privada.</strong> Só pessoas convidadas podem entrar. Suas notas, fichas e mesas ficam visíveis apenas para os participantes que você escolher.
          </div>
          <Toggle on={showOnline} onChange={setShowOnline} label="Mostrar quando estou online" desc="Outros membros das suas mesas veem o ponto verde" />
          <div style={{ height: 14 }} />
          <SectionTitle>Sessões ativas</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { d: "MacBook · Florianópolis", t: "este dispositivo", c: true },
              { d: "iPhone · iOS Safari", t: "há 2h", c: false },
              { d: "Chrome · Windows", t: "há 6 dias", c: false },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--t-border)", borderRadius: 10 }}>
                <Icon name="shield" size={15} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--t-text)" }}>
                    {s.d}{s.c && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--t-success)" }}>● ATUAL</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t-text-mute)" }}>{s.t}</div>
                </div>
                {!s.c && <button style={{ background: "none", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>desconectar</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      <SaveToast visible={toast} leaving={toastLeaving} />
    </div>
  );
};

window.Settings = Settings;
