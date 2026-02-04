// --- CONFIGURAÇÕES GLOBAIS ---
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

// Carregamento Seguro do DB
try {
    users = JSON.parse(localStorage.getItem('nexus_db')) || [];
} catch (e) {
    users = [];
    localStorage.setItem('nexus_db', '[]');
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    // 1. Tenta restaurar sessão
    const sessionEmail = localStorage.getItem('nexus_session');
    
    if (sessionEmail) {
        const foundUser = users.find(u => u.email === sessionEmail);
        if (foundUser) {
            currentUser = foundUser;
            irParaHub();
        } else {
            // Sessão inválida (usuário deletado ou DB limpo)
            localStorage.removeItem('nexus_session');
        }
    }

    // 2. Gera os campos da ficha
    gerarCamposFicha();

    // 3. Listener Auto-Save
    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('save-field') && currentHeroIdx !== null) {
            saveData(e.target);
            if(e.target.id === 'c-prof') calcStats();
        }
    });
};

function gerarCamposFicha() {
    const attrC = document.getElementById('attr-container');
    const svC = document.getElementById('saves-container');
    const skC = document.getElementById('skills-container');
    const spC = document.getElementById('spells-grid-container');

    if(!attrC || attrC.innerHTML !== "") return;

    ATTR_MAP.forEach(a => {
        attrC.innerHTML += `
        <div class="attr-wrapper">
            <label style="color:var(--gold); font-size:10px; font-weight:bold">${a}</label>
            <input id="score-${a}" class="save-field dark-in center-text" style="font-size:22px; font-weight:bold" value="10" oninput="calcStats()">
            <div class="attr-mod-circle">
                <input id="mod-${a}" class="dark-in center-text" style="font-size:14px; color:var(--gold)" readonly value="+0">
            </div>
        </div>`;
    });

    ATTR_MAP.forEach(a => {
        svC.innerHTML += `<div style="display:flex; align-items:center; margin-bottom:4px; font-size:12px"><input type="checkbox" id="prof-save-${a}" class="save-field" onchange="calcStats()"> <span id="val-save-${a}" style="width:25px; text-align:center; color:var(--gold); font-weight:bold">+0</span> <span style="color:#aaa; margin-left:5px">${a}</span></div>`;
    });

    Object.keys(SKILL_MAP).forEach(s => {
        const attr = SKILL_MAP[s];
        skC.innerHTML += `<div style="display:flex; align-items:center; margin-bottom:4px; font-size:12px"><input type="checkbox" id="prof-skill-${s}" class="save-field" onchange="calcStats()"> <span id="val-skill-${s}" style="width:25px; text-align:center; color:var(--gold); font-weight:bold">+0</span> <span style="color:#aaa; margin-left:5px">${s} <span style="font-size:9px; color:#555">(${attr})</span></span></div>`;
    });

    for(let i=0; i<=9; i++) {
        spC.innerHTML += `
        <div class="dark-box">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:5px">
                <strong style="color:var(--gold)">CÍRCULO ${i}</strong>
                <span style="font-size:11px">Total: <input id="sp-t-${i}" class="save-field dark-in" style="width:20px; text-align:center"> Usados: <input id="sp-u-${i}" class="save-field dark-in" style="width:20px; text-align:center"></span>
            </div>
            <textarea id="sp-list-${i}" class="save-field dark-in" rows="4" placeholder="..."></textarea>
        </div>`;
    }
}

// --- LOGIN & CADASTRO (CORRIGIDO) ---

function realizarLogin() {
    const input = document.getElementById('login-input').value.toLowerCase().trim();
    const pass = document.getElementById('login-pass').value;
    
    const user = users.find(u => u.email === input || (u.apelido && u.apelido.toLowerCase() === input));
    
    if(user && user.pass === pass) {
        currentUser = user;
        localStorage.setItem('nexus_session', user.email);
        irParaHub();
    } else {
        alert("Acesso negado.");
    }
}

function realizarCadastro() {
    // Busca os campos pelo ID correto do HTML
    const apelidoEl = document.getElementById('reg-apelido');
    const emailEl = document.getElementById('reg-email');
    const passEl = document.getElementById('reg-pass');

    if(!apelidoEl || !emailEl || !passEl) {
        console.error("Erro: IDs de cadastro não encontrados no HTML.");
        return;
    }

    const apelido = apelidoEl.value.trim();
    const email = emailEl.value.toLowerCase().trim();
    const pass = passEl.value;

    if(!email || !pass || !apelido) return alert("Preencha todos os campos.");
    if(users.find(u => u.email === email)) return alert("E-mail já registrado.");

    const newUser = { apelido, email, pass, heroes: [] };
    users.push(newUser);
    salvarNoDB();
    
    currentUser = newUser;
    localStorage.setItem('nexus_session', email);
    irParaHub();
}

function logout() {
    localStorage.removeItem('nexus_session');
    location.reload();
}

function toggleAuth() {
    const l = document.getElementById('login-box');
    const r = document.getElementById('register-box');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}

// --- HUB & CRIAÇÃO ---

function irParaHub() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('sheet-section').style.display = 'none';
    document.getElementById('hub-section').style.display = 'flex';
    if(currentUser) document.getElementById('user-tag').innerText = currentUser.apelido.toUpperCase();
    renderHub();
}

