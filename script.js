// --- CONFIGURAÇÃO E DADOS ---
const themes = {
    // TEMA COFFEE (Taverna)
    coffee: { 
        '--bg-app': '#1F1612', 
        '--bg-panel': 'rgba(62, 47, 38, 0.9)', 
        '--bg-input': 'rgba(255, 245, 230, 0.1)', 
        '--accent': '#D4A373', 
        '--accent-glow': 'rgba(212, 163, 115, 0.4)', 
        '--text-primary': '#FAEDCD', 
        '--text-secondary': '#CCD5AE', 
        '--border': '#8D6E63' 
    },
    master: { '--bg-app': '#2a0a0a', '--bg-panel': 'rgba(60, 10, 10, 0.7)', '--bg-input': 'rgba(0, 0, 0, 0.3)', '--accent': '#ffd700', '--accent-glow': 'rgba(255, 215, 0, 0.5)', '--text-primary': '#fff8e7', '--text-secondary': '#e6b800', '--border': 'rgba(255, 215, 0, 0.3)' },
    arcane: { '--bg-app': '#1e1b4b', '--bg-panel': 'rgba(46, 16, 101, 0.7)', '--bg-input': 'rgba(0, 0, 0, 0.3)', '--accent': '#a855f7', '--accent-glow': 'rgba(168, 85, 247, 0.5)', '--text-primary': '#f3e8ff', '--text-secondary': '#d8b4fe', '--border': 'rgba(168, 85, 247, 0.2)' },
    might: { '--bg-app': '#1a0505', '--bg-panel': 'rgba(42, 10, 10, 0.7)', '--bg-input': 'rgba(0, 0, 0, 0.3)', '--accent': '#ef4444', '--accent-glow': 'rgba(239, 68, 68, 0.5)', '--text-primary': '#fee2e2', '--text-secondary': '#fca5a5', '--border': 'rgba(239, 68, 68, 0.2)' },
    stealth: { '--bg-app': '#020617', '--bg-panel': 'rgba(6, 78, 59, 0.6)', '--bg-input': 'rgba(0, 0, 0, 0.3)', '--accent': '#10b981', '--accent-glow': 'rgba(16, 185, 129, 0.4)', '--text-primary': '#ecfdf5', '--text-secondary': '#6ee7b7', '--border': 'rgba(16, 185, 129, 0.2)' },
    wild: { '--bg-app': '#051a05', '--bg-panel': 'rgba(15, 41, 10, 0.7)', '--bg-input': 'rgba(0, 0, 0, 0.3)', '--accent': '#84cc16', '--accent-glow': 'rgba(132, 204, 22, 0.4)', '--text-primary': '#f7fee7', '--text-secondary': '#bef264', '--border': 'rgba(132, 204, 22, 0.2)' },
    classic: { '--bg-app': '#000000', '--bg-panel': 'rgba(17, 17, 17, 0.8)', '--bg-input': 'rgba(255, 255, 255, 0.1)', '--accent': '#eab308', '--accent-glow': 'rgba(234, 179, 8, 0.4)', '--text-primary': '#fefce8', '--text-secondary': '#fde047', '--border': 'rgba(234, 179, 8, 0.2)' }
};
const ATTR_MAP = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];
const SKILL_MAP = { "Acrobacia": "DES", "Adestrar Animais": "SAB", "Arcanismo": "INT", "Atletismo": "FOR", "Atuação": "CAR", "Enganação": "CAR", "Furtividade": "DES", "História": "INT", "Intimidação": "CAR", "Intuição": "SAB", "Investigação": "INT", "Medicina": "SAB", "Natureza": "INT", "Percepção": "SAB", "Persuasão": "CAR", "Prestidigitação": "DES", "Religião": "INT", "Sobrevivência": "SAB" };

let currentUser = null; 
let currentHeroIdx = null;
let users = [];
let tempCharImgData = null; 
let tempUserImgData = null;

try { users = JSON.parse(localStorage.getItem('nexus_db')) || []; } catch (e) { users = []; }

