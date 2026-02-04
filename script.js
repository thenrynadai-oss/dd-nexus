// --- CONFIGURAÇÃO DE TEMAS ---
const themes = {
    modern: { // Neon (Padrão)
        '--bg-app': '#09090b', '--bg-panel': 'rgba(255, 255, 255, 0.03)', '--bg-input': 'rgba(0, 0, 0, 0.3)',
        '--accent': '#3b82f6', '--accent-glow': 'rgba(59, 130, 246, 0.5)', '--text-primary': '#f4f4f5', '--text-secondary': '#a1a1aa'
    },
    void: { // NOVO TEMA (Roxo/Glass Extremo)
        '--bg-app': '#180b26', '--bg-panel': 'rgba(217, 70, 239, 0.05)', '--bg-input': 'rgba(217, 70, 239, 0.1)',
        '--accent': '#d946ef', '--accent-glow': 'rgba(217, 70, 239, 0.6)', '--text-primary': '#f3e8ff', '--text-secondary': '#d8b4fe'
    },
    classic: { // Black & Gold
        '--bg-app': '#050505', '--bg-panel': 'rgba(20, 20, 20, 0.8)', '--bg-input': 'rgba(255, 255, 255, 0.05)',
        '--accent': '#d4af37', '--accent-glow': 'rgba(212, 175, 55, 0.5)', '--text-primary': '#e0e0e0', '--text-secondary': '#888'
    },
    paper: { // Pergaminho
        '--bg-app': '#e3dac9', '--bg-panel': 'rgba(255, 255, 255, 0.6)', '--bg-input': 'rgba(0, 0, 0, 0.05)',
        '--accent': '#8b4513', '--accent-glow': 'rgba(139, 69, 19, 0.3)', '--text-primary': '#2c1810', '--text-secondary': '#5d4037'
    },
    blood: { // Vampiro
        '--bg-app': '#0f0000', '--bg-panel': 'rgba(40, 0, 0, 0.4)', '--bg-input': 'rgba(255, 0, 0, 0.1)',
        '--accent': '#ff0000', '--accent-glow': 'rgba(255, 0, 0, 0.5)', '--text-primary': '#ffcccc', '--text-secondary': '#a05050'
    },
    nature: { // Druida
        '--bg-app': '#051a05', '--bg-panel': 'rgba(0, 40, 0, 0.4)', '--bg-input': 'rgba(0, 255, 0, 0.05)',
        '--accent': '#4ade80', '--accent-glow': 'rgba(74, 222, 128, 0.5)', '--text-primary': '#e0f2e0', '--text-secondary': '#608060'
    },
    abyss: { // Abissal
        '--bg-app': '#000810', '--bg-panel': 'rgba(0, 20, 40, 0.5)', '--bg-input': 'rgba(0, 100, 255, 0.1)',
        '--accent': '#00f0ff', '--accent-glow': 'rgba(0, 240, 255, 0.5)', '--text-primary': '#ccfbfb', '--text-secondary': '#408080'
    }
};

// --- DADOS DO SISTEMA ---
const ATTR_MAP = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];
const SKILL_MAP = {
    "Acrobacia": "DES", "Adestrar Animais": "SAB", "Arcanismo": "INT", "Atletismo": "FOR",
    "Atuação": "CAR", "Enganação": "CAR", "Furtividade": "DES", "História": "INT",
    "Intimidação": "CAR", "Intuição": "SAB", "Investigação": "INT", "Medicina": "SAB",
    "Natureza": "INT", "Percepção": "SAB", "Persuasão": "CAR", "Prestidigitação": "DES",
    "Religião": "INT", "Sobrevivência": "SAB"
};

let currentUser = null; 
let currentHeroIdx = null;
let users = [];

try { users = JSON.parse(localStorage.getItem('nexus_db')) || []; } 
catch (e) { users = []; localStorage.setItem('nexus_db', '[]'); }

