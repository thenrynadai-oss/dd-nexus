/* =========================================================
   VASTERIA GATE — SHEET (FICHA)
   - RESTAURA a ficha clássica completa (atributos + treino + outros + magias)
   - Mantém persistência no nexus_db via auth.js (sem quebrar login/hub)
   - IDs antigos preservados: score-FOR, c-hp-cur etc.
   ========================================================= */

const ATTR = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];

const SKILLS_LIST = [
  { name: "Acrobacia", attr: "DES" },
  { name: "Adestrar Animais", attr: "SAB" },
  { name: "Arcanismo", attr: "INT" },
  { name: "Atletismo", attr: "FOR" },
  { name: "Atuação", attr: "CAR" },
  { name: "Enganação", attr: "CAR" },
  { name: "Furtividade", attr: "DES" },
  { name: "História", attr: "INT" },
  { name: "Intimidação", attr: "CAR" },
  { name: "Intuição", attr: "SAB" },
  { name: "Investigação", attr: "INT" },
  { name: "Medicina", attr: "SAB" },
  { name: "Natureza", attr: "INT" },
  { name: "Percepção", attr: "SAB" },
  { name: "Persuasão", attr: "CAR" },
  { name: "Prestidigitação", attr: "DES" },
  { name: "Religião", attr: "INT" },
  { name: "Sobrevivência", attr: "SAB" }
];

let currentUser = null;
let heroIdx = null;
let currentHero = null;

/* Debounce de persistência para não martelar o localStorage a cada tecla */
let _saveTimer = null;
function schedulePersist() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (!currentHero) return;
    try { Auth.updateHero(heroIdx, currentHero); } catch (e) { /* silent */ }
  }, 50);
}

/* Click sound local (micro) — mantém “game feel” mesmo sem depender de libs */
function playClickSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(280, audioCtx.currentTime + 0.09);
    gainNode.gain.setValueAtTime(0.045, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.095);
  } catch(e) {}
}

function setupTabBar() {
  const tabs = document.querySelectorAll("#sheet-tabs .tab-btn");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-tab");
      switchTab(id);
    });
  });
}

window.onload = () => {
  // Proteção de sessão
  try { Auth.requireSession("index.html"); } catch (e) { window.location.href = "index.html"; return; }

  currentUser = Auth.getCurrentUser();
  heroIdx = Auth.getCurrentHeroIndex();

  if (!currentUser || heroIdx === null || heroIdx === undefined) {
    window.location.href = "home.html";
    return;
  }
  heroIdx = parseInt(heroIdx, 10);

  if (!currentUser.heroes || !currentUser.heroes[heroIdx]) {
    window.location.href = "home.html";
    return;
  }

  currentHero = currentUser.heroes[heroIdx];
  if (!currentHero.dados) currentHero.dados = {};

  // Fundo e tema já são inicializados em themes.js/bg.js
  setupTabBar();
  carregarFicha();

  // Delegação de input para todos os campos (inclui elementos injetados)
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!el || !el.classList || !el.classList.contains("save-field")) return;

    saveData(el);

    const id = el.id || "";
    if (
      id.startsWith("score-") ||
      id === "c-prof" ||
      id.startsWith("train-") ||
      id.startsWith("other-") ||
      id.startsWith("prof-")
    ) {
      calcStats();
    }

    if (id === "spell-ability") calcSpells();
  });

  // Recalcula quando marcar checkbox (alguns browsers disparam "change" em vez de "input")
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el || !el.classList || !el.classList.contains("save-field")) return;

    saveData(el);

    const id = el.id || "";
    if (
      id.startsWith("prof-") ||
      id.startsWith("train-") ||
      id.startsWith("other-")
    ) {
      calcStats();
    }
  });

  // Feedback sonoro geral (botões/checkbox)
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t) return;
    if (t.tagName === "BUTTON" || t.type === "checkbox" || t.classList.contains("tab-btn")) {
      playClickSound();
    }
  });
};

