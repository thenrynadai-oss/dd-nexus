const ATTR = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];
const SKILLS_LIST = [
    { name: "Acrobacia", attr: "DES" }, { name: "Adestrar Animais", attr: "SAB" }, { name: "Arcanismo", attr: "INT" },
    { name: "Atletismo", attr: "FOR" }, { name: "Atuação", attr: "CAR" }, { name: "Enganação", attr: "CAR" },
    { name: "Furtividade", attr: "DES" }, { name: "História", attr: "INT" }, { name: "Intimidação", attr: "CAR" },
    { name: "Intuição", attr: "SAB" }, { name: "Investigação", attr: "INT" }, { name: "Medicina", attr: "SAB" },
    { name: "Natureza", attr: "INT" }, { name: "Percepção", attr: "SAB" }, { name: "Persuasão", attr: "CAR" },
    { name: "Prestidigitação", attr: "DES" }, { name: "Religião", attr: "INT" }, { name: "Sobrevivência", attr: "SAB" }
];

let users = JSON.parse(localStorage.getItem('nexus_db')) || [];
let currentUser = null;
let heroIdx = null;

const THEME_CATALOG = [
    { id: "caramel", label: "CAFÉ & CARAMELO", p: { bgApp:"#2A1B15", bgPanel:"#2d1e19", accent:"#FFB347", glow:"rgba(255,179,71,0.55)" } },
    { id: "coffee", label: "TAVERNA", p: { bgApp:"#1F1612", bgPanel:"#3e2f26", accent:"#D4A373", glow:"rgba(212,163,115,0.45)" } },
    { id: "master", label: "MESTRE", p: { bgApp:"#0f0202", bgPanel:"#1e0505", accent:"#FFD700", glow:"rgba(255,215,0,0.40)" } },
    { id: "arcane", label: "ARCANO", p: { bgApp:"#120926", bgPanel:"#190f32", accent:"#D8B4FE", glow:"rgba(167,139,250,0.65)" } },
    { id: "stellar", label: "ESTELAR", p: { bgApp:"#000205", bgPanel:"#050a14", accent:"#00F3FF", glow:"rgba(0,243,255,0.70)" } },
    { id: "might", label: "GUERREIRO", p: { bgApp:"#220505", bgPanel:"#320a0a", accent:"#ef4444", glow:"rgba(239,68,68,0.55)" } },
    { id: "stealth", label: "LADINO", p: { bgApp:"#020617", bgPanel:"#021914", accent:"#10b981", glow:"rgba(16,185,129,0.45)" } },
    { id: "wild", label: "DRUIDA", p: { bgApp:"#051a05", bgPanel:"#0a230a", accent:"#84cc16", glow:"rgba(132,204,22,0.45)" } },
    { id: "classic", label: "CLÁSSICO", p: { bgApp:"#0b0b0f", bgPanel:"#0f0f14", accent:"#ffffff", glow:"rgba(255,255,255,0.22)" } },
    { id: "aura-amanhecer", label: "AURA DO AMANHECER", p: { bgApp:"#000205", bgPanel:"#0a0c19", accent:"#3B82F6", glow:"rgba(59,130,246,0.65)" } },
];

let _dockWasDisabled = false;

window.onload = () => {
    const savedTheme = localStorage.getItem('vasteria_theme');
    if(savedTheme) setTheme(savedTheme);

    const session = localStorage.getItem('nexus_session');
    const hIdx = localStorage.getItem('nexus_current_hero_idx');
    if(!session || hIdx === null) { window.location.href = 'index.html'; return; }
    currentUser = users.find(u => u.email === session);
    heroIdx = parseInt(hIdx);
    if(!currentUser || !currentUser.heroes[heroIdx]) { window.location.href = 'index.html'; return; }
    
    carregarFicha();
    setupAudio();
    ensureThemeModal();

    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('save-field')) {
            saveData(e.target);
            if(e.target.id.startsWith('score-') || e.target.id === 'c-prof' || 
               e.target.id.startsWith('train-') || e.target.id.startsWith('other-') || 
               e.target.id.startsWith('prof-')) {
                calcStats();
            }
        }
    });

    window.addEventListener('storage', (e) => {
        if(e.key === 'vasteria_theme') setTheme(e.newValue);
    });
};

