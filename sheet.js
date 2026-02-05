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

let users = JSON.parse(localStorage.getItem('nexus_db')) || [];
let currentUser = null;
let heroIdx = null;

// =================== INIT ===================
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
    
    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('save-field')) {
            saveData(e.target);
            if(e.target.id.startsWith('score-') || e.target.id === 'c-prof' || e.target.id.startsWith('train-') || e.target.id.startsWith('other-')) {
                calcStats();
            }
        }
    });

    window.addEventListener('storage', (e) => {
        if(e.key === 'vasteria_theme') setTheme(e.newValue);
    });
};

function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('vasteria_theme', name);
}
function toggleTheme() { document.getElementById('theme-panel').classList.toggle('active'); }

// =================== CARREGAMENTO ===================
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

    const saveCont = document.getElementById('saves-container'); saveCont.innerHTML = "";
    ATTR.forEach(a => { 
        saveCont.innerHTML += `
            <div class="skill-row-pro">
                <button class="skill-icon-btn" onclick="rollSkill('Salvaguarda ${a}', 'total-save-${a}')">
                   <svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg>
                </button>
                <div class="skill-name-pro">Salvaguarda</div>
                <div class="skill-attr-display">(${a})</div>
                <div id="total-save-${a}" class="skill-total-display">+0</div>
                <input type="number" id="train-save-${a}" class="skill-input-line save-field" placeholder="0">
                <input type="number" id="other-save-${a}" class="skill-input-line save-field" placeholder="0">
            </div>`; 
    });

    const skillCont = document.getElementById('skills-container'); skillCont.innerHTML = "";
    SKILLS_LIST.forEach(s => {
        const idName = s.name.replace(/\s+/g, '-').toLowerCase();
        skillCont.innerHTML += `
            <div class="skill-row-pro">
                <button class="skill-icon-btn" onclick="rollSkill('${s.name}', 'total-skill-${idName}')">
                   <svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg>
                </button>
                <div class="skill-name-pro">${s.name}</div>
                <div class="skill-attr-display">(${s.attr})</div>
                <div id="total-skill-${idName}" class="skill-total-display">+0</div>
                <input type="number" id="train-skill-${idName}" class="skill-input-line save-field" placeholder="0">
                <input type="number" id="other-skill-${idName}" class="skill-input-line save-field" placeholder="0">
            </div>`;
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

// =================== CÁLCULOS ===================
function calcStats() {
    let mods = {};
    ATTR.forEach(a => {
        const val = parseInt(document.getElementById(`score-${a}`).value) || 10;
        const mod = Math.floor((val - 10) / 2);
        mods[a] = mod;
        document.getElementById(`mod-${a}`).innerText = mod >= 0 ? `+${mod}` : mod;
    });
    
    ATTR.forEach(a => {
        const train = parseInt(document.getElementById(`train-save-${a}`).value) || 0;
        const other = parseInt(document.getElementById(`other-save-${a}`).value) || 0;
        const total = mods[a] + train + other;
        document.getElementById(`total-save-${a}`).innerText = total >= 0 ? `+${total}` : total;
    });

    SKILLS_LIST.forEach(s => {
        const idName = s.name.replace(/\s+/g, '-').toLowerCase();
        const train = parseInt(document.getElementById(`train-skill-${idName}`).value) || 0;
        const other = parseInt(document.getElementById(`other-skill-${idName}`).value) || 0;
        const total = mods[s.attr] + train + other;
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
    const totalText = document.getElementById(elementId).innerText;
    const bonus = parseInt(totalText);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const final = d20 + bonus;

    const modal = document.getElementById('quickroll-modal');
    const resultVal = document.getElementById('roll-result-val');
    const resultDet = document.getElementById('roll-result-detail');
    const d20Number = document.getElementById('d20-number');
    
    modal.style.display = 'flex';
    resultVal.innerText = final;
    d20Number.innerText = d20;
    
    let detail = `${name}: 🎲(${d20}) + ${bonus}`;
    if(d20 === 20) { detail = "CRÍTICO! " + detail; resultVal.style.color = "#ffd700"; }
    else if(d20 === 1) { detail = "FALHA CRÍTICA! " + detail; resultVal.style.color = "#ff4444"; }
    else { resultVal.style.color = "var(--accent)"; }
    resultDet.innerText = detail;
}

function saveData(el) {
    if(!currentUser.heroes[heroIdx].dados) currentUser.heroes[heroIdx].dados = {};
    currentUser.heroes[heroIdx].dados[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    localStorage.setItem('nexus_db', JSON.stringify(users));
}

function voltarParaHome() { window.location.href = 'index.html'; }
function toggleGlobe() { document.getElementById('globe-trigger').classList.toggle('active'); }
function switchTab(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display='none');
    document.getElementById(id).style.display='block';
    document.getElementById('globe-trigger').classList.remove('active');
}