// --- INIT ---
window.onload = () => {
    const savedTheme = localStorage.getItem('vasteria_theme') || 'modern';
    setTheme(savedTheme);

    const sessionEmail = localStorage.getItem('nexus_session');
    if (sessionEmail) {
        const foundUser = users.find(u => u.email === sessionEmail);
        if (foundUser) {
            currentUser = foundUser;
            irParaHub();
        } else localStorage.removeItem('nexus_session');
    }

    gerarCamposFicha();

    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('save-field') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if(currentHeroIdx !== null && e.target.id) {
                saveData(e.target);
                if(e.target.id === 'c-prof' || e.target.id.startsWith('score-') || e.target.id.startsWith('prof-')) calcStats();
            }
        }
    });
};

// --- SISTEMA DE TEMAS ---
function setTheme(themeName) {
    const theme = themes[themeName];
    if(!theme) return;
    
    // 1. Aplica variáveis de cor
    const root = document.documentElement;
    Object.keys(theme).forEach(key => root.style.setProperty(key, theme[key]));
    
    // 2. Aplica o "Modo Atmosférico" (Background Animation)
    document.body.setAttribute('data-theme', themeName);
    
    localStorage.setItem('vasteria_theme', themeName);
}

// --- GERAÇÃO HTML ---
function gerarCamposFicha() {
    const attrC = document.getElementById('attr-container');
    const svC = document.getElementById('saves-container');
    const skC = document.getElementById('skills-container');
    const spC = document.getElementById('spells-grid-container');

    if(!attrC || attrC.innerHTML !== "") return;

    ATTR_MAP.forEach(a => {
        attrC.innerHTML += `
        <div class="attr-card">
            <label>${a}</label>
            <input id="score-${a}" class="attr-val" value="10" oninput="calcStats()">
            <div id="mod-${a}" class="attr-mod">+0</div>
        </div>`;
    });

    ATTR_MAP.forEach(a => {
        svC.innerHTML += `<div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; align-items:center;">
            <span style="color:var(--text-secondary)">${a}</span> 
            <div style="display:flex; align-items:center; gap:5px">
                <span id="val-save-${a}" style="color:var(--accent); font-weight:bold;">+0</span>
                <input type="checkbox" id="prof-save-${a}" class="save-field" onchange="calcStats()">
            </div>
        </div>`;
    });

    Object.keys(SKILL_MAP).forEach(s => {
        skC.innerHTML += `<div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; align-items:center;">
            <span style="color:var(--text-secondary)">${s}</span> 
            <div style="display:flex; align-items:center; gap:5px">
                <span id="val-skill-${s}" style="color:var(--accent); font-weight:bold;">+0</span>
                <input type="checkbox" id="prof-skill-${s}" class="save-field" onchange="calcStats()">
            </div>
        </div>`;
    });

    for(let i=0; i<=9; i++) {
        spC.innerHTML += `
        <div class="floating-block">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                <strong style="color:var(--accent)">CÍRCULO ${i}</strong>
                <span style="font-size:10px">SLOTS: <input id="sp-t-${i}" style="width:30px; background:var(--bg-input); border:none; color:var(--text-primary); text-align:center; border-radius:4px"></span>
            </div>
            <textarea id="sp-list-${i}" class="modern-area" rows="4"></textarea>
        </div>`;
    }
}

// --- FUNÇÕES BÁSICAS ---
function realizarLogin() {
    const input = document.getElementById('login-input').value.toLowerCase().trim();
    const pass = document.getElementById('login-pass').value;
    const user = users.find(u => u.email === input || (u.apelido && u.apelido.toLowerCase() === input));
    if(user && user.pass === pass) { currentUser = user; localStorage.setItem('nexus_session', user.email); irParaHub(); } 
    else alert("Acesso Negado.");
}

function realizarCadastro() {
    const apelido = document.getElementById('reg-apelido').value;
    const email = document.getElementById('reg-email').value.toLowerCase().trim();
    const pass = document.getElementById('reg-pass').value;
    if(!email || !pass) return alert("Dados incompletos.");
    if(users.find(u => u.email === email)) return alert("Email já registrado.");
    
    const newUser = { apelido, email, pass, heroes: [] };
    users.push(newUser);
    localStorage.setItem('nexus_db', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('nexus_session', email);
    irParaHub();
}

function logout() { localStorage.removeItem('nexus_session'); location.reload(); }
function toggleAuth() { 
    const l = document.getElementById('login-box'); const r = document.getElementById('register-box'); 
    l.style.display = l.style.display==='none'?'block':'none'; r.style.display = r.style.display==='none'?'block':'none'; 
}

function irParaHub() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('sheet-section').style.display = 'none';
    document.getElementById('hub-section').style.display = 'flex';
    document.getElementById('user-tag').innerText = "AGENTE " + currentUser.apelido.toUpperCase();
    renderHub();
}