function setupAudio() {
    document.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON' || e.target.type === 'checkbox' || 
           e.target.classList.contains('theme-item') || e.target.classList.contains('satellite') ||
           e.target.classList.contains('globe-main')) {
            playClickSound();
        }
    });
}
function playClickSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}
function playUiSelect() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(520, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(820, audioCtx.currentTime + 0.09);
    g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.13);
}

function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('vasteria_theme', name);
}

/* =========================
   THEME MODAL (mesma correção)
   ========================= */
function ensureThemeModal() {
    let modal = document.getElementById('theme-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'theme-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="theme-modal-window" role="dialog" aria-modal="true">
            <div class="theme-modal-header">
                <button class="theme-modal-back" type="button" onclick="closeThemeModal()">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="theme-modal-title">
                    <h2>SELETOR DE TEMAS</h2>
                    <p>Escolha o estilo visual do Vasteria Gate</p>
                </div>
            </div>
            <div class="theme-modal-body">
                <div id="theme-grid" class="theme-modal-grid"></div>
            </div>
        </div>
    `;

    // ✅ só fecha clicando FORA da janela
    modal.onclick = (e) => {
        if (!e.target.closest('.theme-modal-window')) closeThemeModal();
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeThemeModal();
    });

    renderThemeGrid();
}

function renderThemeGrid() {
    const grid = document.getElementById('theme-grid');
    if (!grid) return;

    const current = normalizeThemeId(localStorage.getItem('vasteria_theme') || 'coffee');

    grid.innerHTML = THEME_CATALOG.map(t => `
        <div class="theme-card ${normalizeThemeId(t.id) === current ? 'is-current' : ''}"
             data-theme="${t.id}"
             style="--p-bg-app:${t.p.bgApp}; --p-bg-panel:${t.p.bgPanel}; --p-accent:${t.p.accent}; --p-accent-glow:${t.p.glow};">
            <div class="theme-preview">
                <div class="mini-topbar"></div>
                <div class="mini-card">
                    <div class="mini-avatar"></div>
                    <div class="mini-lines">
                        <span style="width: 92%"></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div class="mini-btns">
                        <div class="mini-btn primary"></div>
                        <div class="mini-btn"></div>
                    </div>
                </div>
            </div>
            <div class="theme-card-footer">
                <div class="theme-name">${t.label}</div>
                <button class="theme-select-btn" type="button">Selecionar tema</button>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.theme-card').forEach(card => {
        const btn = card.querySelector('.theme-select-btn');

        card.addEventListener('click', (ev) => {
            ev.stopPropagation();
            playClickSound();
            grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('is-focused'));
            card.classList.add('is-focused');
        });

        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const id = card.getAttribute('data-theme');
            if (!id) return;

            playUiSelect();
            setTheme(id);

            grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('is-current'));
            card.classList.add('is-current');
        });
    });
}

function normalizeThemeId(x) {
    return String(x || '').trim().toLowerCase().replace(/\s+/g,'-').replace(/_/g,'-');
}

function disableDockWhileModalOpen(disable) {
    const dock = document.querySelector('.dock-trigger-large');
    if (!dock) return;
    if (disable) {
        if (!_dockWasDisabled) {
            dock.dataset.prevPointer = dock.style.pointerEvents || '';
            dock.style.pointerEvents = 'none';
            dock.style.opacity = '0.45';
            _dockWasDisabled = true;
        }
    } else {
        dock.style.pointerEvents = dock.dataset.prevPointer || '';
        dock.style.opacity = '';
        _dockWasDisabled = false;
    }
}

function openThemeModal() {
    ensureThemeModal();
    const modal = document.getElementById('theme-modal');
    if (!modal) return;

    document.getElementById('theme-panel')?.classList.remove('active');

    modal.classList.add('active');
    disableDockWhileModalOpen(true);

    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('is-focused'));
}
function closeThemeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) modal.classList.remove('active');
    disableDockWhileModalOpen(false);
}
function toggleTheme() {
    const modal = document.getElementById('theme-modal');
    if (!modal || !modal.classList.contains('active')) openThemeModal();
    else closeThemeModal();
}

