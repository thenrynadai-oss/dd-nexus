// ── helpers de conta ──────────────────────────────────────────────────────────
function _getAllAccounts() {
  try { return JSON.parse(localStorage.getItem("nexus_db") || "[]"); } catch { return []; }
}

function _setAccountRole(uid, newRole) {
  try {
    const db = JSON.parse(localStorage.getItem("nexus_db") || "[]");
    const idx = db.findIndex(u => u.uid === uid);
    if (idx >= 0) { db[idx].role = newRole; localStorage.setItem("nexus_db", JSON.stringify(db)); }
    return db;
  } catch { return _getAllAccounts(); }
}

const AVATAR_PALETTE = ["#9d7bd8","#7ba85d","#c8933a","#5b87c4","#c45b5b","#5bc4b8","#d87b9d","#7bc4d8"];
function _avatarColor(name) { return AVATAR_PALETTE[(name || "?").charCodeAt(0) % AVATAR_PALETTE.length]; }

// ── AccountCard ───────────────────────────────────────────────────────────────
const AccountCard = ({ acc, isCurrent, onRoleChange }) => {
  const accRole = acc.role || "mestre";
  const isMestre = accRole === "mestre";
  const color = _avatarColor(acc.nome);

  return (
    <div className="glass" style={{
      borderRadius: 18, overflow: "hidden", position: "relative",
      border: isCurrent ? "1px solid rgba(200,147,58,0.5)" : "1px solid var(--t-border)",
      transition: "border-color 200ms",
    }}>
      {/* Banner */}
      <div style={{
        height: 76, position: "relative",
        background: acc.bannerImg
          ? `url(${acc.bannerImg}) center/cover no-repeat`
          : `linear-gradient(135deg, ${color}28 0%, ${color}0d 100%)`,
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(8,5,18,0.75) 100%)" }} />
        {isCurrent && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            padding: "3px 9px", borderRadius: 20,
            background: "rgba(123,168,93,0.22)", border: "1px solid rgba(123,168,93,0.6)",
            color: "#7ba85d", fontSize: 10, fontWeight: 700, letterSpacing: 0.9,
          }}>ATIVO</div>
        )}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {/* Avatar sobreposto ao banner */}
        <div style={{ marginTop: -26, marginBottom: 10 }}>
          {acc.profileImg ? (
            <img src={acc.profileImg} alt={acc.nome} style={{
              width: 52, height: 52, borderRadius: "50%",
              border: "3px solid #0d0818", objectFit: "cover", display: "block",
            }} />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              border: "3px solid #0d0818",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${color}99, ${color}44)`,
              fontSize: 20, fontWeight: 700, color: "#fff", userSelect: "none",
            }}>
              {(acc.nome || "?")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Nome + handle */}
        <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)", lineHeight: 1.2, marginBottom: 2 }}>
          {acc.nome}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--t-text-mute)", marginBottom: 14 }}>
          @{acc.apelido}
        </div>

        {/* Toggle de permissão */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          borderRadius: 9, background: "rgba(0,0,0,0.35)",
          border: "1px solid var(--t-border)", overflow: "hidden",
          fontSize: 11.5, fontWeight: 700,
        }}>
          <button
            onClick={() => onRoleChange(acc.uid, "mestre")}
            title="Permissão de Mestre"
            style={{
              padding: "8px 4px", border: "none", cursor: "pointer",
              background: isMestre
                ? "linear-gradient(135deg, #3a1870 0%, #5e28a0 100%)"
                : "transparent",
              color: isMestre ? "#d8b8ff" : "rgba(232,227,214,0.35)",
              transition: "background 200ms, color 200ms",
              letterSpacing: 0.4,
            }}
          >⚔ Mestre</button>
          <button
            onClick={() => onRoleChange(acc.uid, "jogador")}
            title="Permissão de Jogador"
            style={{
              padding: "8px 4px", border: "none", cursor: "pointer",
              background: !isMestre
                ? "linear-gradient(135deg, #7a4a0a 0%, #b07020 100%)"
                : "transparent",
              color: !isMestre ? "#ffe0a0" : "rgba(232,227,214,0.35)",
              transition: "background 200ms, color 200ms",
              letterSpacing: 0.4,
            }}
          >🎲 Jogador</button>
        </div>
      </div>
    </div>
  );
};

// ── Players ───────────────────────────────────────────────────────────────────
const Players = ({ setView, setRole, role }) => {
  const { PLAYERS = [] } = useAppMock();
  const { Pill, Btn, Avatar } = window.UI;

  const currentUser = window.Auth?.getCurrentUser?.() || {};

  const [accounts, setAccounts] = useState(_getAllAccounts);
  const [filter, setFilter]     = useState("todos");
  const [layout, setLayout]     = useState("grid");
  const [toast, setToast]       = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  function handleRoleChange(uid, newRole) {
    const updated = _setAccountRole(uid, newRole);
    setAccounts([...updated]);
    // Se for a conta ativa, reflete no estado do app
    if (uid === currentUser.uid) {
      setRole?.(newRole);
      if (newRole === "jogador") setView?.("dashboard");
    }
    showToast(newRole === "mestre" ? "Permissão alterada para Mestre ⚔" : "Permissão alterada para Jogador 🎲");
  }

  const filtered = PLAYERS.filter((p) =>
    filter === "todos" ? true : filter === "online" ? p.status === "online" : p.status !== "online"
  );

  return (
    <div data-screen-label="Jogadores">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, padding: "10px 22px", borderRadius: 12,
          background: "rgba(10,7,15,0.95)", border: "1px solid var(--t-border-strong)",
          color: "var(--t-accent-bright)", fontSize: 13, fontWeight: 600, pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {/* ── SEÇÃO: CONTAS NESTE DISPOSITIVO ──────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>
              Contas neste Dispositivo
            </h2>
            <div style={{ fontSize: 12.5, color: "var(--t-text-mute)", marginTop: 4 }}>
              {accounts.length} conta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""} — alterne a permissão de cada uma
            </div>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="glass" style={{ borderRadius: 16, padding: 24, textAlign: "center", color: "var(--t-text-mute)", fontSize: 14 }}>
            Nenhuma conta encontrada neste dispositivo.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {accounts.map(acc => (
              <AccountCard
                key={acc.uid}
                acc={acc}
                isCurrent={acc.uid === currentUser.uid}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DIVISOR ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 1, background: "var(--t-border)" }} />
        <span className="mono" style={{ fontSize: 10, letterSpacing: 1.6, color: "var(--t-text-faint)" }}>AVENTUREIROS DAS MESAS</span>
        <div style={{ flex: 1, height: 1, background: "var(--t-border)" }} />
      </div>

      {/* ── SEÇÃO: JOGADORES ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Aventureiros</h2>
            <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>{PLAYERS.length} aventureiro{PLAYERS.length !== 1 ? "s" : ""} em suas mesas</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="glass-soft" style={{ padding: 4, borderRadius: 10, display: "flex", gap: 2 }}>
              {["todos", "online", "offline"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: filter === f ? "var(--t-accent-tint)" : "transparent",
                  color: filter === f ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)",
                  fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                }}>{f}</button>
              ))}
            </div>
            <div className="glass-soft" style={{ padding: 4, borderRadius: 10, display: "flex", gap: 2 }}>
              <button onClick={() => setLayout("grid")} style={{ padding: 8, borderRadius: 7, cursor: "pointer", background: layout === "grid" ? "var(--t-accent-tint)" : "transparent", color: layout === "grid" ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)", border: "none" }}><Icon name="grid" size={14} /></button>
              <button onClick={() => setLayout("list")} style={{ padding: 8, borderRadius: 7, cursor: "pointer", background: layout === "list" ? "var(--t-accent-tint)" : "transparent", color: layout === "list" ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)", border: "none" }}><Icon name="list" size={14} /></button>
            </div>
            <Btn icon="plus" onClick={() => showToast("Convites via link chegam em breve ✦")}>Convidar</Btn>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass" style={{ borderRadius: 18, padding: 28, textAlign: "center", color: "var(--t-text-mute)", fontSize: 14 }}>
            Nenhum jogador encontrado. Importe ou conecte dados reais para ver os aventureiros aqui.
          </div>
        ) : layout === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {filtered.map((p) => {
              const hpParts = (p.hp || "0/0").toString().split("/");
              const hpVal = parseInt(hpParts[0]) || 0;
              const hpMax = parseInt(hpParts[1]) || 0;
              return (
                <div key={p.id} className="glass" style={{ borderRadius: 18, padding: 22, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 90, background: `radial-gradient(ellipse at 50% 0%, ${p.accent}40, transparent 70%)` }} />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <div style={{ position: "relative", marginBottom: 14 }}>
                      <Avatar name={p.name} size={68} color={p.accent} />
                      <span style={{
                        position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%",
                        background: p.status === "online" ? "#7ba85d" : p.status === "ausente" ? "var(--t-accent-bright)" : "#54545c",
                        border: "3px solid #181226",
                      }} />
                    </div>
                    <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--t-text)" }}>{p.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 14 }}>{p.handle}</div>
                    <Pill color={p.accent}>{p.char}</Pill>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, width: "100%", marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--t-border)" }}>
                      <div>
                        <div className="serif gold-bright" style={{ fontSize: 18, fontWeight: 600 }}>{p.level}</div>
                        <div style={{ fontSize: 9.5, letterSpacing: 1, color: "var(--t-text-faint)" }} className="mono">NÍVEL</div>
                      </div>
                      <div>
                        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: hpVal === hpMax ? "#7ba85d" : "var(--t-accent-bright)" }}>{hpParts[0]}</div>
                        <div style={{ fontSize: 9.5, letterSpacing: 1, color: "var(--t-text-faint)" }} className="mono">PV</div>
                      </div>
                      <div>
                        <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: "#9d7bd8" }}>{p.campaigns}</div>
                        <div style={{ fontSize: 9.5, letterSpacing: 1, color: "var(--t-text-faint)" }} className="mono">MESAS</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 14 }}>
                      <button onClick={() => setView?.("character")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Ver Ficha</button>
                      <button onClick={() => showToast("Chat de mesa em breve ✦")} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)", color: "rgba(232,227,214,0.7)", cursor: "pointer" }}><Icon name="chat" size={13} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 1.5fr 80px 100px 100px 100px 80px", padding: "14px 22px", fontSize: 10, letterSpacing: 1.3, color: "var(--t-text-mute)", fontWeight: 600, borderBottom: "1px solid var(--t-border)" }} className="mono">
              <span /><span>JOGADOR</span><span>PERSONAGEM</span><span>NÍVEL</span><span>PV</span><span>MESAS</span><span>STATUS</span><span />
            </div>
            {filtered.map((p, i) => (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "60px 1.5fr 1.5fr 80px 100px 100px 100px 80px",
                padding: "14px 22px", alignItems: "center", fontSize: 13,
                borderBottom: i === filtered.length - 1 ? "none" : "1px dashed rgba(218,180,120,0.08)",
              }}>
                <Avatar name={p.name} size={36} color={p.accent} />
                <div>
                  <div style={{ color: "var(--t-text)", fontWeight: 600 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--t-text-mute)" }}>{p.handle}</div>
                </div>
                <span className="serif" style={{ fontSize: 15, color: "var(--t-text-soft)" }}>{p.char}</span>
                <span className="serif gold-bright" style={{ fontSize: 18, fontWeight: 600 }}>{p.level}</span>
                <span className="mono" style={{ fontSize: 12 }}>{p.hp}</span>
                <span style={{ color: "rgba(232,227,214,0.7)" }}>{p.campaigns}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.status === "online" ? "#7ba85d" : p.status === "ausente" ? "var(--t-accent-bright)" : "#54545c" }} />
                  <span style={{ fontSize: 11.5, color: "rgba(232,227,214,0.7)", textTransform: "capitalize" }}>{p.status}</span>
                </span>
                <button onClick={() => setView?.("character")} style={{ padding: "6px 10px", borderRadius: 6, background: "var(--t-accent-tint)", border: "1px solid var(--t-border-strong)", color: "var(--t-accent-bright)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Ver</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

window.Players = Players;