function carregarFicha() {
  // Cabeçalho
  const name = (currentHero.nome || currentHero.dados["c-name"] || "---").toString();
  const player = (currentHero.player || currentHero.dados["c-player"] || "---").toString();

  document.getElementById("display-name").innerText = name.toUpperCase();
  document.getElementById("display-player").innerText = player.toUpperCase();

  if (currentHero.img) {
    document.getElementById("sheet-avatar").style.backgroundImage = `url(${currentHero.img})`;
  }

  gerarEstrutura();
  gerarGrimorio();


  // =========================
  // Stepper (atributos) — mantém estética glass
  // =========================
  document.querySelectorAll(".attr-step").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const attr = btn.getAttribute("data-attr");
      const step = parseInt(btn.getAttribute("data-step"), 10) || 0;
      const input = document.getElementById(`score-${attr}`);
      if(!input) return;
      let v = parseInt(input.value || "10", 10);
      if(Number.isNaN(v)) v = 10;
      v = Math.max(1, Math.min(30, v + step));
      input.value = String(v);
      input.dispatchEvent(new Event("input", { bubbles:true }));
      input.dispatchEvent(new Event("change", { bubbles:true }));
    });
  });


  // Hidratar inputs com dados salvos
  Object.keys(currentHero.dados).forEach((k) => {
    const el = document.getElementById(k);
    if (!el) return;
    if (el.type === "checkbox") el.checked = !!currentHero.dados[k];
    else el.value = currentHero.dados[k];
  });

  // Garantir defaults sensatos
  if (!document.getElementById("c-prof").value) document.getElementById("c-prof").value = "+2";
  ATTR.forEach((a) => {
    const node = document.getElementById(`score-${a}`);
    if (node && (node.value === "" || node.value === null || node.value === undefined)) node.value = 10;
  });

  // =========================
  // Editar personagem (nome + jogador + foto) — modal glass
  // =========================
  const heroEditModal = document.getElementById("hero-edit-modal");
  const heroEditOpen = document.getElementById("edit-hero-btn");
  const heroEditClose = document.getElementById("hero-edit-close");
  const heroEditCancel = document.getElementById("hero-edit-cancel");
  const heroEditSave = document.getElementById("hero-edit-save");
  const heroEditPick = document.getElementById("hero-edit-pick");
  const heroEditClear = document.getElementById("hero-edit-clear");
  const heroEditFile = document.getElementById("hero-edit-file");
  const heroEditName = document.getElementById("hero-edit-name");
  const heroEditPlayer = document.getElementById("hero-edit-player");
  const heroEditPreview = document.getElementById("hero-edit-preview");

  let pendingAvatar = null;

  function openHeroEdit(){
    if(!heroEditModal) return;
    heroEditName.value = currentHero.nome || "";
    heroEditPlayer.value = currentHero.jogador || "";
    pendingAvatar = null;
    const img = currentHero.img || "";
    heroEditPreview.style.backgroundImage = img ? `url(${img})` : "none";
    heroEditModal.classList.add("open");
  }
  function closeHeroEdit(){
    if(!heroEditModal) return;
    heroEditModal.classList.remove("open");
  }
  if(heroEditOpen) heroEditOpen.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); openHeroEdit(); });
  if(heroEditClose) heroEditClose.addEventListener("click", (e)=>{ e.preventDefault(); closeHeroEdit(); });
  if(heroEditCancel) heroEditCancel.addEventListener("click", (e)=>{ e.preventDefault(); closeHeroEdit(); });
  if(heroEditModal) heroEditModal.addEventListener("click", (e)=>{ if(e.target===heroEditModal) closeHeroEdit(); });

  if(heroEditPick){
    heroEditPick.addEventListener("click", (e)=>{
      e.preventDefault();
      heroEditFile && heroEditFile.click();
    });
  }
  if(heroEditFile){
    heroEditFile.addEventListener("change", async ()=>{
      const f = heroEditFile.files && heroEditFile.files[0];
      if(!f) return;
      if(!f.type.startsWith("image/")) return;
      const maxBytes = 1.5 * 1024 * 1024;
      const file = (f.size <= maxBytes) ? f : f; // compress below
      const dataUrl = await (async ()=>{
        // compress via canvas
        const img = new Image();
        const p = new Promise((res, rej)=>{ img.onload=()=>res(); img.onerror=rej; });
        img.src = URL.createObjectURL(file);
        await p;
        const cvs = document.createElement("canvas");
        const ctx = cvs.getContext("2d");
        const max = 512;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        cvs.width = Math.max(1, Math.round(img.width*scale));
        cvs.height = Math.max(1, Math.round(img.height*scale));
        ctx.drawImage(img,0,0,cvs.width,cvs.height);
        URL.revokeObjectURL(img.src);
        return cvs.toDataURL("image/webp", 0.85);
      })();
      pendingAvatar = dataUrl;
      heroEditPreview.style.backgroundImage = `url(${dataUrl})`;
    });
  }

  if(heroEditClear){
    heroEditClear.addEventListener("click", (e)=>{
      e.preventDefault();
      pendingAvatar = "";
      heroEditPreview.style.backgroundImage = "none";
      if(heroEditFile) heroEditFile.value = "";
    });
  }

  function persistHeroProfile(){
    // Atualiza display no topo
    const dn = document.getElementById("display-name");
    const dp = document.getElementById("display-player");
    const av = document.getElementById("sheet-avatar");
    if(dn) dn.textContent = currentHero.nome || "Personagem";
    if(dp) dp.textContent = currentHero.jogador || "Jogador";
    if(av) av.style.backgroundImage = currentHero.img ? `url(${currentHero.img})` : "none";
  }

  if(heroEditSave){
    heroEditSave.addEventListener("click", (e)=>{
      e.preventDefault();
      const newName = (heroEditName.value || "").trim();
      const newPlayer = (heroEditPlayer.value || "").trim();
      if(newName) currentHero.nome = newName;
      if(newPlayer) currentHero.jogador = newPlayer;
      if(pendingAvatar !== null){
        currentHero.img = pendingAvatar || "";
      }
      persistHeroProfile();
      salvarHero();
      closeHeroEdit();
    });
  }



  calcStats();
  calcSpells();
}

