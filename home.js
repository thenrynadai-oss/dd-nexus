let users = JSON.parse(localStorage.getItem('nexus_db')) || [];
let currentUser = null;
let tempImg = null;

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
    applyTheme();
    const session = localStorage.getItem('nexus_session');
    if(session) {
        currentUser = users.find(u => u.email === session);
        if(currentUser) showProfile();
    }
    ensureThemeModal();
};

/* =========================
   AUDIO UI
   ========================= */
function playUiClick() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(740, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(330, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.045, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.10);
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

/* =========================
   THEME MODAL
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

    // ✅ CORREÇÃO: só fecha se clicar FORA da janela (não fecha ao clicar em temas)
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

        // ✅ clique no card = só foco (mostra botão), NÃO seleciona e NÃO fecha
        card.addEventListener('click', (ev) => {
            ev.stopPropagation();
            playUiClick();
            grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('is-focused'));
            card.classList.add('is-focused');
        });

        // ✅ clique no botão = seleciona tema
        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const id = card.getAttribute('data-theme');
            if (!id) return;

            playUiSelect();
            setTheme(id);

            // atualiza "ATIVO"
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

/* API do botão 🎨 */
function toggleTheme() {
    const modal = document.getElementById('theme-modal');
    if (!modal || !modal.classList.contains('active')) openThemeModal();
    else closeThemeModal();
}

/* setTheme */
function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('vasteria_theme', name);
}

/* =========================
   AUTH / HUB
   ========================= */
function toggleAuth() {
    const l = document.getElementById('login-box');
    const r = document.getElementById('register-box');
    l.style.display = l.style.display === 'none' ? 'block' : 'none';
    r.style.display = r.style.display === 'none' ? 'block' : 'none';
}

function previewUser(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (ev) => { 
            tempImg = ev.target.result; 
            document.getElementById('user-preview').style.backgroundImage = `url(${tempImg})`; 
            document.getElementById('user-preview').innerHTML = ''; 
        }
        reader.readAsDataURL(file);
    }
}

function realizarCadastro() {
    const nick = document.getElementById('reg-nick').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    if(!nick || !email || !pass) return alert("Preencha tudo.");
    
    const newUser = { apelido: nick, email, pass, heroes: [], userImg: tempImg };
    users.push(newUser); localStorage.setItem('nexus_db', JSON.stringify(users));
    currentUser = newUser; localStorage.setItem('nexus_session', email);
    showProfile();
}

function realizarLogin() {
    const login = document.getElementById('login-input').value;
    const pass = document.getElementById('login-pass').value;
    const user = users.find(u => (u.email === login || u.apelido === login) && u.pass === pass);
    if(user) { currentUser = user; localStorage.setItem('nexus_session', user.email); showProfile(); } 
    else alert("Dados incorretos.");
}

function logout() { localStorage.removeItem('nexus_session'); location.reload(); }

function showProfile() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('current-user-nick').innerText = currentUser.apelido.toUpperCase();
    if(currentUser.userImg) document.getElementById('current-user-img').style.backgroundImage = `url(${currentUser.userImg})`;
    renderHeroes();
}

function renderHeroes() {
    const list = document.getElementById('hero-list');
    list.innerHTML = "";
    if(!currentUser.heroes) currentUser.heroes = [];
    
    currentUser.heroes.forEach((h, idx) => {
        const bg = h.img ? `url(${h.img})` : 'linear-gradient(45deg, #333, #444)';
        list.innerHTML += `
            <div class="hero-card" onclick="abrirFicha(${idx})">
                <div class="hero-card-img" style="background-image: ${bg}"></div>
                <div class="hero-card-info">
                    <h4>${h.nome}</h4>
                    <p>${h.campaign || 'Aventureiro Solitário'}</p>
                    <p style="font-size:10px; margin-top:10px; opacity:0.6">Nível ${h.dados && h.dados['c-level'] ? h.dados['c-level'] : '1'}</p>
                </div>
            </div>
        `;
    });

    list.innerHTML += `
        <div class="hero-card create-card-slot" onclick="abrirModalCriacao()">
            <div class="plus-icon">+</div>
            <span style="font-family:'Cinzel'; font-weight:bold">CRIAR NOVO<br>PERSONAGEM</span>
        </div>
    `;
}

function abrirFicha(idx) { localStorage.setItem('nexus_current_hero_idx', idx); window.location.href = 'ficha.html'; }
function abrirModalCriacao() { document.getElementById('modal-create').style.display = 'flex'; }
function fecharModal() { document.getElementById('modal-create').style.display = 'none'; }

function previewChar(e) { 
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (ev) => { 
            tempImg = ev.target.result; 
            document.getElementById('char-preview').style.backgroundImage = `url(${tempImg})`; 
            document.getElementById('char-preview').innerHTML = ''; 
        }
        reader.readAsDataURL(file);
    }
}

function criarPersonagem() {
    const nome = document.getElementById('new-name').value;
    const player = document.getElementById('new-player').value;
    const camp = document.getElementById('new-campaign').value;
    if(!nome) return alert("Nome obrigatório");
    
    const newHero = {
        nome, player, campaign: camp, img: tempImg,
        dados: { "c-name": nome, "c-player": player, "c-campaign": camp, "c-level": "1", "c-prof": "+2" }
    };
    
    currentUser.heroes.push(newHero);
    localStorage.setItem('nexus_db', JSON.stringify(users));
    fecharModal(); renderHeroes(); tempImg = null;
}

function applyTheme() { const t = localStorage.getItem('vasteria_theme') || 'coffee'; setTheme(t); }