/* =========================
   FICHA (resto intacto)
   ========================= */
function carregarFicha() {
    const h = currentUser.heroes[heroIdx];
    document.getElementById('display-name').innerText = h.nome.toUpperCase();
    document.getElementById('display-player').innerText = h.player.toUpperCase();
    if(h.img) document.getElementById('sheet-avatar').style.backgroundImage = `url(${h.img})`;
    
    gerarEstrutura(); 
    gerarGrimorio();
    
    if(h.dados) {
        Object.keys(h.dados).forEach(k => {
            const el = document.getElementById(k);
            if(el) {
                if(el.type === 'checkbox') el.checked = h.dados[k];
                else el.value = h.dados[k];
            }
        });
    }
    calcStats();
    calcSpells();
}

function gerarEstrutura() {
    const attrCont = document.getElementById('attr-container'); attrCont.innerHTML = "";
    ATTR.forEach(a => { attrCont.innerHTML += `<div class="attr-row"><span style="font-weight:bold; font-size:14px">${a}</span><input id="score-${a}" class="attr-val save-field" value="10" type="number"><span id="mod-${a}" class="attr-mod">+0</span></div>`; });

    const saveCont = document.getElementById('saves-container'); 
    saveCont.innerHTML = `<div class="skill-header-row"><span></span><span class="text-left">NOME</span><span>ATR</span><span>PROF</span><span>BÔNUS</span><span>TREINO</span><span>OUTRO</span></div>`;
    ATTR.forEach(a => { 
        saveCont.innerHTML += `<div class="skill-row-pro"><button class="skill-icon-btn" onclick="rollSkill('Salvaguarda ${a}', 'total-save-${a}')"><svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg></button><div class="skill-name-pro">Salvaguarda</div><div class="skill-attr-display">(${a})</div><input type="checkbox" id="prof-save-${a}" class="prof-check save-field"><div id="total-save-${a}" class="skill-total-display">+0</div><input type="number" id="train-save-${a}" class="skill-input-line save-field" placeholder="0"><input type="number" id="other-save-${a}" class="skill-input-line save-field" placeholder="0"></div>`; 
    });

    const skillCont = document.getElementById('skills-container');
    skillCont.innerHTML = `<div class="skill-header-row"><span></span><span class="text-left">NOME</span><span>ATR</span><span>PROF</span><span>BÔNUS</span><span>TREINO</span><span>OUTRO</span></div>`;
    SKILLS_LIST.forEach(s => {
        const idName = s.name.replace(/\s+/g, '-').toLowerCase();
        skillCont.innerHTML += `<div class="skill-row-pro"><button class="skill-icon-btn" onclick="rollSkill('${s.name}', 'total-skill-${idName}')"><svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg></button><div class="skill-name-pro">${s.name}</div><div class="skill-attr-display">(${s.attr})</div><input type="checkbox" id="prof-skill-${idName}" class="prof-check save-field"><div id="total-skill-${idName}" class="skill-total-display">+0</div><input type="number" id="train-skill-${idName}" class="skill-input-line save-field" placeholder="0"><input type="number" id="other-skill-${idName}" class="skill-input-line save-field" placeholder="0"></div>`;
    });
}

function gerarGrimorio() {
    const spellsArea = document.getElementById('spells-area');
    spellsArea.innerHTML = "";
    spellsArea.innerHTML += `<div class="spell-level-block"><div class="sl-header"><span class="sl-title">TRUQUES (NÍVEL 0)</span></div><textarea id="spells-0" class="clean-area save-field" style="min-height:150px;" placeholder="Lista de Truques..."></textarea></div>`;
    for(let i=1; i<=9; i++) {
        spellsArea.innerHTML += `<div class="spell-level-block"><div class="sl-header"><span class="sl-title">NÍVEL ${i}</span><div class="sl-slots">TOTAL: <input id="slots-total-${i}" class="save-field" placeholder="0">GASTOS: <input id="slots-exp-${i}" class="save-field" placeholder="0"></div></div><textarea id="spells-${i}" class="clean-area save-field" style="min-height:150px;" placeholder="Magias preparadas..."></textarea></div>`;
    }
}

