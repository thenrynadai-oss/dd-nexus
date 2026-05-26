const NOTE_CATEGORIES = ["NPC", "Local", "Lore", "Sessão", "Personagem"];
const NOTE_COLORS = [
  { id: "var(--t-accent)", label: "Ouro" },
  { id: "#9d7bd8", label: "Arcano" },
  { id: "#6da5c8", label: "Azul" },
  { id: "#7ba85d", label: "Verde" },
  { id: "#c25555", label: "Rubi" },
];

const NoteForm = ({ note, onSave, onCancel }) => {
  const [form, setForm] = React.useState({
    title: note?.title || "",
    body: note?.body || "",
    category: note?.category || "Sessão",
    color: note?.color || "var(--t-accent)",
    tags: (note?.tags || []).join(", "),
    visibility: note?.visibility || "privado",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      body: form.body,
      category: form.category,
      color: form.color,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      visibility: form.visibility,
    });
  };

  return (
    <div className="glass-strong" style={{ borderRadius: 18, padding: 28 }}>
      <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--t-text)", marginBottom: 20 }}>
        {note?.id ? "Editar nota" : "Nova nota"}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>TÍTULO *</div>
        <input
          value={form.title}
          onChange={e => set("title", e.target.value)}
          placeholder="Título da nota..."
          autoFocus
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 15, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CATEGORIA</div>
          <select value={form.category} onChange={e => set("category", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
            {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>VISIBILIDADE</div>
          <select value={form.visibility} onChange={e => set("visibility", e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none" }}>
            <option value="privado">Privada</option>
            <option value="mestre">Só do Mestre</option>
            <option value="todos">Compartilhada com a mesa</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>COR</div>
        <div style={{ display: "flex", gap: 8 }}>
          {NOTE_COLORS.map(c => (
            <button key={c.id} onClick={() => set("color", c.id)} title={c.label} style={{
              width: 28, height: 28, borderRadius: 7, background: c.id, cursor: "pointer", flexShrink: 0,
              border: form.color === c.id ? "2.5px solid #fff" : "2px solid transparent",
              boxShadow: form.color === c.id ? `0 0 10px ${c.id}` : "none",
            }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>CONTEÚDO</div>
        <textarea
          value={form.body}
          onChange={e => set("body", e.target.value)}
          placeholder="Escreva suas anotações..."
          rows={7}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", color: "var(--t-text-soft)", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 22 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: "var(--t-text-mute)", marginBottom: 6 }}>ETIQUETAS (separadas por vírgula)</div>
        <input
          value={form.tags}
          onChange={e => set("tags", e.target.value)}
          placeholder="npc, vila, arco1..."
          style={{ width: "100%", padding: "9px 14px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid var(--t-border)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={!form.title.trim()}
          style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            background: form.title.trim() ? "var(--t-accent)" : "rgba(218,162,90,0.15)",
            border: "none", color: form.title.trim() ? "#1a0e04" : "var(--t-text-mute)",
            fontSize: 13, fontWeight: 700, cursor: form.title.trim() ? "pointer" : "default",
          }}
        >
          Salvar nota
        </button>
        <button onClick={onCancel} style={{ padding: "11px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 13, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

const NoteCard = ({ n, active, onClick, isDM }) => (
  <div onClick={onClick} className="glass" style={{ borderRadius: 14, padding: 16, cursor: "pointer", borderColor: active ? `${n.color}80` : "var(--t-border)", transform: active ? "translateX(4px)" : "translateX(0)", transition: "all 200ms", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: n.color, opacity: active ? 1 : 0.5 }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: n.color, fontWeight: 700 }}>{(n.category || "Nota").toUpperCase()}</span>
        {n.visibility === "mestre" && isDM && <span style={{ fontSize: 10 }}>🔒</span>}
        {n.pinned && <Icon name="star" size={11} style={{ color: "var(--t-accent-bright)" }} />}
      </div>
      <span className="mono" style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{n.updated}</span>
    </div>
    <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)", marginBottom: 4, lineHeight: 1.2 }}>{n.title}</div>
    <div style={{ fontSize: 12, color: "rgba(232,227,214,0.6)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {n.excerpt || n.body || "Sem conteúdo"}
    </div>
    {(n.tags || []).length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
        {n.tags.slice(0, 3).map(t => (
          <span key={t} className="mono" style={{ fontSize: 9.5, padding: "1px 6px", borderRadius: 4, background: "rgba(255,245,220,0.04)", color: "var(--t-text-mute)" }}>#{t}</span>
        ))}
      </div>
    )}
  </div>
);

const iconBtn = { width: 32, height: 32, borderRadius: 8, background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

const Notes = ({ role }) => {
  const { NOTES = [] } = useAppMock();
  const { Pill, Btn } = window.UI;
  const isDM = role === "mestre";

  const visible = NOTES.filter(n => isDM ? true : n.visibility !== "mestre");

  const ALL_CATS = ["Todas", ...NOTE_CATEGORIES];
  const [activeCat, setActiveCat] = useState("Todas");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = visible.filter(n => {
    if (activeCat !== "Todas" && n.category !== activeCat) return false;
    if (search) {
      const hay = `${n.title} ${n.body || n.excerpt || ""} ${(n.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const selected = editing ? null : (filtered.find(n => n.id === selectedId) || filtered[0] || null);
  const pinned = filtered.filter(n => n.pinned);

  const handleSaveNote = (formData) => {
    if (editing && editing.id) {
      window.AppData?.updateNote(editing.id, formData);
    } else {
      const res = window.AppData?.createNote(formData);
      if (res?.note) setSelectedId(res.note.id);
    }
    setEditing(null);
  };

  const handlePin = (note) => {
    window.AppData?.updateNote(note.id, { pinned: !note.pinned });
  };

  const handleDelete = (id) => {
    window.AppData?.deleteNote(id);
    setConfirmDelete(null);
    if (selectedId === id) setSelectedId(null);
  };

  const openCreate = () => { setEditing("new"); setSelectedId(null); };
  const selectNote = (id) => { setSelectedId(id); setEditing(null); setConfirmDelete(null); };

  // Empty state
  if (NOTES.length === 0 && !editing) {
    return (
      <div data-screen-label="Anotações">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Caderno de Anotações</h1>
            <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>Suas notas pessoais e anotações de campanha</div>
          </div>
        </div>
        <div className="glass" style={{ borderRadius: 22, padding: "72px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 500px 350px at 50% 50%, rgba(218,162,90,0.05), transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 24px", background: "var(--t-accent-soft)", border: "1px solid var(--t-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px -10px var(--t-accent-tint)", animation: "float-soft 6s ease-in-out infinite" }}>
              <Icon name="feather" size={38} style={{ color: "var(--t-accent)", opacity: 0.8 }} />
            </div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--t-text)", marginBottom: 12 }}>Nenhuma anotação ainda</div>
            <p style={{ fontSize: 15, color: "var(--t-text-mute)", lineHeight: 1.65, maxWidth: 440, margin: "0 auto 32px" }}>
              Registre NPCs, segredos da trama, ganchos e resumos de sessão. Tudo fica salvo na sua conta.
            </p>
            <Btn icon="plus" onClick={openCreate}>Criar primeira nota</Btn>
          </div>
        </div>
      </div>
    );
  }

  // Empty state but editing = "new" (triggered from empty state button)
  if (NOTES.length === 0 && editing) {
    return (
      <div data-screen-label="Anotações">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Caderno de Anotações</h1>
        </div>
        <NoteForm note={null} onSave={handleSaveNote} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div data-screen-label="Anotações">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Caderno de Anotações</h1>
          <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>
            {visible.length} nota{visible.length !== 1 ? "s" : ""}
          </div>
        </div>
        <Btn icon="plus" onClick={openCreate}>Nova nota</Btn>
      </div>

      {/* Search + category filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <div className="glass" style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12 }}>
          <Icon name="search" size={15} style={{ color: "var(--t-text-faint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar em título, conteúdo, etiquetas..." style={{ background: "none", border: "none", color: "var(--t-text-soft)", fontSize: 13, outline: "none", flex: 1 }} />
        </div>
        <div className="glass-soft" style={{ padding: 4, borderRadius: 12, display: "flex", gap: 2 }}>
          {ALL_CATS.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{ padding: "8px 14px", borderRadius: 8, background: activeCat === cat ? "var(--t-accent-tint)" : "transparent", color: activeCat === cat ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)", border: "none", fontSize: 12, fontWeight: 600 }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Layout: list + editor */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, alignItems: "start" }}>
        {/* Note list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pinned.length > 0 && (
            <>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "rgba(218,180,120,0.6)", padding: "0 8px 4px" }}>★ FIXADAS</div>
              {pinned.map(n => <NoteCard key={n.id} n={n} isDM={isDM} active={!editing && selected?.id === n.id} onClick={() => selectNote(n.id)} />)}
              <div style={{ height: 6 }} />
            </>
          )}
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-faint)", padding: "0 8px 4px" }}>TODAS · {filtered.length}</div>
          {filtered.filter(n => !n.pinned).map(n => <NoteCard key={n.id} n={n} isDM={isDM} active={!editing && selected?.id === n.id} onClick={() => selectNote(n.id)} />)}
          {filtered.length === 0 && (
            <div className="glass" style={{ padding: 22, borderRadius: 12, textAlign: "center", color: "var(--t-text-mute)", fontSize: 13 }}>Nenhuma nota encontrada</div>
          )}
        </div>

        {/* Editor / viewer */}
        {editing ? (
          <NoteForm
            note={editing === "new" ? null : editing}
            onSave={handleSaveNote}
            onCancel={() => setEditing(null)}
          />
        ) : selected ? (
          <div className="glass-strong" style={{ borderRadius: 18, padding: 32, position: "sticky", top: 20, alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase", color: selected.color, background: `${selected.color}1f`, border: `1px solid ${selected.color}40` }}>
                    {selected.category}
                  </span>
                  {selected.visibility === "mestre" && <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: "#c25555", background: "#c2555520", border: "1px solid #c2555540" }}>🔒 só do mestre</span>}
                  {selected.visibility === "todos" && <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: "#7ba85d", background: "#7ba85d20", border: "1px solid #7ba85d40" }}>compartilhada</span>}
                </div>
                <h2 className="serif" style={{ fontSize: 32, fontWeight: 600, color: "var(--t-text)", margin: 0, lineHeight: 1.15 }}>{selected.title}</h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, fontSize: 12, color: "var(--t-text-mute)" }}>
                  <span>atualizada {selected.updated}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => handlePin(selected)} style={iconBtn} title={selected.pinned ? "Desafixar" : "Fixar"}>
                  <Icon name="star" size={14} style={{ color: selected.pinned ? "var(--t-accent-bright)" : "var(--t-text-mute)" }} />
                </button>
                <button onClick={() => setEditing(selected)} style={iconBtn} title="Editar">
                  <Icon name="edit" size={14} style={{ color: "rgba(232,227,214,0.7)" }} />
                </button>
                <button onClick={() => setConfirmDelete(selected.id)} style={{ ...iconBtn, borderColor: "rgba(194,85,85,0.3)" }} title="Excluir">
                  <Icon name="trash" size={14} style={{ color: "#c25555" }} />
                </button>
              </div>
            </div>

            {(selected.tags || []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
                {selected.tags.map(t => (
                  <span key={t} className="mono" style={{ fontSize: 10.5, padding: "3px 9px", borderRadius: 999, background: "rgba(255,245,220,0.05)", border: "1px solid rgba(218,180,120,0.18)", color: "rgba(232,227,214,0.7)", letterSpacing: 0.4 }}>#{t}</span>
                ))}
              </div>
            )}

            <div style={{ padding: "22px 26px", borderRadius: 14, background: "rgba(0,0,0,0.25)", border: "1px solid var(--t-border)", minHeight: 180 }}>
              {selected.body ? (
                <div className="serif" style={{ fontSize: 16.5, lineHeight: 1.85, color: "var(--t-text-soft)", whiteSpace: "pre-wrap", letterSpacing: 0.1 }}>
                  {selected.body}
                </div>
              ) : (
                <div style={{ color: "var(--t-text-faint)", fontSize: 14, fontStyle: "italic" }}>Nota sem conteúdo. Clique em editar para adicionar texto.</div>
              )}
            </div>

            {confirmDelete === selected.id && (
              <div className="glass" style={{ marginTop: 14, padding: 14, borderRadius: 12, border: "1px solid rgba(194,85,85,0.4)", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, fontSize: 13, color: "var(--t-text-mute)" }}>Excluir esta nota permanentemente?</div>
                <button onClick={() => handleDelete(selected.id)} style={{ padding: "7px 16px", borderRadius: 8, background: "#c25555", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Excluir</button>
                <button onClick={() => setConfirmDelete(null)} style={{ padding: "7px 14px", borderRadius: 8, background: "transparent", border: "1px solid var(--t-border)", color: "var(--t-text-mute)", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
              </div>
            )}
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: 18, padding: 60, textAlign: "center" }}>
            <Icon name="feather" size={32} style={{ color: "var(--t-text-faint)", marginBottom: 14, display: "block" }} />
            <div style={{ color: "var(--t-text-mute)", fontSize: 14 }}>Selecione uma nota ou crie uma nova</div>
          </div>
        )}
      </div>
    </div>
  );
};

window.Notes = Notes;
