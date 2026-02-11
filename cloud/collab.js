/* =========================================================
   SHEET COLLAB
   - Public heroes: LER ou EDITAR (multiplayer realtime) com toggle allowPublicEdit
   - Share rooms: ficha via link ?share=token + popup add shared
   - Presence (Google Docs style)
   - Toggle de EDIÇÃO PÚBLICA dentro do modal do lápis (config)
   ========================================================= */
(() => {
  "use strict";

  const qs = (s)=>document.querySelector(s);
  const qsa = (s)=>Array.from(document.querySelectorAll(s));

  function getLocalProfile(){
    try{
      const u = window.Auth?.getCurrentUser?.();
      return u ? { name: u.name, photoURL: u.profileImg, nick: u.nick } : null;
    }catch{ return null; }
  }

  function setReadOnly(ro){
    qsa(".save-field").forEach(el=>{
      if(ro){
        el.setAttribute("data-prev-disabled", el.disabled ? "1":"0");
        el.disabled = true;
      }else{
        const prev = el.getAttribute("data-prev-disabled");
        if(prev === "0") el.disabled = false;
      }
    });
  }

  function ensureShareModal(){
    if(qs("#vg-share-modal")) return;

    const modal = document.createElement("div");
    modal.className = "vg-share-modal";
    modal.id = "vg-share-modal";
    modal.innerHTML = `
      <div class="box">
        <h3 style="margin:0 0 10px;">Compartilhar ficha</h3>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
          <button class="primary" id="vg-share-read">Gerar link (LER)</button>
          <button id="vg-share-edit">Gerar link (EDITAR)</button>
        </div>
        <input id="vg-share-link" readonly value="" />
        <div class="row">
          <button id="vg-copy">COPIAR</button>
          <button id="vg-close">FECHAR</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    qs("#vg-close")?.addEventListener("click", ()=> modal.style.display="none");
    modal.addEventListener("click", (e)=>{ if(e.target === modal) modal.style.display="none"; });

    qs("#vg-copy")?.addEventListener("click", async ()=>{
      const inp = qs("#vg-share-link");
      try{ await navigator.clipboard.writeText(inp.value); }catch{}
      inp.select(); document.execCommand("copy");
    });
  }

  function renderPresence(users){
    const box = qs("#vg-presence");
    if(!box) return;
    box.innerHTML = "";
    const now = Date.now();
    const alive = (users||[]).filter(u => (now - (u.lastSeenMs||0)) < 45000).slice(0, 8);

    alive.forEach(u=>{
      const b = document.createElement("div");
      b.className = "vg-bubble";
      b.title = u.name || "Agente";
      if(u.photoURL) b.style.backgroundImage = `url(${u.photoURL})`;
      else b.textContent = (u.name||"A").slice(0,1).toUpperCase();
      box.appendChild(b);
    });

    if(!alive.length){
      box.innerHTML = `<span style="color:rgba(255,255,255,.65); font-size:12px;">ninguém online</span>`;
    }
  }

  window.addEventListener("vg_presence_update", (e)=>{
    renderPresence(e.detail.users || []);
  });

  function mountHeaderTools(){
    const header = qs(".hero-card-floating") || qs(".sheet-header-floating") || document.body;

    // presence pill
    if(!qs("#vg-presence")){
      const p = document.createElement("div");
      p.id = "vg-presence";
      p.className = "vg-presence";
      p.style.marginLeft = "10px";
      p.title = "Quem está nessa ficha agora";
      header.appendChild(p);
    }

    const pencilBtn = qs("#btn-edit-character");
    if(!pencilBtn) return;

    // remove legacy buttons (versões antigas)
    const legacyOwner = qs("#vg-btn-owner");
    if(legacyOwner) legacyOwner.remove();
    const legacyShare = qs("#vg-btn-share");
    if(legacyShare) legacyShare.remove();

    // create gear + menu
    if(!qs("#vg-btn-gear")){
      const gearBtn = document.createElement("button");
      gearBtn.id = "vg-btn-gear";
      gearBtn.className = "vg-gear-btn";
      gearBtn.type = "button";
      gearBtn.title = "Opções";
      gearBtn.setAttribute("aria-label","Opções");
      gearBtn.textContent = "⚙️";
      pencilBtn.insertAdjacentElement("afterend", gearBtn);

      const menu = document.createElement("div");
      menu.id = "vg-gear-menu";
      menu.className = "vg-gear-menu";
      menu.innerHTML = `
        <div class="vg-gear-owner" id="vg-gear-owner">
          <div class="vg-owner-avatar" id="vg-owner-avatar" aria-hidden="true"></div>
          <div class="vg-owner-meta">
            <div class="vg-owner-label">DONO ORIGINAL</div>
            <div class="vg-owner-name" id="vg-owner-name">---</div>
          </div>
        </div>

        <button id="vg-menu-share" class="vg-gear-action" type="button" title="Compartilhar ficha">
          <span class="ic">🔗</span>
          <span>Compartilhar</span>
        </button>
      `;
      gearBtn.insertAdjacentElement("afterend", menu);

      ensureShareModal();

      const closeMenu = ()=>{ menu.classList.remove("open"); };

      gearBtn.addEventListener("click", (e)=>{
        e.stopPropagation();
        menu.classList.toggle("open");
      });
      menu.addEventListener("click", (e)=> e.stopPropagation());
      document.addEventListener("click", closeMenu);

      const shareAction = menu.querySelector("#vg-menu-share");
      if(shareAction){
        shareAction.addEventListener("click", ()=>{
          closeMenu();
          const m = qs("#vg-share-modal");
          if(m) m.style.display = "flex";
        });
      }
    }
  }

  function ensurePencilToggle(){
    const modal = qs("#modal-edit-character");
    if(!modal) return;
    if(qs("#vg-public-edit-field")) return;

    const card = modal.querySelector(".modal-card");
    if(!card) return;

    const anchor = card.querySelector(".row-btn");
    const field = document.createElement("div");
    field.className = "field";
    field.id = "vg-public-edit-field";
    field.style.display = "none";
    field.innerHTML = `
      <label>Edição pública</label>
      <div class="vg-seg" id="vg-public-edit-seg">
        <button type="button" data-edit="0" class="active">DESLIGADA</button>
        <button type="button" data-edit="1">LIGADA</button>
      </div>
      <div style="margin-top:10px; color:rgba(255,255,255,.7); font-size:12px;">
        Se ligado, qualquer pessoa logada pode editar (multiplayer).
      </div>
    `;
    anchor?.insertAdjacentElement("beforebegin", field);
  }

  function applyHeroToUI(hero){
    if(!hero) return;

    const name = (hero.nome || hero.dados?.["c-name"] || "").toString();
    const player = (hero.player || hero.dados?.["c-player"] || "").toString();
    const dn = document.getElementById("display-name");
    const dp = document.getElementById("display-player");
    if(dn && name) dn.innerText = name.toUpperCase();
    if(dp && player) dp.innerText = player.toUpperCase();

    const av = document.getElementById("sheet-avatar");
    if(av && hero.img) av.style.backgroundImage = `url(${hero.img})`;

    const focused = document.activeElement?.id;
    const dados = hero.dados || {};
    Object.keys(dados).forEach((k)=>{
      if(k === focused) return;
      const el = document.getElementById(k);
      if(!el) return;
      if(el.type === "checkbox") el.checked = !!dados[k];
      else el.value = dados[k];
    });

    try{ window.calcStats?.(); }catch{}
    try{ window.calcSpells?.(); }catch{}
  }

  function collectHeroFromUI(){
    const hero = { dados:{} };
    qsa(".save-field").forEach(el=>{
      if(!el.id) return;
      hero.dados[el.id] = (el.type === "checkbox") ? !!el.checked : el.value;
    });
    hero.nome = hero.dados["c-name"] || "";
    hero.player = hero.dados["c-player"] || "";
    hero.campaign = hero.dados["c-campaign"] || "";
    const av = document.getElementById("sheet-avatar");
    if(av){
      const bg = av.style.backgroundImage || "";
      const m = bg.match(/url\(["']?(.*?)["']?\)/i);
      hero.img = m ? m[1] : null;
    }
    return hero;
  }

  // outbound patch builder (debounced) — supports base path "" or "data."
  function bindOutbound(send, basePrefix){
    let t = null;
    let pending = null;

    function queuePatch(p){
      pending = { ...(pending||{}), ...p };
      clearTimeout(t);
      t = setTimeout(()=>{
        const out = pending;
        pending = null;
        send(out);
      }, 180);
    }

    function buildPatch(el){
      const id = el.id;
      const v = (el.type === "checkbox") ? !!el.checked : el.value;

      const p = {};
      p[`${basePrefix}dados.${id}`] = v;

      if(id === "c-name") p[`${basePrefix}nome`] = v;
      if(id === "c-player") p[`${basePrefix}player`] = v;
      if(id === "c-campaign") p[`${basePrefix}campaign`] = v;

      return p;
    }

    document.addEventListener("input", (e)=>{
      const el = e.target;
      if(!el?.classList?.contains("save-field")) return;
      if(!el.id) return;
      queuePatch(buildPatch(el));
    });

    document.addEventListener("change", (e)=>{
      const el = e.target;
      if(!el?.classList?.contains("save-field")) return;
      if(!el.id) return;
      queuePatch(buildPatch(el));
    });
  }

  function wireShareButtons(make){
    const btnR = qs("#vg-share-read");
    const btnE = qs("#vg-share-edit");
    btnR && btnR.addEventListener("click", async ()=>{ await make("read"); });
    btnE && btnE.addEventListener("click", async ()=>{ await make("edit"); });
  }

  function setOwnerButton(owner){
    const nameEl = qs("#vg-owner-name");
    const avEl = qs("#vg-owner-avatar");
    if(!nameEl) return;

    if(!owner){
      nameEl.textContent = "---";
      if(avEl){ avEl.style.backgroundImage = ""; avEl.textContent = ""; }
      return;
    }

    const nm = (owner.name || "Dono").toString();
    nameEl.textContent = nm;

    if(avEl){
      if(owner.photoURL){
        avEl.style.backgroundImage = `url(${owner.photoURL})`;
        avEl.textContent = "";
      }else{
        avEl.style.backgroundImage = "";
        avEl.textContent = nm.trim().slice(0,1).toUpperCase();
      }
    }
  }

  // handle pencil toggle visibility + sync
  function wirePencilToggle(getState, setState){
    ensurePencilToggle();

    const field = qs("#vg-public-edit-field");
    const seg = qs("#vg-public-edit-seg");
    if(!field || !seg) return;

    function syncUI(){
      const st = getState();
      if(!st || !st.show){
        field.style.display = "none";
        return;
      }
      field.style.display = "";
      const on = !!st.value;
      seg.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
      seg.querySelector(`button[data-edit="${on ? "1" : "0"}"]`)?.classList.add("active");
    }

    seg.addEventListener("click", async (e)=>{
      const b = e.target.closest("button[data-edit]");
      if(!b) return;
      const v = (b.getAttribute("data-edit") === "1");
      try{ await setState(v); }catch{ alert("Não consegui atualizar a permissão agora."); }
      syncUI();
    });

    // quando o modal abrir, garantir estado
    const btnOpen = qs("#btn-edit-character");
    btnOpen?.addEventListener("click", ()=> setTimeout(syncUI, 0));

    syncUI();
  }

  window.addEventListener("load", async () => {
    mountHeaderTools();

    const remote = window.__VG_REMOTE || null;
    const params = new URLSearchParams(location.search);
    const share = params.get("share");
    const hid = params.get("hid");
    const mode = (params.get("mode") || "read").toLowerCase();

    if(!window.VGCloud){ return; }
    await VGCloud.init();
    if(!VGCloud.enabled) return;

    // precisa login cloud para online/share/public
    if((share || hid || remote) && !VGCloud.user){
      try{ await VGCloud.signInGoogle(); }catch{}
    }
    if((share || hid || remote) && !VGCloud.user){
      // sem cloud login, vira fallback local (read-only)
      setReadOnly(true);
      return;
    }

    const localProfile = getLocalProfile();
    try{ await VGCloud.upsertMyProfile(localProfile ? { name: localProfile.name, nick: localProfile.nick, profileImg: localProfile.photoURL } : null); }catch{}

    // -------- SHARE ROOM --------
    const shareId = share || (remote?.type==="share" ? remote.id : null);
    if(shareId){
      const want = confirm("Adicionar esta ficha na aba SHARED?");
      if(want){ try{ await VGCloud.addToMyShared(shareId); }catch{} }

      try{ await VGCloud.joinPresence("share", shareId, localProfile); }catch{}

      let current = null;
      VGCloud.watchShare(shareId, (doc) => {
        current = doc;
        const canEdit = (doc.mode === "edit");
        setReadOnly(!canEdit);
        applyHeroToUI(doc.data || {});
        setOwnerButton({ uid: doc.ownerUid, name: doc.ownerName, photoURL: doc.ownerPhotoURL });
        const shareBtn = qs("#vg-menu-share");
        if(shareBtn) shareBtn.style.display = (doc && doc.ownerUid === VGCloud.user.uid) ? "" : "none";
      });

      bindOutbound((patch) => {
        if(!current || current.mode !== "edit") return;
        VGCloud.patchShare(shareId, patch).catch(()=>{});
      }, "data.");

      wireShareButtons(async (m) => {
        const snap = collectHeroFromUI();
        const token = await VGCloud.createShareRoom(snap, m);
        qs("#vg-share-link").value = `${location.origin}${location.pathname}?share=${encodeURIComponent(token)}`;
      });

      // toggle no lápis não faz sentido pra share (depende do dono original)
      wirePencilToggle(()=>({show:false}), async ()=>{});
      return;
    }

    // -------- PUBLIC HERO --------
    const heroId = hid || (remote?.type==="hero" ? remote.id : null);
    if(heroId){
      try{ await VGCloud.joinPresence("hero", heroId, localProfile); }catch{}

      let currentHero = null;
      let warned = false;

      VGCloud.watchHero(heroId, (hero) => {
        currentHero = hero;

        const isOwner = (hero.ownerUid === VGCloud.user.uid);
        const canEdit = (mode === "edit") && (isOwner || hero.allowPublicEdit === true);

        if(mode === "edit" && !canEdit && !warned){
          warned = true;
          alert("O dono NÃO liberou edição pública. Abrindo em modo leitura.");
        }

        setReadOnly(!(canEdit));
        applyHeroToUI(hero || {});
        setOwnerButton({ uid: hero.ownerUid, name: hero.ownerName, photoURL: hero.ownerPhotoURL });

        // share button visible only for owner
        const shareBtn = qs("#vg-menu-share");
        if(shareBtn) shareBtn.style.display = isOwner ? "" : "none";
      });

      bindOutbound((patch) => {
        if(!currentHero) return;
        const isOwner = (currentHero.ownerUid === VGCloud.user.uid);
        const canEdit = (mode === "edit") && (isOwner || currentHero.allowPublicEdit === true);
        if(!canEdit) return;
        VGCloud.patchHero(heroId, patch).catch(()=>{});
      }, "");

      wireShareButtons(async (m) => {
        if(!currentHero || currentHero.ownerUid !== VGCloud.user.uid) return;
        const snap = collectHeroFromUI();
        const token = await VGCloud.createShareRoom(snap, m);
        qs("#vg-share-link").value = `${location.origin}${location.pathname}?share=${encodeURIComponent(token)}`;
      });

      // Toggle dentro do lápis (somente dono + ficha pública)
      wirePencilToggle(
        ()=>({
          show: !!(currentHero && currentHero.ownerUid === VGCloud.user.uid && currentHero.visibility === "public"),
          value: !!(currentHero && currentHero.allowPublicEdit)
        }),
        async (val)=>{
          if(!currentHero) return;
          if(currentHero.ownerUid !== VGCloud.user.uid) return;
          await VGCloud.patchHero(heroId, { allowPublicEdit: !!val });
        }
      );

      return;
    }

    // -------- Local hero sync (owner) --------
    // Se usuário está no cloud, mantém backup do hero atual também.
    // Não força realtime aqui, mas permite publicar e manter atualização.
    try{
      const u = Auth.getCurrentUser?.();
      const idx = Auth.getCurrentHeroIndex?.();
      const heroes = u?.heroes || [];
      const h = (idx!=null && heroes[idx]) ? heroes[idx] : null;
      if(h && h.id){
        await VGCloud.upsertHero(h);
        setOwnerButton({ uid: VGCloud.user.uid, name: VGCloud.user.displayName, photoURL: VGCloud.user.photoURL });
      }
    }catch{}
  });
})();