function renderHub() {
    const list = document.getElementById('hero-list');
    list.innerHTML = "";

    if (!currentUser.heroes || currentUser.heroes.length === 0) {
        list.innerHTML = `<p style="color:#666; font-size:12px; grid-column:1/-1; text-align:center">Sem registros.</p>`;
        return;
    }

    currentUser.heroes.forEach((h, i) => {
        list.innerHTML += `
        <div class="hero-card-glass" style="position:relative">
            <div class="delete-btn" onclick="deletarHeroi(event, ${i})">×</div>
            <div onclick="abrirFicha(${i})">
                <h4 style="color:var(--gold); margin:0 0 5px 0">${h.nome}</h4>
                <p style="font-size:10px; color:#888">${h.dados['c-class'] || 'Desconhecido'}</p>
            </div>
        </div>`;
    });
}

function deletarHeroi(event, index) {
    event.stopPropagation();
    if(confirm(`Apagar ${currentUser.heroes[index].nome}?`)) {
        currentUser.heroes.splice(index, 1);
        salvarNoDB();
        renderHub();
    }
}

function mostrarModal() {
    document.getElementById('creation-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('new-hero-name').focus(), 100);
}

function fecharModal() {
    document.getElementById('creation-modal').style.display = 'none';
    document.getElementById('new-hero-name').value = '';
}

function confirmarCriacao() {
    if (!currentUser) return alert("Sessão expirada. Faça login novamente.");

    const nome = document.getElementById('new-hero-name').value.trim();
    if(!nome) return alert("Nome necessário.");

    const novoHeroi = {
        nome: nome,
        dados: {
            "c-name": nome,
            "c-prof": "+2",
            "score-FOR": "10", "score-DES": "10", "score-CON": "10",
            "score-INT": "10", "score-SAB": "10", "score-CAR": "10"
        }
    };
    
    if(!currentUser.heroes) currentUser.heroes = [];
    currentUser.heroes.push(novoHeroi);
    salvarNoDB();
    fecharModal();
    renderHub();
}

// --- FICHA ---

function abrirFicha(idx) {
    currentHeroIdx = idx;
    const h = currentUser.heroes[idx];
    
    document.getElementById('hub-section').style.display = 'none';
    document.getElementById('sheet-section').style.display = 'block';
    document.getElementById('display-hero-name').innerText = h.nome.toUpperCase();
    
    // Limpa e preenche
    document.querySelectorAll('.save-field').forEach(f => {
        if(f.type === 'checkbox') f.checked = false;
        else f.value = "";
    });

    if(h.dados) {
        Object.keys(h.dados).forEach(key => {
            const el = document.getElementById(key);
            if(el) {
                if(el.type === 'checkbox') el.checked = h.dados[key];
                else el.value = h.dados[key];
            }
        });
    }
    calcStats();
}

function saveData(element) {
    if(!currentUser || currentHeroIdx === null) return;
    if(!currentUser.heroes[currentHeroIdx].dados) currentUser.heroes[currentHeroIdx].dados = {};
    
    const val = element.type === 'checkbox' ? element.checked : element.value;
    currentUser.heroes[currentHeroIdx].dados[element.id] = val;
    salvarNoDB();
    
    if(element.id === 'c-name') {
        document.getElementById('display-hero-name').innerText = val.toUpperCase();
        currentUser.heroes[currentHeroIdx].nome = val;
    }
}

function salvarNoDB() {
    const i = users.findIndex(u => u.email === currentUser.email);
    if(i !== -1) {
        users[i] = currentUser;
        localStorage.setItem('nexus_db', JSON.stringify(users));
    }
}

// --- AUTOMAÇÃO ---
function calcStats() {
    const profBonus = parseInt(document.getElementById('c-prof').value) || 0;
    let mods = {};

    ATTR_MAP.forEach(a => {
        const field = document.getElementById(`score-${a}`);
        const score = parseInt(field.value) || 10;
        const mod = Math.floor((score - 10) / 2);
        mods[a] = mod;
        
        const mField = document.getElementById(`mod-${a}`);
        if(mField) mField.value = mod >= 0 ? `+${mod}` : mod;
    });

    ATTR_MAP.forEach(a => {
        const isProf = document.getElementById(`prof-save-${a}`)?.checked;
        const total = mods[a] + (isProf ? profBonus : 0);
        const el = document.getElementById(`val-save-${a}`);
        if(el) el.innerText = total >= 0 ? `+${total}` : total;
    });

    Object.keys(SKILL_MAP).forEach(s => {
        const attr = SKILL_MAP[s];
        const isProf = document.getElementById(`prof-skill-${s}`)?.checked;
        const total = mods[attr] + (isProf ? profBonus : 0);
        const el = document.getElementById(`val-skill-${s}`);
        if(el) el.innerText = total >= 0 ? `+${total}` : total;
    });

    if(document.getElementById('val-skill-Percepção')) {
        const pPerc = 10 + parseInt(document.getElementById('val-skill-Percepção').innerText);
        const pInv = 10 + parseInt(document.getElementById('val-skill-Investigação').innerText);
        const pIns = 10 + parseInt(document.getElementById('val-skill-Intuição').innerText);
        
        document.getElementById('c-pas-perc').value = pPerc;
        document.getElementById('c-pas-inv').value = pInv;
        document.getElementById('c-pas-ins').value = pIns;
    }
}

function switchTab(e, id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
}