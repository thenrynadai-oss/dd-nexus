/* =========================================================
   VASTERIA GATE — AUTH / STORAGE CORE (LOCAL)
   - Mantém o banco em localStorage: "nexus_db"
   - Sessão: "nexus_session" (usa UID para estabilidade)
   - Login por: apelido OU email OU celular
   - Cadastro: nome, apelido (único), foto, email ou celular, senha
   - Quickload: "nexus_quickload" (lista rápida de contas)
   ========================================================= */

(() => {
  "use strict";

  const DB_KEY = "nexus_db";
  const SESSION_KEY = "nexus_session";
  const QUICKLOAD_KEY = "nexus_quickload";

  // -----------------------------
  // Helpers
  // -----------------------------
  const nowISO = () => new Date().toISOString();

  const normalizeNick = (s) => (s || "").trim().toLowerCase();
  const normalizeEmail = (s) => (s || "").trim().toLowerCase();
  const normalizePhone = (s) => String(s || "").replace(/[^\d]+/g, ""); // só dígitos

  function makeUID(){
    return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);


// -----------------------------
// Cloud sync (Firestore) - debounce para não martelar
// -----------------------------
let __vgCloudTimer = null;
let __vgCloudQueue = {};

function __isRemoteMirrorId(id){
  const s = String(id || "");
  return s.startsWith("remote_hero_") || s.startsWith("remote_share_") || s.startsWith("remote_");
}

function __scheduleCloudUpsert(heroObj){
  try{
    if(!window.VGCloud || !VGCloud.enabled || !VGCloud.user) return;
    const id = heroObj?.id || heroObj?.heroId;
    if(!id || __isRemoteMirrorId(id)) return;
    __vgCloudQueue[id] = heroObj;

    clearTimeout(__vgCloudTimer);
    __vgCloudTimer = setTimeout(async ()=>{
      const batch = __vgCloudQueue;
      __vgCloudQueue = {};
      for(const k in batch){
        try{ await VGCloud.upsertHero(batch[k]); }catch(e){}
      }
    }, 400);
  }catch(e){}
}

function __scheduleCloudDelete(heroId){
  try{
    if(!window.VGCloud || !VGCloud.enabled || !VGCloud.user) return;
    if(!heroId || __isRemoteMirrorId(heroId)) return;

    // prefer deep delete (shares + listas)
    if(typeof VGCloud.deleteHeroDeep === "function"){
      VGCloud.deleteHeroDeep(String(heroId)).catch(()=>{});
      return;
    }

    // fallback
    if(typeof VGCloud.deleteHero === "function"){
      VGCloud.deleteHero(String(heroId)).catch(()=>{});
    }
  }catch(e){}
}

  }

  function safeJSONParse(raw, fallback){
    try{ return JSON.parse(raw); }catch{ return fallback; }
  }

  function loadDB(){
    const raw = localStorage.getItem(DB_KEY);
    let data = safeJSONParse(raw, []);
    // compat: se alguém salvou {users:[]}
    if(data && !Array.isArray(data) && Array.isArray(data.users)) data = data.users;
    if(!Array.isArray(data)) data = [];
    // normaliza e persiste uid se faltar
    let touched = false;
    data.forEach(u => {
      if(!u.uid){ u.uid = makeUID(); touched = true; }
      if(!u.heroes) u.heroes = [];
      if(u.userImg && !u.profileImg) u.profileImg = u.userImg; // compat antigo
      if(!u.createdAt) u.createdAt = nowISO();
      if(!u.updatedAt) u.updatedAt = nowISO();
    });
    if(touched) saveDB(data);
    return data;
  }

  function saveDB(users){
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  }

  function getSession(){
    return localStorage.getItem(SESSION_KEY);
  }

  function setSession(uid){
    localStorage.setItem(SESSION_KEY, uid);
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
  }

  function findUserByIdentifier(users, identifier){
    const raw = (identifier || "").trim();
    if(!raw) return { idx:-1, user:null };

    const email = raw.includes("@") ? normalizeEmail(raw) : "";
    const phone = !email ? normalizePhone(raw) : "";
    const nick  = !email && !phone ? normalizeNick(raw) : normalizeNick(raw); // nick pode ser qualquer

    // tenta por uid direto
    let idx = users.findIndex(u => u.uid === raw);
    if(idx !== -1) return { idx, user: users[idx] };

    // tenta por email
    if(email){
      idx = users.findIndex(u => normalizeEmail(u.email) === email);
      if(idx !== -1) return { idx, user: users[idx] };
    }

    // tenta por telefone
    if(phone){
      idx = users.findIndex(u => normalizePhone(u.phone) === phone);
      if(idx !== -1) return { idx, user: users[idx] };
    }

    // tenta por apelido
    idx = users.findIndex(u => normalizeNick(u.apelido) === nick);
    if(idx !== -1) return { idx, user: users[idx] };

    // fallback: alguns usuários antigos podem ter usado "email" como nick
    idx = users.findIndex(u => normalizeEmail(u.email) === normalizeEmail(raw));
    if(idx !== -1) return { idx, user: users[idx] };

    return { idx:-1, user:null };
  }

  // -----------------------------
  // Quickload
  // -----------------------------
  function loadQuickload(){
    const raw = localStorage.getItem(QUICKLOAD_KEY);
    const list = safeJSONParse(raw, []);
    return Array.isArray(list) ? list : [];
  }

  function saveQuickload(list){
    localStorage.setItem(QUICKLOAD_KEY, JSON.stringify(list));
  }

  function quickloadAdd(uid){
    if(!uid) return;
    const list = loadQuickload().filter(x => x !== uid);
    list.unshift(uid);
    // limite de 8
    while(list.length > 8) list.pop();
    saveQuickload(list);
  }

  function quickloadRemove(uid){
    const list = loadQuickload().filter(x => x !== uid);
    saveQuickload(list);
  }

  function quickloadClear(){
    saveQuickload([]);
  }

  function quickloadListUsers(){
    const users = loadDB();
    const list = loadQuickload();
    const out = [];
    for(const uid of list){
      const u = users.find(x => x.uid === uid);
      if(u) out.push(u);
    }
    return out;
  }

  // -----------------------------
  // Public API
  // -----------------------------
  function register({ nome, apelido, contato, pass, imgBase64, uidOverride }){
    const users = loadDB();

    const name = (nome || "").trim();
    const nick = (apelido || "").trim();
    const nickKey = normalizeNick(nick);

    const contactRaw = (contato || "").trim();
    const isEmail = contactRaw.includes("@");
    const email = isEmail ? normalizeEmail(contactRaw) : "";
    const phone = !isEmail ? normalizePhone(contactRaw) : "";

    const password = String(pass || "");

    if(!name) return { ok:false, msg:"Preencha seu nome." };
    if(!nick) return { ok:false, msg:"Preencha seu apelido." };
    if(nick.length < 3) return { ok:false, msg:"Apelido muito curto (mín. 3)." };
    if(!contactRaw) return { ok:false, msg:"Preencha Email ou Celular." };
    if(isEmail && !email.includes("@")) return { ok:false, msg:"Email inválido." };
    if(!isEmail && phone.length < 8) return { ok:false, msg:"Celular inválido." };
    if(password.length < 4) return { ok:false, msg:"Senha muito curta (mín. 4)." };

    // unicidade do apelido
    if(users.some(u => normalizeNick(u.apelido) === nickKey)){
      return { ok:false, msg:"Este apelido já existe. Escolha outro." };
    }

    // unicidade email/phone (se fornecidos)
    if(email && users.some(u => normalizeEmail(u.email) === email)){
      return { ok:false, msg:"Este email já está cadastrado." };
    }
    if(phone && users.some(u => normalizePhone(u.phone) === phone)){
      return { ok:false, msg:"Este celular já está cadastrado." };
    }

    const uid = uidOverride || makeUID();
    const newUser = {
      uid,
      nome: name,
      apelido: nick,
      email: email || "",
      phone: phone || "",
      pass: password,
      profileImg: imgBase64 || null,
      heroes: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    users.push(newUser);
    saveDB(users);

    setSession(uid);
    quickloadAdd(uid);

    return { ok:true, msg:"Conta criada!", user: newUser };
  }

  function login({ identifier, pass }){
    const users = loadDB();
    const id = (identifier || "").trim();
    const password = String(pass || "");

    if(!id) return { ok:false, msg:"Digite seu apelido / email / celular." };
    if(!password) return { ok:false, msg:"Digite sua senha." };

    const { idx, user } = findUserByIdentifier(users, id);
    if(!user) return { ok:false, msg:"Conta não encontrada." };
    if(String(user.pass) !== password) return { ok:false, msg:"Senha incorreta." };

    // garante uid
    if(!user.uid){
      user.uid = makeUID();
      users[idx] = user;
      saveDB(users);
    }

    setSession(user.uid);
    quickloadAdd(user.uid);
    return { ok:true, msg:"Login ok!", user };
  }

  function logout(){
    clearSession();
  }

  function getCurrentUser(){
    const users = loadDB();
    const sess = getSession();
    if(!sess) return null;

    // sessão nova: uid
    let u = users.find(x => x.uid === sess);
    if(u) return u;

    // compat: sessão antiga pode ser email/phone/nick
    const found = findUserByIdentifier(users, sess);
    if(found.user){
      // migra sessão para uid
      setSession(found.user.uid);
      return found.user;
    }
    return null;
  }

  function requireSession({ redirectTo } = {}){
    const u = getCurrentUser();
    if(u) return true;
    if(redirectTo) window.location.href = redirectTo;
    return false;
  }

  function updateCurrentUser(patch){
    const users = loadDB();
    const u = getCurrentUser();
    if(!u) return { ok:false, msg:"Sem sessão." };
    const idx = users.findIndex(x => x.uid === u.uid);
    if(idx === -1) return { ok:false, msg:"Conta não encontrada." };

    // Não deixa trocar apelido para algo repetido
    if(patch && typeof patch.apelido === "string"){
      const next = patch.apelido.trim();
      const nextKey = normalizeNick(next);
      if(next && users.some((x,i)=> i!==idx && normalizeNick(x.apelido)===nextKey)){
        return { ok:false, msg:"Este apelido já existe." };
      }
      patch.apelido = next;
    }

    users[idx] = {
      ...users[idx],
      ...patch,
      updatedAt: nowISO(),
    };
    saveDB(users);
    return { ok:true, user: users[idx] };
  }

  // -----------------------------
  // Heroes API (compat com sheet antigo)
  // -----------------------------
  function getHeroes(){
    const u = getCurrentUser();
    return u?.heroes || [];
  }

  function setCurrentHeroIndex(idx){
    localStorage.setItem("nexus_current_hero_idx", String(idx));
  }

  function getCurrentHeroIndex(){
    const v = localStorage.getItem("nexus_current_hero_idx");
    if(v === null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }

  function addHero(heroObj){
    const users = loadDB();
    const u = getCurrentUser();
    if(!u) return { ok:false, msg:"Sem sessão." };
    const idxU = users.findIndex(x => x.uid === u.uid);
    if(idxU === -1) return { ok:false, msg:"Conta não encontrada." };

    if(!users[idxU].heroes) users[idxU].heroes = [];
    users[idxU].heroes.push(heroObj);
    users[idxU].updatedAt = nowISO();
    saveDB(users);
    return { ok:true };
  }

  function updateHero(heroIndex, heroObj){
    const users = loadDB();
    const u = getCurrentUser();
    if(!u) return { ok:false, msg:"Sem sessão." };
    const idxU = users.findIndex(x => x.uid === u.uid);
    if(idxU === -1) return { ok:false, msg:"Conta não encontrada." };

    if(!users[idxU].heroes) users[idxU].heroes = [];
    if(heroIndex < 0 || heroIndex >= users[idxU].heroes.length) return { ok:false, msg:"Herói inválido." };

    users[idxU].heroes[heroIndex] = heroObj;
    users[idxU].updatedAt = nowISO();
    saveDB(users);

    // Cloud autosync (debounced)
    __scheduleCloudUpsert(heroObj);

    return { ok:true };
  }

  function deleteHero(heroIndex){
    const users = loadDB();
    const u = getCurrentUser();
    if(!u) return { ok:false, msg:"Sem sessão." };
    const idxU = users.findIndex(x => x.uid === u.uid);
    if(idxU === -1) return { ok:false, msg:"Conta não encontrada." };

    if(!users[idxU].heroes) users[idxU].heroes = [];
    const heroObj = users[idxU].heroes[heroIndex] || null;
    users[idxU].heroes.splice(heroIndex, 1);
    users[idxU].updatedAt = nowISO();
    saveDB(users);

    // Cloud delete cascade (best-effort)
    __scheduleCloudDelete(heroObj && (heroObj.id || heroObj.heroId));

    return { ok:true };
  }

  // cria herói padrão com IDs compatíveis com sheet.js antigo
  function createDefaultHero(nome){
    const n = (nome || "Novo Herói").trim() || "Novo Herói";
    return {
      nome: n,
      player: "",
      campaign: "",
      img: null,
      dados: {
        "c-name": n,
        "c-player": "",
        "c-campaign": "",
        "c-level": "1",
        "c-prof": "+2",
      }
    };
  }

  // -----------------------------
  // Cloud bridge (Firebase)
  // -----------------------------
  function makeSafeNickBase(s){
    return normalizeNick(String(s || "")).replace(/[^a-z0-9_\-\.]/g, "").slice(0, 18) || "agente";
  }

  function uniqueNickForDB(users, base, uid){
    let nick = makeSafeNickBase(base);
    if(!nick) nick = "agente";
    const exists = (n) => users.some(u => normalizeNick(u.apelido) === normalizeNick(n) && u.uid !== uid);
    if(!exists(nick)) return nick;

    for(let i=0;i<30;i++){
      const suf = Math.random().toString(36).slice(2,6);
      const tryNick = (nick + "_" + suf).slice(0, 22);
      if(!exists(tryNick)) return tryNick;
    }
    return (nick + "_" + Date.now().toString(36).slice(-4)).slice(0, 22);
  }

  function upsertCloudUser({ uid, nome, apelido, email, phone, profileImg, provider } = {}){
    if(!uid) return { ok:false, msg:"UID inválido." };
    const users = loadDB();
    const idx = users.findIndex(u => u.uid === uid);

    const baseNick = apelido || (email ? email.split("@")[0] : "") || nome || "agente";
    const safeNick = uniqueNickForDB(users, baseNick, uid);

    const patch = {
      uid,
      nome: (nome || "").trim() || (idx>=0 ? users[idx].nome : "Agente"),
      apelido: safeNick,
      email: email ? normalizeEmail(email) : (idx>=0 ? users[idx].email : ""),
      phone: phone ? normalizePhone(phone) : (idx>=0 ? users[idx].phone : ""),
      profileImg: profileImg || (idx>=0 ? users[idx].profileImg : null),
      cloudProvider: provider || (idx>=0 ? users[idx].cloudProvider : null),
      updatedAt: nowISO(),
    };

    if(idx === -1){
      const newUser = {
        ...patch,
        pass: users[idx]?.pass || "", // não usado em Google, mas mantém compat
        heroes: [],
        createdAt: nowISO(),
      };
      users.push(newUser);
      saveDB(users);
      return { ok:true, user:newUser };
    }else{
      users[idx] = { ...users[idx], ...patch };
      if(!users[idx].createdAt) users[idx].createdAt = nowISO();
      saveDB(users);
      return { ok:true, user: users[idx] };
    }
  }

  function setSessionUID(uid){
    if(!uid) return { ok:false, msg:"UID inválido." };
    setSession(uid);
    quickloadAdd(uid);
    return { ok:true };
  }


  // expõe global
  window.Auth = {
    // db / sessão
    loadDB, saveDB,
    getCurrentUser,
    requireSession,
    register, login, logout,
    updateCurrentUser,


    // cloud bridge
    upsertCloudUser,
    setSessionUID,
    // heroes
    getHeroes,
    addHero,
    updateHero,
    deleteHero,
    setCurrentHeroIndex,
    getCurrentHeroIndex,
    createDefaultHero,

    // quickload
    quickload: {
      listUsers: quickloadListUsers,
      add: quickloadAdd,
      remove: quickloadRemove,
      clear: quickloadClear,
    }
  };
})();
