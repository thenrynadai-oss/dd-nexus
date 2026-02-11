/* =========================================================
   SHEET BOOTSTRAP
   - Permite abrir ficha via ?hid= (público) ou ?share= (token)
   - Cria uma "ficha espelho" no nexus_db para o sheet.js NÃO redirecionar
   - Collab.js assume a sincronização realtime em cima disso
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
  window.__VG_REMOTE = hid ? { type:"hero", id: hid, mode } : { type:"share", id: share, mode };

  // precisa de sessão local para o app (Auth)
  const u = Auth.getCurrentUser?.();
  if(!u) return;

  const key = hid ? `remote_hero_${hid}` : `remote_share_${share}`;

  // procura ficha espelho
  const heroes = Auth.getHeroes?.() || [];
  let idx = heroes.findIndex(h => h && h.id === key);

  if(idx === -1){
    const h = Auth.createDefaultHero?.("Carregando...");
    if(!h) return;
    h.id = key;
    h.visibility = "public";
    h.allowPublicEdit = false;
    h._cloud = { ...window.__VG_REMOTE };
    Auth.addHero?.(h);

    const heroes2 = Auth.getHeroes?.() || [];
    idx = heroes2.findIndex(x => x && x.id === key);
  }else{
    // atualiza metadados cloud
    const cur = heroes[idx];
    cur._cloud = { ...window.__VG_REMOTE };
    Auth.updateHero?.(idx, cur);
  }

  if(idx !== -1){
    Auth.setCurrentHeroIndex?.(idx);
  }
})();