const Notes = ({ role }) => {
  const { Pill, Btn, SectionTitle } = window.UI;
  const isDM = role === "mestre";

  const allNotes = [
    {
      id: "n1", title: "Sir Tellam de Vorlan", category: "NPC", visibility: "mestre",
      campaign: "A Coroa do Lago Cinza",
      tags: ["aliado", "nobre", "espadachim"], color: "#9d7bd8",
      updated: "há 2h",
      pinned: true,
      excerpt: "Capitão da guarda de Vorlan. Cabelo grisalho, cicatriz no maxilar. Devedor de favor a Helena. Sabe da existência do culto.",
      body: "Capitão da guarda de Vorlan. Cabelo grisalho, cicatriz no maxilar esquerdo. Idade ~52.\n\nMOTIVAÇÃO: redimir-se por ter falhado em proteger a antiga rainha. Vê o grupo como sua segunda chance.\n\nSEGREDO: sabe que o culto da Coroa tem um informante dentro do castelo, mas não sabe quem.\n\nVOZ: fala pausadamente, evita contrações, usa metáforas de batalha mesmo em conversa casual.",
    },
    {
      id: "n2", title: "Estalagem da Lua Quebrada", category: "Local", visibility: "todos",
      campaign: "A Coroa do Lago Cinza",
      tags: ["estalagem", "vorlan"], color: "#6da5c8", updated: "ontem",
      excerpt: "Antigo ponto de encontro a oeste de Vorlan. Atendido por Bruna, anã ferreira aposentada. 5 PO por noite.",
      body: "Antigo ponto de encontro a oeste de Vorlan. A placa rangedora tem uma lua partida ao meio.\n\nAtendido por Bruna, anã ferreira aposentada. Cobra 5 PO por noite (com café da manhã).\n\nO porão tem uma passagem que liga aos esgotos antigos. Apenas Bruna e o grupo sabem.",
    },
    {
      id: "n3", title: "O culto da Coroa Cinzenta", category: "Lore", visibility: "mestre",
      campaign: "A Coroa do Lago Cinza",
      tags: ["antagonista", "arco-2", "spoiler"], color: "#c25555", updated: "3 dias",
      pinned: true,
      excerpt: "Não são adoradores — são guardiões. Acreditam que a coroa contém a alma da última rainha de Aldoria.",
      body: "REVERSÃO PRINCIPAL: o grupo descobrirá no arco 3 que o culto não quer libertar a coroa — quer mantê-la selada. O verdadeiro vilão é Lorde Asch, que financiou o grupo no início.\n\nLÍDER: Mãe Vela. Anciã cega, mãos queimadas. Vive nos pântanos de Threwid.\n\nRITO: para abrir o selo, é preciso o sangue de três descendentes da linhagem real. Um deles é Aelar — mas ele não sabe.",
    },
    {
      id: "n4", title: "Resumo — Sessão 14", category: "Sessão", visibility: "todos",
      campaign: "A Coroa do Lago Cinza",
      tags: ["resumo", "26-abr"], color: "var(--t-accent)", updated: "há 5h",
      excerpt: "O grupo chega à Casa Sem Janelas. Aelar identifica pegadas de ferozes; Brann descobre alçapão sob o tapete.",
      body: "O grupo chegou à Casa Sem Janelas pouco depois do crepúsculo.\n\n• Aelar fez teste de Sobrevivência (DC 14, rolou 19): identificou pegadas de gnolls, três adultos, um filhote.\n• Brann encontrou um alçapão sob o tapete da cozinha (Investigação 17).\n• Liriel detectou magia: a porta tinha encantamento de silêncio.\n• Combate na adega: 3 gnolls, 1 hiena. Ysolde ficou inconsciente por 1 turno.\n\nLOOT: 2 poções de cura, 47 PO, mapa rasgado mostrando rota para o Lago Cinza.",
    },
    {
      id: "n5", title: "Pista — medalhão de Aelar", category: "Personagem", visibility: "jogador",
      campaign: "A Coroa do Lago Cinza",
      tags: ["aelar", "história"], color: "var(--t-accent-bright)", updated: "há 1h",
      excerpt: "O medalhão começa a brilhar perto de gnolls. Anotar: investigar significado das runas com a druida.",
      body: "O medalhão de prata que Aelar recebeu do pai começou a brilhar levemente perto dos gnolls na sessão 14.\n\nIDEIAS DA JOGADORA:\n— Pode ser detector genérico de criaturas mágicas?\n— Conexão com o pai desaparecido?\n— Pedir à druida em Threwid para ler as runas.\n\nQuestão para Helena: posso fazer Arcanismo passivo durante o sono?",
    },
    {
      id: "n6", title: "Bruna Pedra-Forja", category: "NPC", visibility: "todos",
      campaign: "A Coroa do Lago Cinza",
      tags: ["aliada", "comerciante"], color: "#7ba85d", updated: "5 dias",
      excerpt: "Anã ferreira aposentada. Donna da Estalagem da Lua Quebrada. Tia distante de Brann.",
      body: "Anã ferreira aposentada (~140 anos). Donna da Estalagem da Lua Quebrada.\n\nÉ tia distante de Brann (jogador descobriu na sessão 11).\n\nVENDE: equipamento de viagem com 10% de desconto para o grupo. Tem 2 poções de cura por semana.",
    },
    {
      id: "n7", title: "Ganchos pendentes", category: "Lore", visibility: "mestre",
      campaign: "A Coroa do Lago Cinza",
      tags: ["mestre", "planejamento"], color: "#c8643a", updated: "ontem",
      excerpt: "5 ganchos plantados, 2 ainda não puxados pelos jogadores. Forçar contato em 2 sessões se não morderem.",
      body: "GANCHOS PUXADOS:\n✓ Mensageiro de Vorlan (sessão 13)\n✓ Pegadas de gnolls (sessão 14)\n✓ Alçapão da Casa\n\nPENDENTES:\n○ Carta da druida que Aelar tem no bolso há 4 sessões — forçar leitura na próxima\n○ A criança que Liriel curou em Threwid pode reaparecer com info crucial\n\nSE não morderem em 2 sessões, criar evento que force escolha.",
    },
    {
      id: "n8", title: "Threwid — vila e arredores", category: "Local", visibility: "todos",
      campaign: "A Coroa do Lago Cinza",
      tags: ["vila", "druida"], color: "#7ba85d", updated: "1 sem.",
      excerpt: "Vila de 200 habitantes na borda da Floresta Cinzenta. Liderada pelo conselho de anciãos. Druida vive na torre.",
      body: "Vila de ~200 habitantes na borda da Floresta Cinzenta.\n\nLOCAIS:\n• A torre da druida (Velora)\n• Mercado central (3x semana)\n• Estalagem do Cervo Branco\n• Cemitério com lápides cobertas de musgo bioluminescente\n\nTENSÃO: o conselho está dividido entre cooperar com Vorlan ou manter neutralidade.",
    },
  ];

  const visible = allNotes.filter((n) =>
    isDM ? true : n.visibility !== "mestre"
  );

  const categories = ["Todas", "NPC", "Local", "Lore", "Sessão", "Personagem"];
  const [activeCat, setActiveCat] = useState("Todas");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(visible[0]?.id);

  const filtered = visible.filter((n) => {
    if (activeCat !== "Todas" && n.category !== activeCat) return false;
    if (search && !(`${n.title} ${n.excerpt} ${n.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  const selected = filtered.find((n) => n.id === selectedId) || filtered[0];
  const pinned = filtered.filter((n) => n.pinned);

  return (
    <div data-screen-label="Anotações">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 600, margin: 0, color: "var(--t-text)" }}>Caderno de Anotações</h1>
          <div style={{ fontSize: 13, color: "var(--t-text-mute)", marginTop: 4 }}>
            {isDM
              ? `${visible.length} notas · incluindo ${allNotes.filter(n => n.visibility === "mestre").length} privadas do mestre`
              : `${visible.length} notas visíveis · notas do mestre ocultas`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" icon="upload" size="sm">Exportar .md</Btn>
          <Btn icon="plus">Nova nota</Btn>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <div className="glass" style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 12,
        }}>
          <Icon name="search" size={15} style={{ color: "var(--t-text-faint)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar em título, conteúdo, etiquetas..."
            style={{ background: "none", border: "none", color: "var(--t-text-soft)", fontSize: 13, outline: "none", flex: 1 }}
          />
        </div>
        <div className="glass-soft" style={{ padding: 4, borderRadius: 12, display: "flex", gap: 2 }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCat(c)} style={{
              padding: "8px 14px", borderRadius: 8,
              background: activeCat === c ? "var(--t-accent-tint)" : "transparent",
              color: activeCat === c ? "var(--t-accent-bright)" : "rgba(232,227,214,0.6)",
              border: "none", fontSize: 12, fontWeight: 600,
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, alignItems: "start" }}>
        {/* List column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pinned.length > 0 && (
            <>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "rgba(218,180,120,0.6)", padding: "0 8px 4px" }}>
                ★ FIXADAS
              </div>
              {pinned.map((n) => (
                <NoteCard key={n.id} n={n} isDM={isDM} active={selected?.id === n.id} onClick={() => setSelectedId(n.id)} />
              ))}
              <div style={{ height: 6 }} />
            </>
          )}
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.4, color: "var(--t-text-faint)", padding: "0 8px 4px" }}>
            TODAS · {filtered.length}
          </div>
          {filtered.filter((n) => !n.pinned).map((n) => (
            <NoteCard key={n.id} n={n} isDM={isDM} active={selected?.id === n.id} onClick={() => setSelectedId(n.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="glass" style={{ padding: 22, borderRadius: 12, textAlign: "center", color: "var(--t-text-mute)", fontSize: 13 }}>
              Nenhuma nota encontrada
            </div>
          )}
        </div>

        {/* Editor column */}
        {selected && (
          <div className="glass-strong" style={{ borderRadius: 18, padding: 32, position: "sticky", top: 20, alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Pill color={selected.color}>{selected.category}</Pill>
                  {selected.visibility === "mestre" && <Pill color="#c25555">🔒 só do mestre</Pill>}
                  {selected.visibility === "jogador" && <Pill color="#6da5c8">privada</Pill>}
                  {selected.visibility === "todos" && <Pill color="#7ba85d">compartilhada</Pill>}
                </div>
                <h2 className="serif" style={{ fontSize: 32, fontWeight: 600, color: "var(--t-text)", margin: 0, lineHeight: 1.15 }}>
                  {selected.title}
                </h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, fontSize: 12, color: "var(--t-text-mute)" }}>
                  <span>{selected.campaign}</span>
                  <span style={{ width: 3, height: 3, background: "rgba(232,227,214,0.3)", borderRadius: "50%" }} />
                  <span>atualizada {selected.updated}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={iconBtn}><Icon name="star" size={14} style={{ color: selected.pinned ? "var(--t-accent-bright)" : "var(--t-text-mute)" }} /></button>
                <button style={iconBtn}><Icon name="edit" size={14} style={{ color: "rgba(232,227,214,0.7)" }} /></button>
                <button style={iconBtn}><Icon name="trash" size={14} style={{ color: "var(--t-text-mute)" }} /></button>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
              {selected.tags.map((t) => (
                <span key={t} className="mono" style={{
                  fontSize: 10.5, padding: "3px 9px", borderRadius: 999,
                  background: "rgba(255,245,220,0.05)", border: "1px solid rgba(218,180,120,0.18)",
                  color: "rgba(232,227,214,0.7)", letterSpacing: 0.4,
                }}>#{t}</span>
              ))}
            </div>

            <div style={{
              padding: "22px 26px", borderRadius: 14,
              background: "rgba(0,0,0,0.25)", border: "1px solid var(--t-border)",
              minHeight: 280,
            }}>
              <div className="serif" style={{
                fontSize: 16.5, lineHeight: 1.85, color: "var(--t-text-soft)",
                whiteSpace: "pre-wrap", letterSpacing: 0.1,
              }}>
                {selected.body}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Btn variant="ghost" size="sm" icon="chat">Comentar</Btn>
              <Btn variant="ghost" size="sm" icon="users">Compartilhar com a mesa</Btn>
              {isDM && <Btn variant="ghost" size="sm" icon="eye">Mostrar para 1 jogador</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const iconBtn = {
  width: 32, height: 32, borderRadius: 8,
  background: "rgba(255,245,220,0.04)", border: "1px solid var(--t-border)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const NoteCard = ({ n, active, onClick, isDM }) => (
  <div onClick={onClick} className="glass" style={{
    borderRadius: 14, padding: 16, cursor: "pointer",
    borderColor: active ? `${n.color}80` : "var(--t-border)",
    transform: active ? "translateX(4px)" : "translateX(0)",
    transition: "all 200ms",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: n.color, opacity: active ? 1 : 0.5 }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: 1.2, color: n.color, fontWeight: 700 }}>
          {n.category.toUpperCase()}
        </span>
        {n.visibility === "mestre" && isDM && <span style={{ fontSize: 10 }}>🔒</span>}
        {n.pinned && <Icon name="star" size={11} style={{ color: "var(--t-accent-bright)" }} />}
      </div>
      <span className="mono" style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{n.updated}</span>
    </div>
    <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--t-text)", marginBottom: 4, lineHeight: 1.2 }}>
      {n.title}
    </div>
    <div style={{ fontSize: 12, color: "rgba(232,227,214,0.6)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {n.excerpt}
    </div>
    {n.tags.length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
        {n.tags.slice(0, 3).map((t) => (
          <span key={t} className="mono" style={{
            fontSize: 9.5, padding: "1px 6px", borderRadius: 4,
            background: "rgba(255,245,220,0.04)", color: "var(--t-text-mute)",
          }}>#{t}</span>
        ))}
      </div>
    )}
  </div>
);

window.Notes = Notes;