window.onload = () => {
    const savedTheme = localStorage.getItem('vasteria_theme') || 'coffee'; 
    setTheme(savedTheme);
    const sessionEmail = localStorage.getItem('nexus_session');
    if (sessionEmail) {
        const foundUser = users.find(u => u.email === sessionEmail);
        if (foundUser) { currentUser = foundUser; irParaPerfil(); } 
        else localStorage.removeItem('nexus_session');
    }
    gerarCamposFicha();
    document.addEventListener('input', (e) => {
        if((e.target.classList.contains('save-field') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && currentHeroIdx !== null) {
            saveData(e.target);
            if(e.target.id.match(/^(c-prof|score-|prof-)/)) calcStats();
        }
    });
};

function previewUserImage(event) {
    const file = event.target.files[0];
    if (file && checkFileSize(file)) {
        const reader = new FileReader();
        reader.onload = function(e) { tempUserImgData = e.target.result; document.getElementById('user-photo-preview').style.backgroundImage = `url(${tempUserImgData})`; document.getElementById('user-photo-preview').innerHTML = ''; }
        reader.readAsDataURL(file);
    }
}
function previewCharImage(event) {
    const file = event.target.files[0];
    if (file && checkFileSize(file)) {
        const reader = new FileReader();
        reader.onload = function(e) { tempCharImgData = e.target.result; document.getElementById('char-photo-preview').style.backgroundImage = `url(${tempCharImgData})`; document.getElementById('char-photo-preview').innerHTML = ''; }
        reader.readAsDataURL(file);
    }
}
function checkFileSize(file) { if(file.size > 2000000) { alert("Imagem muito grande! Máx: 2MB."); return false; } return true; }

function realizarLogin() {
    const input = document.getElementById('login-input').value.toLowerCase().trim();
    const pass = document.getElementById('login-pass').value;
    const user = users.find(u => u.email === input || (u.apelido && u.apelido.toLowerCase() === input));
    if(user && user.pass === pass) { currentUser = user; localStorage.setItem('nexus_session', user.email); irParaPerfil(); } 
    else alert("Credenciais Inválidas.");
}
function realizarCadastro() {
    const apelido = document.getElementById('reg-apelido').value;
    const email = document.getElementById('reg-email').value.toLowerCase().trim();
    const pass = document.getElementById('reg-pass').value;
    if(!email || !pass || !apelido) return alert("Preencha todos os campos.");
    if(users.find(u => u.email === email)) return alert("Email já registrado.");
    const newUser = { apelido, email, pass, heroes: [], userImg: tempUserImgData || null };
    users.push(newUser); localStorage.setItem('nexus_db', JSON.stringify(users));
    currentUser = newUser; localStorage.setItem('nexus_session', email);
    irParaPerfil();
}
function logout() { localStorage.removeItem('nexus_session'); location.reload(); }
function toggleAuth() { const l=document.getElementById('login-box'); const r=document.getElementById('register-box'); l.style.display=l.style.display==='none'?'block':'none'; r.style.display=r.style.display==='none'?'block':'none'; }

function irParaPerfil() {
    document.getElementById('auth-section').style.display='none'; document.getElementById('sheet-section').style.display='none';
    document.getElementById('user-profile-section').style.display='flex';
    document.getElementById('current-user-name').innerText = currentUser.apelido.toUpperCase();
    const avatarEl = document.getElementById('current-user-avatar');
    avatarEl.style.backgroundImage = currentUser.userImg ? `url(${currentUser.userImg})` : 'linear-gradient(45deg, #333, #555)';
    fecharUniversoRPG();
}
function abrirUniversoRPG() { document.getElementById('universe-modal').style.display = 'flex'; switchUniverseTab('heroes'); }
function fecharUniversoRPG() { document.getElementById('universe-modal').style.display = 'none'; }

function switchUniverseTab(tab) {
    const title = document.getElementById('universe-title');
    const tabHeroes = document.getElementById('content-heroes');
    const tabBooks = document.getElementById('content-books');
    const btns = document.querySelectorAll('.side-tab');
    btns.forEach(b => b.classList.remove('active'));

    if(tab === 'heroes') {
        title.innerText = "MEUS PERSONAGENS"; tabHeroes.style.display = 'block'; tabBooks.style.display = 'none';
        renderHeroListWide(); btns[0].classList.add('active');
    } else if (tab === 'books') {
        title.innerText = "LIVROS E REGRAS"; tabHeroes.style.display = 'none'; tabBooks.style.display = 'block';
        btns[1].classList.add('active');
    }
}

function mostrarModal() {
    document.getElementById('creation-modal').style.display = 'flex'; 
    document.getElementById('new-hero-name').value = ''; document.getElementById('new-player-name').value = currentUser.apelido; 
    document.getElementById('new-campaign-name').value = ''; document.getElementById('new-char-desc').value = ''; 
    document.getElementById('char-photo-preview').style.backgroundImage = 'none'; document.getElementById('char-photo-preview').innerHTML = '<span>+ FOTO</span>'; 
    tempCharImgData = null;
}
function fecharModal() { document.getElementById('creation-modal').style.display = 'none'; }

function confirmarCriacao() {
    const nome = document.getElementById('new-hero-name').value.trim();
    const jogador = document.getElementById('new-player-name').value.trim();
    const campanha = document.getElementById('new-campaign-name').value.trim();
    const desc = document.getElementById('new-char-desc').value.trim();
    if(!nome) return alert("Nome obrigatório!");
    if(!currentUser.heroes) currentUser.heroes = [];
    const novoHeroi = {
        nome: nome, img: tempCharImgData || null, player: jogador || currentUser.apelido, campaign: campanha, desc: desc,
        creationDate: new Date().toLocaleDateString('pt-BR'),
        dados: { "c-name": nome, "c-player": jogador, "c-campaign": campanha, "b-backstory": desc }
    };
    currentUser.heroes.push(novoHeroi); localStorage.setItem('nexus_db', JSON.stringify(users));
    fecharModal(); renderHeroListWide();
}

function renderHeroListWide() {
    const list = document.getElementById('hero-list-area'); list.innerHTML = "";
    if(!currentUser.heroes || currentUser.heroes.length === 0) { list.innerHTML = '<div class="hero-card-wide" onclick="mostrarModal()" style="justify-content:center; align-items:center; padding:30px; border:2px dashed var(--border); color:var(--text-secondary);">+ CRIAR PRIMEIRO HERÓI</div>'; return; }
    currentUser.heroes.forEach((h, i) => {
        const bgImg = h.img ? `url(${h.img})` : 'linear-gradient(45deg, #222, #333)'; const classe = h.dados['c-class'] || 'Iniciado';
        list.innerHTML += `<div class="hero-card-wide" onclick="abrirFicha(${i})"><div class="hero-card-img" style="background-image: ${bgImg}"></div><div class="hero-card-info"><h3>${h.nome}</h3><p>${classe} | ${h.desc ? h.desc.substring(0, 30)+'...' : 'Sem descrição'}</p><p style="margin-top:5px; font-weight:bold; color:var(--accent)">${h.nome} campeão de ${h.player}</p><span class="hero-card-date">Criado em: ${h.creationDate}</span></div><div class="delete-icon" style="top:10px; right:10px;" onclick="deletarHeroi(event, ${i})">×</div></div>`;
    });
    list.innerHTML += '<div class="hero-card-wide btn-create-hero-wide" onclick="mostrarModal()">+ NOVO REGISTRO</div>';
}

function abrirFicha(idx) {
    currentHeroIdx = idx; const h = currentUser.heroes[idx];
    fecharUniversoRPG(); document.getElementById('user-profile-section').style.display='none'; document.getElementById('sheet-section').style.display = 'block';
    document.getElementById('display-hero-name').innerText = h.nome.toUpperCase(); document.getElementById('display-player-name').innerText = h.player.toUpperCase();
    const avatarEl = document.getElementById('sheet-avatar-display'); avatarEl.style.backgroundImage = h.img ? `url(${h.img})` : 'none';
    document.querySelectorAll('#sheet-section input, #sheet-section textarea').forEach(el => { if(el.type === 'checkbox') el.checked = false; else el.value = ""; });
    if(h.dados) { Object.keys(h.dados).forEach(k => { const el = document.getElementById(k); if(el) { if(el.type === 'checkbox') el.checked = h.dados[k]; else el.value = h.dados[k]; } }); }
    calcStats(); switchTab('tab1');
}

function switchTab(id) { document.querySelectorAll('.page').forEach(p => p.style.display='none'); document.getElementById(id).style.display='block'; }
function setTheme(themeName) { const theme = themes[themeName]; if(!theme) return; const root = document.documentElement; Object.keys(theme).forEach(key => root.style.setProperty(key, theme[key])); document.body.setAttribute('data-theme', themeName); localStorage.setItem('vasteria_theme', themeName); }
function toggleThemePanel() { document.getElementById('theme-dock-panel').classList.toggle('hidden'); }
function deletarHeroi(e, i) { e.stopPropagation(); if(confirm("Apagar arquivo?")) { currentUser.heroes.splice(i, 1); localStorage.setItem('nexus_db', JSON.stringify(users)); renderHeroListWide(); } }
function saveData(el) { if(!currentUser || currentHeroIdx===null) return; if(!currentUser.heroes[currentHeroIdx].dados) currentUser.heroes[currentHeroIdx].dados={}; currentUser.heroes[currentHeroIdx].dados[el.id]=el.type==='checkbox'?el.checked:el.value; localStorage.setItem('nexus_db', JSON.stringify(users)); }
function gerarCamposFicha() { const attrC=document.getElementById('attr-container'); const svC=document.getElementById('saves-container'); const skC=document.getElementById('skills-container'); const spC=document.getElementById('spells-grid-container'); if(!attrC || attrC.innerHTML!=="") return; ATTR_MAP.forEach(a => attrC.innerHTML+=`<div class="attr-card"><label>${a}</label><input id="score-${a}" class="attr-val" value="10" oninput="calcStats()"><div id="mod-${a}" class="attr-mod">+0</div></div>`); ATTR_MAP.forEach(a => svC.innerHTML+=`<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px;align-items:center;"><span style="color:var(--text-secondary)">${a}</span><div style="display:flex;align-items:center;gap:5px"><span id="val-save-${a}" style="color:var(--accent);font-weight:bold;">+0</span><input type="checkbox" id="prof-save-${a}" class="save-field" onchange="calcStats()"></div></div>`); Object.keys(SKILL_MAP).forEach(s => skC.innerHTML+=`<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px;align-items:center;"><span style="color:var(--text-secondary)">${s}</span><div style="display:flex;align-items:center;gap:5px"><span id="val-skill-${s}" style="color:var(--accent);font-weight:bold;">+0</span><input type="checkbox" id="prof-skill-${s}" class="save-field" onchange="calcStats()"></div></div>`); for(let i=0;i<=9;i++) spC.innerHTML+=`<div class="floating-block"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><strong style="color:var(--accent)">CÍRCULO ${i}</strong><span style="font-size:10px">SLOTS: <input id="sp-t-${i}" style="width:30px;background:var(--bg-input);border:none;color:var(--text-primary);text-align:center;border-radius:4px"></span></div><textarea id="sp-list-${i}" class="modern-area" rows="4"></textarea></div>`; }
function calcStats() { const prof=parseInt(document.getElementById('c-prof').value)||2; let mods={}; ATTR_MAP.forEach(a => { const val=parseInt(document.getElementById(`score-${a}`).value)||10; const mod=Math.floor((val-10)/2); mods[a]=mod; document.getElementById(`mod-${a}`).innerText=mod>=0?`+${mod}`:mod; }); ATTR_MAP.forEach(a => { const p=document.getElementById(`prof-save-${a}`)?.checked; const tot=mods[a]+(p?prof:0); document.getElementById(`val-save-${a}`).innerText=tot>=0?`+${tot}`:tot; }); Object.keys(SKILL_MAP).forEach(s => { const attr=SKILL_MAP[s]; const p=document.getElementById(`prof-skill-${s}`)?.checked; const tot=mods[attr]+(p?prof:0); document.getElementById(`val-skill-${s}`).innerText=tot>=0?`+${tot}`:tot; }); }