function renderHub() {
    const list = document.getElementById('hero-list');
    list.innerHTML = "";
    if(!currentUser.heroes || currentUser.heroes.length === 0) return;
    
    currentUser.heroes.forEach((h, i) => {
        list.innerHTML += `
        <div class="hero-card" onclick="abrirFicha(${i})">
            <div class="delete-icon" onclick="deletarHeroi(event, ${i})">×</div>
            <h4>${h.nome}</h4>
            <p>${h.dados['c-class'] || 'Arquivo Novo'}</p>
        </div>`;
    });
}

function deletarHeroi(e, i) {
    e.stopPropagation();
    if(confirm("Apagar arquivo permanentemente?")) {
        currentUser.heroes.splice(i, 1);
        localStorage.setItem('nexus_db', JSON.stringify(users));
        renderHub();
    }
}

function mostrarModal() { document.getElementById('creation-modal').style.display = 'flex'; }
function fecharModal() { document.getElementById('creation-modal').style.display = 'none'; }
function confirmarCriacao() {
    const nome = document.getElementById('new-hero-name').value;
    if(!nome) return;
    if(!currentUser.heroes) currentUser.heroes = [];
    currentUser.heroes.push({ nome, dados: { "c-name": nome } });
    localStorage.setItem('nexus_db', JSON.stringify(users));
    fecharModal();
    renderHub();
}

function abrirFicha(idx) {
    currentHeroIdx = idx;
    const h = currentUser.heroes[idx];
    document.getElementById('hub-section').style.display = 'none';
    document.getElementById('sheet-section').style.display = 'block';
    document.getElementById('display-hero-name').innerText = h.nome.toUpperCase();
    
    document.querySelectorAll('input, textarea').forEach(el => {
        if(!el.id.startsWith('login') && !el.id.startsWith('reg') && !el.id.startsWith('new')) {
            if(el.type === 'checkbox') el.checked = false;
            else el.value = "";
        }
    });

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
}

function saveData(el) {
    if(!currentUser || currentHeroIdx === null) return;
    if(!currentUser.heroes[currentHeroIdx].dados) currentUser.heroes[currentHeroIdx].dados = {};
    const val = el.type === 'checkbox' ? el.checked : el.value;
    currentUser.heroes[currentHeroIdx].dados[el.id] = val;
    localStorage.setItem('nexus_db', JSON.stringify(users));
}

function calcStats() {
    const prof = parseInt(document.getElementById('c-prof').value) || 2;
    let mods = {};
    
    ATTR_MAP.forEach(a => {
        const val = parseInt(document.getElementById(`score-${a}`).value) || 10;
        const mod = Math.floor((val-10)/2);
        mods[a] = mod;
        document.getElementById(`mod-${a}`).innerText = mod>=0?`+${mod}`:mod;
    });

    ATTR_MAP.forEach(a => {
        const p = document.getElementById(`prof-save-${a}`)?.checked;
        const tot = mods[a] + (p?prof:0);
        document.getElementById(`val-save-${a}`).innerText = tot>=0?`+${tot}`:tot;
    });

    Object.keys(SKILL_MAP).forEach(s => {
        const attr = SKILL_MAP[s];
        const p = document.getElementById(`prof-skill-${s}`)?.checked;
        const tot = mods[attr] + (p?prof:0);
        document.getElementById(`val-skill-${s}`).innerText = tot>=0?`+${tot}`:tot;
    });
    
    if(document.getElementById('val-skill-Percepção')) {
        document.getElementById('c-pas-perc').value = 10 + parseInt(document.getElementById('val-skill-Percepção').innerText);
        document.getElementById('c-pas-inv').value = 10 + parseInt(document.getElementById('val-skill-Investigação').innerText);
        document.getElementById('c-pas-ins').value = 10 + parseInt(document.getElementById('val-skill-Intuição').innerText);
    }
}

function switchTab(e, id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
}