function gerarEstrutura() {
  const attrCont = document.getElementById("attr-container");
  attrCont.innerHTML = "";

  ATTR.forEach((a) => {
    attrCont.innerHTML += `
      <div class="attr-row">
        <span style="font-weight:900; font-size:14px">${a}</span>
        <input id="score-${a}" class="attr-val save-field" value="10" type="number">
        <span id="mod-${a}" class="attr-mod">+0</span>
      </div>
    `;
  });

  const saveCont = document.getElementById("saves-container");
  saveCont.innerHTML = `
    <div class="skill-header-row">
      <span></span><span class="text-left">NOME</span><span>ATR</span><span>PROF</span><span>BÔNUS</span><span>TREINO</span><span>OUTRO</span>
    </div>
  `;

  ATTR.forEach((a) => {
    saveCont.innerHTML += `
      <div class="skill-row-pro">
        <button class="skill-icon-btn" type="button" onclick="rollSkill('Salvaguarda ${a}', 'total-save-${a}')">
          <svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg>
        </button>
        <div class="skill-name-pro">Salvaguarda</div>
        <div class="skill-attr-display">(${a})</div>
        <input type="checkbox" id="prof-save-${a}" class="prof-check save-field">
        <div id="total-save-${a}" class="skill-total-display">+0</div>
        <input type="number" id="train-save-${a}" class="skill-input-line save-field" placeholder="0">
        <input type="number" id="other-save-${a}" class="skill-input-line save-field" placeholder="0">
      </div>
    `;
  });

  const skillCont = document.getElementById("skills-container");
  skillCont.innerHTML = `
    <div class="skill-header-row">
      <span></span><span class="text-left">NOME</span><span>ATR</span><span>PROF</span><span>BÔNUS</span><span>TREINO</span><span>OUTRO</span>
    </div>
  `;

  SKILLS_LIST.forEach((s) => {
    const idName = s.name.replace(/\s+/g, "-").toLowerCase();
    skillCont.innerHTML += `
      <div class="skill-row-pro">
        <button class="skill-icon-btn" type="button" onclick="rollSkill('${s.name}', 'total-skill-${idName}')">
          <svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg>
        </button>
        <div class="skill-name-pro">${s.name}</div>
        <div class="skill-attr-display">(${s.attr})</div>
        <input type="checkbox" id="prof-skill-${idName}" class="prof-check save-field">
        <div id="total-skill-${idName}" class="skill-total-display">+0</div>
        <input type="number" id="train-skill-${idName}" class="skill-input-line save-field" placeholder="0">
        <input type="number" id="other-skill-${idName}" class="skill-input-line save-field" placeholder="0">
      </div>
    `;
  });
}

function gerarGrimorio() {
  const spellsArea = document.getElementById("spells-area");
  spellsArea.innerHTML = "";

  spellsArea.innerHTML += `
    <div class="spell-level-block">
      <div class="sl-header">
        <span class="sl-title">TRUQUES (NÍVEL 0)</span>
      </div>
      <textarea id="spells-0" class="clean-area save-field" style="min-height:150px;" placeholder="Lista de Truques..."></textarea>
    </div>
  `;

  for (let i = 1; i <= 9; i++) {
    spellsArea.innerHTML += `
      <div class="spell-level-block">
        <div class="sl-header">
          <span class="sl-title">NÍVEL ${i}</span>
          <div class="sl-slots">
            TOTAL: <input id="slots-total-${i}" class="save-field" placeholder="0">
            GASTOS: <input id="slots-exp-${i}" class="save-field" placeholder="0">
          </div>
        </div>
        <textarea id="spells-${i}" class="clean-area save-field" style="min-height:150px;" placeholder="Magias preparadas..."></textarea>
      </div>
    `;
  }
}

