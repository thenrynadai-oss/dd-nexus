/* =========================================================
   VASTERIA GATE — THEMES ENGINE (UM ARQUIVO PRA TUDO)
   - NÃO remove recursos antigos: mantém painél slide + adiciona modal.
   - Corrige: modal não fecha ao clicar tema
   - Corrige: scroll chega no último tema (Aura do Amanhecer incluso)
   - Inclui: som ao selecionar (WebAudio, sem arquivos)
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "vasteria_theme";
  const MUTE_KEY = "vasteria_mute";
  // salva o "grupo" do tema para aplicar overlay/skin cedo (evita flicker ao trocar de aba)
  const STORAGE_KIND_KEY = "vasteria_theme_kind";
  const DEFAULT_THEME = "coffee_caramel";

  /** Lista de temas. Regra: NÃO remover nenhum — só rework/adição. */
  const VASTERIA_THEMES = [
    // ==== Existentes (rework) ====
    { id:"coffee_caramel",  name:"Café & Caramelo", badge:"LOW POLY", kind:"lowpoly", preview:"caramel",  desc:"Cafeteria low poly viva: vapor, pessoas passando, luz quente." },
    { id:"coffee",   name:"Taverna do Café", badge:"MINIMAL",  kind:"minimal", preview:"coffee",   desc:"Taverna discreta, madeira, luz âmbar — clean e elegante." },
    { id:"master",   name:"Tema do Mestre",  badge:"MINIMAL",  kind:"minimal", preview:"master",   desc:"Trono vermelho veludo com ouro — vibe de autoridade." },
    { id:"arcane",   name:"Arcano",          badge:"MINIMAL",  kind:"minimal", preview:"arcane",   desc:"Runas e energia mística — magia que pulsa ao fundo." },
    { id:"stellar",  name:"Estelar",         badge:"MINIMAL",  kind:"minimal", preview:"stellar",  desc:"Cosmos roxo profundo — estrelas em parallax." },
    { id:"might",    name:"Poder & Sangue",  badge:"MINIMAL",  kind:"minimal", preview:"barbarian",desc:"Vermelho agressivo — para guerreiros e arena." },
    { id:"stealth",  name:"Sombra Verde",    badge:"MINIMAL",  kind:"minimal", preview:"stealth",  desc:"Furtividade e neon verde — hacker/ladino." },
    { id:"wild",     name:"Selva Viva",      badge:"MINIMAL",  kind:"minimal", preview:"ranger",   desc:"Verde natural — spores animadas, vibe druid." },

    // ==== Especiais pedidos ====
    { id:"aura",     name:"Aura do Amanhecer", badge:"SPECIAL", kind:"minimal", preview:"aura", desc:"Galáxias e aurora dourada — estrelas, poeira cósmica." },
    { id:"cthulhu",  name:"Sussurros de Cthulhu", badge:"LOW POLY", kind:"lowpoly", preview:"cthulhu", desc:"Abismo verde, tentáculos e bolhas — horror elegante." },

    // ==== 7 classes D&D (novos) ====
    // "CLASSE" = vivo e premium, mas NÃO low poly (pedido).
    { id:"paladin",    name:"Paladino Solar",  badge:"CLASS", kind:"classe", preview:"paladin", desc:"Ouro sagrado + preto — proteção e honra." },
    { id:"cleric",     name:"Clérigo Celeste", badge:"CLASS", kind:"classe", preview:"cleric",  desc:"Azul claro e luz divina — clean e confortável." },
    { id:"bard",       name:"Bardo Neon",      badge:"CLASS", kind:"classe", preview:"bard",    desc:"Rosa/púrpura — show, ritmo e brilho." },
    { id:"monk",       name:"Monge Zen",       badge:"CLASS", kind:"classe", preview:"monk",    desc:"Verde suave — calma e foco." },
    { id:"barbarian",  name:"Bárbaro do Norte",badge:"CLASS", kind:"classe", preview:"barbarian",desc:"Fogo e fúria — texturas duras." },
    { id:"ranger",     name:"Rastreador",      badge:"CLASS", kind:"classe", preview:"ranger",  desc:"Floresta e caça — verde profundo." },
    { id:"warlock",    name:"Pacto Sombrio",   badge:"CLASS", kind:"classe", preview:"warlock", desc:"Roxo e trevas — pacto arcano." },

    // ==== SECRET (skins pesadas: bordas + overlays) ====
    // Aparece em "Todos" e também tem filtro próprio.
    { id:"secret_obsidian", name:"Obsidiana Proibida", badge:"SECRET", kind:"secret", preview:"secret_obsidian", desc:"Skin pesada: vinheta, noise, bordas fortes — vibe obsidian." },
    { id:"secret_bloodmoon", name:"Lua de Sangue", badge:"SECRET", kind:"secret", preview:"secret_bloodmoon", desc:"Glow vermelho + sombra — overlay intenso e bordas agressivas." },
    { id:"secret_abyss", name:"Abyssal", badge:"SECRET", kind:"secret", preview:"secret_abyss", desc:"Abismo roxo/azul — textura profunda, contraste e moldura arcana." },

    // ==== 10 novos temas (metade lowpoly / metade minimal) ====
    { id:"bonfire",   name:"Fogueira dos Mortos", badge:"LOW POLY", kind:"lowpoly", preview:"bonfire", desc:"Fogueira estilo souls — brasa, faísca e cinza." },
    { id:"viking",    name:"Fiorde Viking",       badge:"LOW POLY", kind:"lowpoly", preview:"viking",  desc:"Montanhas low poly + aurora — neve e vento." },
    { id:"pirate",    name:"Maré Pirata",         badge:"LOW POLY", kind:"lowpoly", preview:"pirate",  desc:"Navio e ondas — mar vivo, céu tempestuoso." },
    { id:"samurai",   name:"Dojo do Samurai",     badge:"LOW POLY", kind:"lowpoly", preview:"samurai", desc:"Luz dourada + sombras — disciplina e aço." },
    { id:"desert",    name:"Caravana do Deserto", badge:"LOW POLY", kind:"lowpoly", preview:"desert",  desc:"Dunas low poly — poeira e calor animado." },

    { id:"frost",     name:"Gelo Cristal",        badge:"MINIMAL", kind:"minimal", preview:"frost",    desc:"Azul gelo, partículas de neve — bem clean." },
    { id:"noir",      name:"Cyber Noir",          badge:"MINIMAL", kind:"minimal", preview:"noir",     desc:"Preto e azul — minimal, futurista." },
    { id:"clockwork", name:"Engrenagens",         badge:"MINIMAL", kind:"minimal", preview:"clockwork",desc:"Bronze e sombra — vibe steampunk." },
    { id:"sunset",    name:"Sunset Drive",        badge:"MINIMAL", kind:"minimal", preview:"sunset",   desc:"Rosa/laranja — pôr do sol estilizado." },
    { id:"classic",   name:"Clássico",            badge:"MINIMAL", kind:"minimal", preview:"classic",  desc:"Preto e branco — ultra neutro." },
  ];

  // expõe lista caso você queira usar em outros scripts
  window.VASTERIA_THEMES = VASTERIA_THEMES;

  // -----------------------------
  // Áudio: "ping" ao selecionar (sem arquivos)
  // -----------------------------
  let audioCtx = null;
  function playSelectSound(){
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.07);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.14);
    }catch(err){
      // silêncio se browser bloquear
    }
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => [...el.querySelectorAll(sel)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function getStoredTheme(){
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  }

  function getStoredKind(){
    return localStorage.getItem(STORAGE_KIND_KEY) || "minimal";
  }

  function setStoredTheme(id){
    localStorage.setItem(STORAGE_KEY, id);
    const t = VASTERIA_THEMES.find(x => x.id === id);
    const kind = (t && t.kind) ? t.kind : "minimal";
    localStorage.setItem(STORAGE_KIND_KEY, kind);
  }

  function isValidTheme(id){
    return VASTERIA_THEMES.some(t => t.id === id);
  }

  function applyTheme(id, {silent=false} = {}){
    const theme = isValidTheme(id) ? id : DEFAULT_THEME;
    const meta = VASTERIA_THEMES.find(t => t.id === theme);
    const kind = meta?.kind || "minimal";

    document.documentElement.setAttribute("data-theme-switching","1");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme-group", kind);
    document.body && document.body.setAttribute("data-theme", theme);
    document.body && document.body.setAttribute("data-theme-group", kind);
    // remove lock after paint
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.removeAttribute("data-theme-switching");
    }));
    setStoredTheme(theme);

    if(!silent) playSelectSound();

    // avisa BG engine e qualquer outro ouvinte
    window.dispatchEvent(new CustomEvent("vasteria:theme", { detail: { theme } }));

    // sincroniza label (se existir)
    qsa(".current-theme-label").forEach(el => el.textContent = getThemeName(theme));
  }

  // ---------------------------------------------------------
  // Mute do som ambiente do tema (bg.js)
  // ---------------------------------------------------------
  function getMuted(){
    return localStorage.getItem(MUTE_KEY) === "1";
  }
  function setMuted(m){
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    window.dispatchEvent(new CustomEvent("vasteria:mute", { detail: { muted: !!m } }));
  }
  function syncMuteBtn(){
    const btn = qs('#theme-mute-btn');
    if(!btn) return;
    const m = getMuted();
    btn.textContent = m ? '🔇' : '🔊';
    btn.title = m ? 'Som do tema: mutado' : 'Som do tema: ligado';
  }

  function getThemeName(id){
    const t = VASTERIA_THEMES.find(x => x.id === id);
    return t ? t.name : "Tema";
  }

  // =========================================================
  // LEGACY: painel slide (mantido)
  // =========================================================
  function initLegacyPanel(){
    const dock = qs(".dock-trigger-large");
    const panel = qs(".theme-panel");

    if(dock && panel){
      dock.addEventListener("click", () => panel.classList.toggle("active"));
      // fecha ao clicar fora
      document.addEventListener("click", (e) => {
        if(!panel.classList.contains("active")) return;
        if(panel.contains(e.target) || dock.contains(e.target)) return;
        panel.classList.remove("active");
      });

      // Se existir itens legacy já no HTML, só conecta
      qsa(".theme-item", panel).forEach(item => {
        const tid = item.getAttribute("data-theme");
        item.addEventListener("click", () => applyTheme(tid));
      });
    }
  }

  // =========================================================
  // MODAL: Seletor (novo)
  // =========================================================
  function ensureModalMarkup(){
    let modal = qs("#theme-modal");
    if(modal) return modal;

    modal = document.createElement("div");
    modal.id = "theme-modal";
    modal.className = "theme-modal";
    modal.innerHTML = `
      <div class="theme-modal-card" role="dialog" aria-modal="true" aria-label="Seletor de temas">
        <div class="theme-modal-topbar">
          <div class="theme-modal-back" id="theme-modal-back" title="Voltar">←</div>
          <div class="theme-modal-title">
            <h3>SELETOR DE TEMAS</h3>
            <p>Escolha o estilo visual do Vasteria Gate</p>
          </div>
          <div style="flex:1"></div>
          <div style="display:flex;gap:10px;align-items:center">
            <span class="current-theme-label" style="font-size:12px;color:rgba(255,255,255,0.65)"></span>
            <button class="btn-ghost" id="theme-mute-btn" type="button" title="Som do tema">🔊</button>
          </div>
        </div>

        <div class="theme-modal-body">
          <div class="theme-list-pane">
            <div class="theme-searchbar">
              <input id="theme-search" type="text" placeholder="Buscar tema... (ex: café, aura, cthulhu)" />
              <select id="theme-filter">
                <option value="all">Todos</option>
                <option value="minimal">Minimal</option>
                <option value="lowpoly">Low Poly</option>
                <option value="classe">Classe</option>
                <option value="secret">Secret</option>
                <option value="special">Special</option>
              </select>
            </div>
            <div class="theme-grid-wrap" id="theme-grid-wrap">
              <div class="theme-grid" id="theme-grid"></div>
            </div>
          </div>

          <div class="theme-preview-pane">
            <div class="theme-preview-hero">
              <div class="big-preview" id="big-preview"></div>
              <div class="theme-preview-info">
                <div class="t">
                  <strong id="big-name">Tema</strong>
                  <span id="big-desc">Escolha um tema para ver detalhes.</span>
                </div>
                <span class="theme-badge" id="big-badge">—</span>
              </div>
            </div>
            <button class="apply-btn" id="apply-theme-btn">SELECIONAR TEMA</button>
            <div style="font-size:12px;color:rgba(255,255,255,0.60);line-height:1.5">
              Dica: clique em um tema para habilitar o botão azul.<br/>
              O modal não fecha sozinho — você escolhe quando voltar.
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(syncMuteBtn, 0);
    return modal;
  }

  function buildThemeCards(modal){
    const grid = qs("#theme-grid", modal);
    const wrap = qs("#theme-grid-wrap", modal);
    if(!grid || !wrap) return;

    const current = getStoredTheme();
    const search = qs("#theme-search", modal);
    const filter = qs("#theme-filter", modal);

    function getFiltered(){
      const q = (search?.value || "").trim().toLowerCase();
      const f = filter?.value || "all";

      return VASTERIA_THEMES.filter(t => {
        const matchText = !q || (t.name.toLowerCase().includes(q) || t.id.includes(q));
        const kind = t.kind || "minimal";
        const badge = (t.badge || "").toLowerCase();

        let matchFilter = true;
        if(f === "minimal") matchFilter = kind === "minimal";
        else if(f === "lowpoly") matchFilter = kind === "lowpoly";
        else if(f === "classe") matchFilter = kind === "classe";
        else if(f === "secret") matchFilter = kind === "secret";
        else if(f === "special") matchFilter = badge.includes("special");

        return matchText && matchFilter;
      });
    }

    function render(){
      const list = getFiltered();
      grid.innerHTML = "";
      for(const t of list){
        const card = document.createElement("div");
        card.className = "theme-card";
        card.setAttribute("data-theme-id", t.id);
        if(t.id === current) card.classList.add("selected");

        card.innerHTML = `
          <div class="theme-thumb">
            <div class="theme-preview" data-preview="${t.preview || t.id}"></div>
          </div>
          <div class="theme-meta">
            <div class="theme-name">
              <span>${t.name}</span>
              <span class="theme-badge">${t.badge || "THEME"}</span>
            </div>
            <button class="theme-select-btn" type="button">Selecionar tema</button>
          </div>
        `;

        // click seleciona (não fecha modal!)
        card.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectCard(t.id);
        });

        // botão azul dentro do card aplica (não fecha modal)
        const btn = card.querySelector(".theme-select-btn");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          applyTheme(t.id);
          markCurrent(t.id);
        });

        grid.appendChild(card);
      }

      // garante que se a lista ficar curta, ainda dá scroll bonitinho
      wrap.style.paddingBottom = "70px";
    }

    function markCurrent(themeId){
      // marca o tema atual como "selected" e mantém seleção visível
      qsa(".theme-card", grid).forEach(c => {
        c.classList.toggle("selected", c.getAttribute("data-theme-id") === themeId);
      });
    }

    function selectCard(themeId){
      const t = VASTERIA_THEMES.find(x => x.id === themeId);
      if(!t) return;

      // marca seleção visual
      qsa(".theme-card", grid).forEach(c => c.classList.toggle("selected", c.getAttribute("data-theme-id") === themeId));

      // atualiza preview lado direito
      const bigPrev = qs("#big-preview", modal);
      const bigName = qs("#big-name", modal);
      const bigDesc = qs("#big-desc", modal);
      const bigBadge = qs("#big-badge", modal);
      const applyBtn = qs("#apply-theme-btn", modal);

      if(bigPrev) bigPrev.innerHTML = `<div class="theme-preview" data-preview="${t.preview || t.id}" style="position:absolute;inset:0"></div>`;
      if(bigName) bigName.textContent = t.name;
      if(bigDesc) bigDesc.textContent = t.desc || "";
      if(bigBadge) bigBadge.textContent = t.badge || "THEME";

      // botão do painel direito aplica o tema selecionado
      if(applyBtn){
        applyBtn.disabled = false;
        applyBtn.textContent = "SELECIONAR TEMA";
        applyBtn.onclick = () => {
          applyTheme(themeId);
          markCurrent(themeId);
        };
      }
    }

    // listeners de busca/filtro
    if(search) search.addEventListener("input", render);
    if(filter) filter.addEventListener("change", render);

    render();
    // seleciona preview inicial
    selectCard(current);
  }

  function openModal(){
    const modal = ensureModalMarkup();
    modal.classList.add("active");

    // label tema atual
    qsa(".current-theme-label").forEach(el => el.textContent = getThemeName(getStoredTheme()));

    // build cards (idempotente)
    buildThemeCards(modal);

    // sincroniza mute
    syncMuteBtn();

    // foco no input
    const search = qs("#theme-search", modal);
    if(search) setTimeout(() => search.focus(), 40);
  }

  function closeModal(){
    const modal = qs("#theme-modal");
    if(modal) modal.classList.remove("active");
  }

  function initModal(){
    const modal = ensureModalMarkup();
    const card = qs(".theme-modal-card", modal);
    const back = qs("#theme-modal-back", modal);

    // clique fora fecha (mas clique no card NÃO fecha)
    modal.addEventListener("click", () => closeModal());
    if(card) card.addEventListener("click", (e) => e.stopPropagation());

    // seta voltar
    if(back) back.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });

    // ESC fecha
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && modal.classList.contains("active")) closeModal();
    });

    // conexões: qualquer botão com [data-action="open-themes"] abre
    qsa('[data-action="open-themes"]').forEach(btn => btn.addEventListener("click", (e)=>{ e.preventDefault(); openModal(); }));

    // conexões extras (por compat): ids comuns
    const idCandidates = ["open-themes","btn-temas","themeButton","themesButton","openThemes"];
    idCandidates.forEach(id => {
      const el = qs("#"+id);
      if(el) el.addEventListener("click", (e)=>{ e.preventDefault(); openModal(); });
    });

    // classe comum
    qsa(".open-themes").forEach(btn => btn.addEventListener("click", (e)=>{ e.preventDefault(); openModal(); }));

    // botão mute (som ambiente do tema)
    const muteBtn = qs('#theme-mute-btn', modal);
    if(muteBtn){
      muteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMuted(!getMuted());
        syncMuteBtn();
      });
      syncMuteBtn();
    }
  }

  // =========================================================
  // Init
  // =========================================================
  function init(){
    initLegacyPanel();
    initModal();
    applyTheme(getStoredTheme(), {silent:true});
  }

  window.Theme = {
    init,
    open: openModal,
    close: closeModal,
    apply: applyTheme,
    get: getStoredTheme,
    list: () => [...VASTERIA_THEMES],
    getName: getThemeName,
  };

  // auto-init quando DOM pronto
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
