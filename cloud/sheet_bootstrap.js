/* =========================================================
   SHEET BOOTSTRAP
   - Abre ficha via ?hid= (público) ou ?share= (token)
   - NÃO salva "ficha espelho" no nexus_db (para não cair em "Meus personagens")
   - Patches temporários no Auth apenas nesta página (ficha.html)
   ========================================================= */
(() => {
  "use strict";
  if(!window.Auth) return;

  const params = new URLSearchParams(window.location.search);
  const hid = params.get("hid");
  const share = params.get("share");
  const mode = (params.get("mode") || "read").toLowerCase();

  if(!hid && !share) return;

  // expõe para collab.js
  window.__VG_REMOTE = hid
    ? { type:"hero", id: hid, mode }
    : { type:"share", id: share, mode };

  // precisa de sessão local para o app (Auth)
  const _origGetUser = Auth.getCurrentUser?.bind(Auth);
  const _origGetHeroes = Auth.getHeroes?.bind(Auth);
  const _origGetIdx = Auth.getCurrentHeroIndex?.bind(Auth);
  const _origSetIdx = Auth.setCurrentHeroIndex?.bind(Auth);
  const _origUpdateHero = Auth.updateHero?.bind(Auth);
  const _origDeleteHero = Auth.deleteHero?.bind(Auth);

  let realUser = _origGetUser ? _origGetUser() : null;
  if(!realUser) return;

  // limpa clones antigos (gerados por versões anteriores)
  try{
    const arr = (realUser.heroes || []);
    const idxs = [];
    for(let i=0;i<arr.length;i++){
      const id = arr[i]?.id;
      if(typeof id === "string" && (id.startsWith("remote_hero_") || id.startsWith("remote_share_"))){
        idxs.push(i);
      }
    }
    if(idxs.length && typeof _origDeleteHero === "function"){
      idxs.sort((a,b)=>b-a).forEach(i=>{
        try{ _origDeleteHero(i); }catch{}
      });
      // re-le o usuário após limpeza
      realUser = _origGetUser ? _origGetUser() : realUser;
    }
  }catch{}

  // cria herói temporário em memória
  const key = hid ? `remote_hero_${hid}` : `remote_share_${share}`;
  let tempHero = Auth.createDefaultHero?.("Carregando...") || { nome:"Carregando...", dados:{} };
  if(!tempHero.dados) tempHero.dados = {};
  tempHero.id = key;
  tempHero.visibility = "public";
  tempHero.allowPublicEdit = false;
  tempHero._cloud = { ...window.__VG_REMOTE };
  tempHero._tempRemote = true;

  let tempHeroes = [ ...(realUser.heroes || []), tempHero ];
  let tempIdx = tempHeroes.length - 1;

  const getTempUser = () => ({ ...realUser, heroes: tempHeroes });

  // patcha Auth APENAS nesta página
  Auth.getCurrentUser = () => getTempUser();
  Auth.getHeroes = () => tempHeroes;
  Auth.getCurrentHeroIndex = () => tempIdx;
  Auth.setCurrentHeroIndex = (idx) => {
    const n = parseInt(idx, 10);
    if(Number.isFinite(n)) tempIdx = n;
  };

  Auth.updateHero = (idx, heroObj) => {
    const n = parseInt(idx, 10);
    if(Number.isFinite(n) && n === tempIdx){
      tempHero = heroObj;
      tempHeroes[tempIdx] = heroObj;
      return { ok:true };
    }
    // fallback p/ heróis reais (se alguém tentar)
    if(typeof _origUpdateHero === "function") return _origUpdateHero(n, heroObj);
    return { ok:false };
  };

  // não grava índice no localStorage (evita bagunçar o HOME)
})();