const App = () => {
  const [view, setView] = React.useState("dashboard");
  const [role, setRole] = React.useState("mestre");
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem("theme") || "default"; } catch { return "default"; }
  });
  const [viewport, setViewport] = React.useState(() => {
    return window.innerWidth < 768 ? "mobile" : "desktop";
  });
  const [activeCampaign, setActiveCampaign] = React.useState(null);
  const [diceOpen, setDiceOpen] = React.useState(false);

  React.useEffect(() => {
    if (!window.Auth?.getCurrentUser?.()) {
      window.Auth?.requireSession?.({ redirectTo: "index.html" });
    }
  }, []);

  React.useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDiceOpen((d) => !d);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  React.useEffect(() => {
    const onResize = () => setViewport(window.innerWidth < 768 ? "mobile" : "desktop");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDM = role === "mestre";
  const titles = {
    dashboard: { t: isDM ? "Mesa do Mestre" : "Sua Mesa", s: isDM ? "Visão geral das suas campanhas e jogadores" : "Suas campanhas e personagem", b: ["Vasteria"] },
    campaigns: { t: "Campanhas", s: isDM ? "Suas mesas e crônicas" : "Mesas em que você joga", b: ["Vasteria", "Mesas"] },
    character: { t: isDM ? "Ficha de Personagem" : "Minha Ficha", s: "Atributos, habilidades e inventário do personagem", b: ["Vasteria", "Fichas"] },
    players: { t: "Jogadores", s: "Aventureiros das suas mesas", b: ["Vasteria", "Pessoas"] },
    notes: { t: isDM ? "Caderno do Mestre" : "Minhas Anotações", s: isDM ? "Notas, NPCs, segredos e ganchos" : "Suas notas pessoais e compartilhadas", b: ["Vasteria", "Anotações"] },
    compendium: { t: "Compêndio", s: "Biblioteca de magias, monstros e regras", b: ["Vasteria", "Biblioteca"] },
    settings: { t: "Configurações", s: "Sua conta e personalização do site", b: ["Vasteria", "Configurações"] },
  };
  const tt = titles[view] || titles.dashboard;

  if (viewport === "mobile") {
    const { MobileDashboard, MobileCharacter, MobileCampaigns, MobileNotes, MobileCompendium } = window.MobileScreens;
    return (
      <>
        <MobileShell view={view} setView={setView} role={role}>
          {view === "dashboard" && <MobileDashboard setView={setView} role={role} />}
          {view === "character" && <MobileCharacter />}
          {view === "campaigns" && <MobileCampaigns />}
          {view === "notes" && <MobileNotes role={role} />}
          {view === "compendium" && <MobileCompendium />}
          {view === "players" && <MobileDashboard setView={setView} role={role} />}
        </MobileShell>
        <ThemeAnim theme={theme} />
      </>
    );
  }

  return (
    <div style={{ paddingLeft: 270, paddingRight: 22, paddingTop: 18, paddingBottom: 22, minHeight: "100vh" }}>
      <Sidebar
        view={view}
        setView={setView}
        openDice={() => setDiceOpen(true)}
        role={role}
        setRole={(r) => {
          setRole(r);
          if (r === "jogador" && view === "players") setView("dashboard");
        }}
      />
      <TopBar title={tt.t} subtitle={tt.s} breadcrumbs={tt.b} openDice={() => setDiceOpen(true)} role={role} />

      {view === "dashboard" && <Dashboard setView={setView} setActiveCampaign={setActiveCampaign} role={role} />}
      {view === "campaigns" && <Campaigns activeCampaign={activeCampaign} setActiveCampaign={setActiveCampaign} role={role} />}
      {view === "character" && <CharacterSheet role={role} />}
      {view === "players" && isDM && <Players setView={setView} />}
      {view === "notes" && <Notes role={role} />}
      {view === "compendium" && <Compendium />}
      {view === "settings" && <Settings role={role} theme={theme} setTheme={setTheme} />}

      <UI.DiceTray open={diceOpen} onClose={() => setDiceOpen(false)} />
      <ThemeAnim theme={theme} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
