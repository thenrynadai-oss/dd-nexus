// Importa o banco de dados
import { db, doc, setDoc, onSnapshot } from './firebase-init.js';

const ATTR = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];
const SKILLS_LIST = [
    { name: "Acrobacia", attr: "DES" }, { name: "Adestrar Animais", attr: "SAB" },
    { name: "Arcanismo", attr: "INT" }, { name: "Atletismo", attr: "FOR" },
    { name: "Atuação", attr: "CAR" }, { name: "Enganação", attr: "CAR" },
    { name: "Furtividade", attr: "DES" }, { name: "História", attr: "INT" },
    { name: "Intimidação", attr: "CAR" }, { name: "Intuição", attr: "SAB" },
    { name: "Investigação", attr: "INT" }, { name: "Medicina", attr: "SAB" },
    { name: "Natureza", attr: "INT" }, { name: "Percepção", attr: "SAB" },
    { name: "Persuasão", attr: "CAR" }, { name: "Prestidigitação", attr: "DES" },
    { name: "Religião", attr: "INT" }, { name: "Sobrevivência", attr: "SAB" }
];

// Dados da Sessão Local
const sessionEmail = localStorage.getItem('nexus_session');
const heroIdx = localStorage.getItem('nexus_current_hero_idx') || 0;

let currentHeroData = {}; 

window.onload = () => {
    const savedTheme = localStorage.getItem('vasteria_theme');
    if(savedTheme) setTheme(savedTheme);

    if(!sessionEmail) { window.location.href = 'index.html'; return; }

    // Monta o visual
    gerarEstrutura(); 
    gerarGrimorio();
    setupAudio();

    // 🔴 INICIA A CONEXÃO E MIGRAÇÃO
    iniciarSincronizacao();

    // Eventos de Input
    document.addEventListener('input', (e) => {
        if(e.target.classList.contains('save-field')) {
            saveDataToCloud(e.target);
            if(shouldRecalc(e.target.id)) calcStats();
        }
    });

    window.addEventListener('storage', (e) => {
        if(e.key === 'vasteria_theme') setTheme(e.newValue);
    });
};

// =================== FIREBASE & MIGRAÇÃO ===================

async function iniciarSincronizacao() {
    console.log("📡 Conectando ao Vasteria Cloud...");
    const userRef = doc(db, "users", sessionEmail);

    // OUVINTE EM TEMPO REAL
    onSnapshot(userRef, async (docSnap) => {
        // 1. Se não existir nada na nuvem, tenta MIGRAR do LocalStorage
        if (!docSnap.exists()) {
            console.warn("Nuvem vazia! Tentando migrar dados locais...");
            await verificarMigracao(userRef);
            return; // O snapshot vai rodar de novo assim que a migração terminar
        }

        const data = docSnap.data();
        
        // 2. Se a nuvem existe mas não tem heróis (ou o índice tá errado)
        if (!data.heroes || !data.heroes[heroIdx]) {
            console.warn("Herói não encontrado na nuvem. Tentando migrar...");
            await verificarMigracao(userRef);
            return;
        }

        // 3. SUCESSO: Dados encontrados! Atualiza a tela.
        console.log("✅ Dados recebidos da Nuvem!");
        currentHeroData = data.heroes[heroIdx];
        atualizarTela(currentHeroData);
    });
}

// 🔄 FUNÇÃO DE MIGRAÇÃO (A Mágica)
async function verificarMigracao(userRef) {
    try {
        // Pega o banco de dados antigo do PC
        const localDB = JSON.parse(localStorage.getItem('nexus_db')) || [];
        const localUser = localDB.find(u => u.email === sessionEmail);

        if (localUser) {
            // Envia TUDO o que tem no PC para o Firebase
            await setDoc(userRef, localUser, { merge: true });
            console.log("🚀 SUCESSO: Personagem migrado do PC para a Nuvem!");
            alert("Seu personagem foi sincronizado com a Nuvem Vasteria!");
        } else {
            console.error("Erro: Nenhum dado local encontrado para salvar.");
        }
    } catch (error) {
        console.error("Falha na migração:", error);
    }
}

function atualizarTela(heroData) {
    // Garante que não venha null
    const nome = heroData.nome || heroData.name || "Desconhecido"; // Tenta 'nome' ou 'name'
    const player = heroData.player || "---";
    const img = heroData.img || heroData.image || "";

    document.getElementById('display-name').innerText = nome.toUpperCase();
    document.getElementById('display-player').innerText = player.toUpperCase();
    
    // Tratamento de imagem
    if(img) {
        document.getElementById('sheet-avatar').style.backgroundImage = `url(${img})`;
    } else {
        document.getElementById('sheet-avatar').style.backgroundColor = "rgba(0,0,0,0.3)";
    }

    // Preenche Inputs
    if(heroData.dados) {
        Object.keys(heroData.dados).forEach(k => {
            const el = document.getElementById(k);
            if(el && document.activeElement !== el) {
                if(el.type === 'checkbox') el.checked = heroData.dados[k];
                else el.value = heroData.dados[k];
            }
        });
    }
    calcStats();
    calcSpells();
}