function calcStats() {
  const mods = {};
  const profBonus = parseInt(document.getElementById("c-prof").value, 10) || 2;

  // Mods
  ATTR.forEach((a) => {
    const val = parseInt(document.getElementById(`score-${a}`).value, 10) || 10;
    const mod = Math.floor((val - 10) / 2);
    mods[a] = mod;
    const txt = mod >= 0 ? `+${mod}` : `${mod}`;
    const node = document.getElementById(`mod-${a}`);
    if (node) node.innerText = txt;
  });

  // Salvaguardas
  ATTR.forEach((a) => {
    const isProf = document.getElementById(`prof-save-${a}`).checked;
    const train = parseInt(document.getElementById(`train-save-${a}`).value, 10) || 0;
    const other = parseInt(document.getElementById(`other-save-${a}`).value, 10) || 0;
    const total = mods[a] + (isProf ? profBonus : 0) + train + other;
    const node = document.getElementById(`total-save-${a}`);
    if (node) node.innerText = total >= 0 ? `+${total}` : `${total}`;
  });

  // Perícias
  SKILLS_LIST.forEach((s) => {
    const idName = s.name.replace(/\s+/g, "-").toLowerCase();
    const isProf = document.getElementById(`prof-skill-${idName}`).checked;
    const train = parseInt(document.getElementById(`train-skill-${idName}`).value, 10) || 0;
    const other = parseInt(document.getElementById(`other-skill-${idName}`).value, 10) || 0;
    const total = mods[s.attr] + (isProf ? profBonus : 0) + train + other;

    const node = document.getElementById(`total-skill-${idName}`);
    if (node) node.innerText = total >= 0 ? `+${total}` : `${total}`;

    // Passivas
    if (s.name === "Percepção") {
      const p = document.getElementById("pas-perc");
      if (p) p.value = 10 + total;
    }
    if (s.name === "Investigação") {
      const p = document.getElementById("pas-inv");
      if (p) p.value = 10 + total;
    }
    if (s.name === "Intuição") {
      const p = document.getElementById("pas-ins");
      if (p) p.value = 10 + total;
    }
  });

  calcSpells();
}

function calcSpells() {
  const abilityEl = document.getElementById("spell-ability");
  if (!abilityEl) return;

  const ability = abilityEl.value;
  const modEl = document.getElementById(`mod-${ability}`);
  const mod = modEl ? parseInt(modEl.innerText, 10) : 0;

  const prof = parseInt(document.getElementById("c-prof").value, 10) || 2;
  const dc = 8 + mod + prof;
  const atk = mod + prof;

  const dcEl = document.getElementById("spell-dc");
  const atkEl = document.getElementById("spell-atk");
  if (dcEl) dcEl.innerText = dc;
  if (atkEl) atkEl.innerText = atk >= 0 ? `+${atk}` : `${atk}`;
}

/* Rolagem rápida */
function rollSkill(name, elementId) {
  playClickSound();

  const totalText = (document.getElementById(elementId)?.innerText || "0").toString();
  const bonus = parseInt(totalText, 10) || 0;

  const d20 = Math.floor(Math.random() * 20) + 1;
  const final = d20 + bonus;

  const modal = document.getElementById("quickroll-modal");
  const resultVal = document.getElementById("roll-result-val");
  const d20Number = document.getElementById("d20-number");

  if (modal) modal.style.display = "flex";
  if (resultVal) resultVal.innerText = final;
  if (d20Number) d20Number.innerText = d20;

  let detail = `${name}: 🎲(${d20}) + ${bonus}`;
  if (d20 === 20) {
    detail = "CRÍTICO! " + detail;
    if (resultVal) resultVal.style.color = "#ffd700";
  } else if (d20 === 1) {
    detail = "FALHA CRÍTICA! " + detail;
    if (resultVal) resultVal.style.color = "#ff4444";
  } else {
    if (resultVal) resultVal.style.color = "var(--accent)";
  }

  const detailEl = document.getElementById("roll-result-detail");
  if (detailEl) detailEl.innerText = detail;
}

/* Persistência */
function saveData(el) {
  if (!currentHero) return;
  if (!currentHero.dados) currentHero.dados = {};

  currentHero.dados[el.id] = el.type === "checkbox" ? !!el.checked : el.value;

  // Sync leve para o HUB (campanha vem do input)
  if (el.id === "c-campaign") currentHero.campaign = el.value;

  schedulePersist();
}

/* Navegação */
function voltarParaHome() {
  window.location.href = "home.html";
}

function switchTab(id) {
  playClickSound();

  // troca visual
  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
  const target = document.getElementById(id);
  if (target) target.style.display = "block";

  // ativa botão
  document.querySelectorAll("#sheet-tabs .tab-btn").forEach((b) => b.classList.remove("active"));
  const btn = document.querySelector(`#sheet-tabs .tab-btn[data-tab="${id}"]`);
  if (btn) btn.classList.add("active");
}

/* Expor funções usadas por onclick/injeção */
window.rollSkill = rollSkill;
window.calcSpells = calcSpells;
window.voltarParaHome = voltarParaHome;
window.switchTab = switchTab;
