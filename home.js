let users = JSON.parse(localStorage.getItem('nexus_db')) || [];
let currentUser = null;
let tempImg = null;

window.onload = () => {
    applyTheme(); // Carrega o tema do storage imediatamente
    const session = localStorage.getItem('nexus_session');
    if(session) {
        currentUser = users.find(u => u.email === session);
        if(currentUser) showProfile();
    }
};

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
        reader.onload = (ev) => { tempImg = ev.target.result; document.getElementById('user-preview').style.backgroundImage = `url(${tempImg})`; document.getElementById('user-preview').innerHTML = ''; }
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
    
    // Renderiza Personagens Existentes
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

    // Renderiza Botão de Criar Novo no FINAL
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
        reader.onload = (ev) => { tempImg = ev.target.result; document.getElementById('char-preview').style.backgroundImage = `url(${tempImg})`; document.getElementById('char-preview').innerHTML = ''; }
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

function toggleTheme() { document.getElementById('theme-panel').classList.toggle('active'); }
function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('vasteria_theme', name);
}
function applyTheme() { const t = localStorage.getItem('vasteria_theme') || 'coffee'; setTheme(t); }