async function saveDataToCloud(el) {
    const fieldId = el.id;
    const value = el.type === 'checkbox' ? el.checked : el.value;

    // Atualiza objeto local pra resposta instantânea
    if(!currentHeroData.dados) currentHeroData.dados = {};
    currentHeroData.dados[fieldId] = value;

    // Salva na nuvem (Deep Merge manual para garantir)
    // Estamos construindo o objeto aninhado: { heroes: { [0]: { dados: { [campo]: valor } } } }
    const heroUpdate = {};
    heroUpdate[heroIdx] = { 
        ...currentHeroData, // Mantém dados antigos do herói
        dados: {
            ...currentHeroData.dados, // Mantém outros dados
            [fieldId]: value // Atualiza só o novo
        }
    };

    try {
        const userRef = doc(db, "users", sessionEmail);
        // Usamos setDoc com merge para atualizar estruturas profundas sem apagar arrays
        await setDoc(userRef, { heroes: heroUpdate }, { merge: true });
    } catch (e) {
        console.error("Erro ao salvar:", e);
    }
}

// =================== LÓGICA ESTRUTURAL ===================
function shouldRecalc(id) {
    return id.startsWith('score-') || id === 'c-prof' || 
           id.startsWith('train-') || id.startsWith('other-') || 
           id.startsWith('prof-') || id === 'spell-ability';
}

function gerarEstrutura() {
    const attrCont = document.getElementById('attr-container'); attrCont.innerHTML = "";
    ATTR.forEach(a => { attrCont.innerHTML += `<div class="attr-row"><span style="font-weight:bold; font-size:14px">${a}</span><input id="score-${a}" class="attr-val save-field" value="10" type="number"><span id="mod-${a}" class="attr-mod">+0</span></div>`; });

    const saveCont = document.getElementById('saves-container'); 
    saveCont.innerHTML = `<div class="skill-header-row"><span></span><span class="text-left">NOME</span><span>ATR</span><span>PROF</span><span>BÔNUS</span><span>TREINO</span><span>OUTRO</span></div>`;
    ATTR.forEach(a => { 
        saveCont.innerHTML += `<div class="skill-row-pro"><button class="skill-icon-btn" onclick="window.rollSkill('Salvaguarda ${a}', 'total-save-${a}')"><svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg></button><div class="skill-name-pro">Salvaguarda</div><div class="skill-attr-display">(${a})</div><input type="checkbox" id="prof-save-${a}" class="prof-check save-field"><div id="total-save-${a}" class="skill-total-display">+0</div><input type="number" id="train-save-${a}" class="skill-input-line save-field" placeholder="0"><input type="number" id="other-save-${a}" class="skill-input-line save-field" placeholder="0"></div>`; 
    });

    const skillCont = document.getElementById('skills-container');
    skillCont.innerHTML = `<div class="skill-header-row"><span></span><span class="text-left">NOME</span><span>ATR</span><span>PROF</span><span>BÔNUS</span><span>TREINO</span><span>OUTRO</span></div>`;
    SKILLS_LIST.forEach(s => {
        const idName = s.name.replace(/\s+/g, '-').toLowerCase();
        skillCont.innerHTML += `<div class="skill-row-pro"><button class="skill-icon-btn" onclick="window.rollSkill('${s.name}', 'total-skill-${idName}')"><svg viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/></svg></button><div class="skill-name-pro">${s.name}</div><div class="skill-attr-display">(${s.attr})</div><input type="checkbox" id="prof-skill-${idName}" class="prof-check save-field"><div id="total-skill-${idName}" class="skill-total-display">+0</div><input type="number" id="train-skill-${idName}" class="skill-input-line save-field" placeholder="0"><input type="number" id="other-skill-${idName}" class="skill-input-line save-field" placeholder="0"></div>`;
    });
}

function gerarGrimorio() {
    const spellsArea = document.getElementById('spells-area'); spellsArea.innerHTML = "";
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
    const abilityEl = document.getElementById('spell-ability');
    if(!abilityEl) return;
    const ability = abilityEl.value;
    const mod = parseInt(document.getElementById(`mod-${ability}`).innerText);
    const prof = parseInt(document.getElementById('c-prof').value) || 2;
    document.getElementById('spell-dc').innerText = 8 + mod + prof;
    const atk = mod + prof;
    document.getElementById('spell-atk').innerText = atk >= 0 ? `+${atk}` : atk;
}

window.rollSkill = function(name, elementId) {
    playClickSound();
    const totalText = document.getElementById(elementId).innerText;
    const bonus = parseInt(totalText);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const final = d20 + bonus;
    const modal = document.getElementById('quickroll-modal');
    modal.style.display = 'flex';
    document.getElementById('roll-result-val').innerText = final;
    document.getElementById('d20-number').innerText = d20;
    let detail = `${name}: 🎲(${d20}) + ${bonus}`;
    if(d20 === 20) { detail = "CRÍTICO! " + detail; document.getElementById('roll-result-val').style.color = "#ffd700"; }
    else if(d20 === 1) { detail = "FALHA CRÍTICA! " + detail; document.getElementById('roll-result-val').style.color = "#ff4444"; }
    else { document.getElementById('roll-result-val').style.color = "var(--accent)"; }
    document.getElementById('roll-result-detail').innerText = detail;
};

window.voltarParaHome = function() { window.location.href = 'index.html'; };
window.toggleGlobe = function() { playClickSound(); document.getElementById('globe-trigger').classList.toggle('active'); };
window.switchTab = function(id) {
    playClickSound();
    document.querySelectorAll('.page').forEach(p => p.style.display='none');
    document.getElementById(id).style.display='block';
    document.getElementById('globe-trigger').classList.remove('active');
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

function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('vasteria_theme', name);
}
window.setTheme = setTheme; 
window.toggleTheme = function() { playClickSound(); document.getElementById('theme-panel').classList.toggle('active'); };