function calcStats() {
    let mods = {};
    const profBonus = parseInt(document.getElementById('c-prof').value) || 2;

    ATTR.forEach(a => {
        const val = parseInt(document.getElementById(`score-${a}`).value) || 10;
        const mod = Math.floor((val - 10) / 2);
        mods[a] = mod;
        document.getElementById(`mod-${a}`).innerText = mod >= 0 ? `+${mod}` : mod;
    });

    ATTR.forEach(a => {
        const isProf = document.getElementById(`prof-save-${a}`).checked;
        const train = parseInt(document.getElementById(`train-save-${a}`).value) || 0;
        const other = parseInt(document.getElementById(`other-save-${a}`).value) || 0;
        const total = mods[a] + (isProf ? profBonus : 0) + train + other;
        document.getElementById(`total-save-${a}`).innerText = total >= 0 ? `+${total}` : total;
    });

    SKILLS_LIST.forEach(s => {
        const idName = s.name.replace(/\s+/g, '-').toLowerCase();
        const isProf = document.getElementById(`prof-skill-${idName}`).checked;
        const train = parseInt(document.getElementById(`train-skill-${idName}`).value) || 0;
        const other = parseInt(document.getElementById(`other-skill-${idName}`).value) || 0;
        const total = mods[s.attr] + (isProf ? profBonus : 0) + train + other;
        document.getElementById(`total-skill-${idName}`).innerText = total >= 0 ? `+${total}` : total;
        if(s.name === 'Percepção') document.getElementById('pas-perc').value = 10 + total;
        if(s.name === 'Investigação') document.getElementById('pas-inv').value = 10 + total;
        if(s.name === 'Intuição') document.getElementById('pas-ins').value = 10 + total;
    });

    calcSpells();
}

function calcSpells() {
    const ability = document.getElementById('spell-ability').value;
    const mod = parseInt(document.getElementById(`mod-${ability}`).innerText);
    const prof = parseInt(document.getElementById('c-prof').value) || 2;
    const dc = 8 + mod + prof;
    const atk = mod + prof;
    document.getElementById('spell-dc').innerText = dc;
    document.getElementById('spell-atk').innerText = atk >= 0 ? `+${atk}` : atk;
}

function rollSkill(name, elementId) {
    playClickSound();
    const totalText = document.getElementById(elementId).innerText;
    const bonus = parseInt(totalText);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const final = d20 + bonus;

    const modal = document.getElementById('quickroll-modal');
    const resultVal = document.getElementById('roll-result-val');
    const d20Number = document.getElementById('d20-number');
    modal.style.display = 'flex';
    resultVal.innerText = final;
    d20Number.innerText = d20;

    let detail = `${name}: 🎲(${d20}) + ${bonus}`;
    if(d20 === 20) { detail = "CRÍTICO! " + detail; resultVal.style.color = "#ffd700"; }
    else if(d20 === 1) { detail = "FALHA CRÍTICA! " + detail; resultVal.style.color = "#ff4444"; }
    else { resultVal.style.color = "var(--accent)"; }
    document.getElementById('roll-result-detail').innerText = detail;
}

function saveData(el) {
    if(!currentUser.heroes[heroIdx].dados) currentUser.heroes[heroIdx].dados = {};
    currentUser.heroes[heroIdx].dados[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    localStorage.setItem('nexus_db', JSON.stringify(users));
}

function voltarParaHome() { window.location.href = 'index.html'; }
function toggleGlobe() { playClickSound(); document.getElementById('globe-trigger').classList.toggle('active'); }
function switchTab(id) {
    playClickSound();
    document.querySelectorAll('.page').forEach(p => p.style.display='none');
    document.getElementById(id).style.display='block';
    document.getElementById('globe-trigger').classList.remove('active');
}
