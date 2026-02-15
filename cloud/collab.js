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

  function canonicalOrigin(){
    try{
      if(location && location.hostname === "dd-nexus.vercel.app") return location.origin;
    }catch{}
    return "https://dd-nexus.vercel.app";
  }

  function buildShareLink(token){
    return `${canonicalOrigin()}/ficha.html?share=${encodeURIComponent(token)}`;
  }


  function getLocalProfile(){
    try{
      const u = window.Auth?.getCurrentUser?.();
      return u ? { name: u.name, photoURL: u.profileImg, nick: u.nick } : null;
    }catch{ return null; }
  }

  function setReadOnly(ro){
    // Modo leitura: nada pode alterar dados (inputs + steppers + modais de edição)
    document.documentElement.classList.toggle("vg-readonly", !!ro);

    // Inputs principais
    qsa(".save-field").forEach(el=>{
      const tag = (el.tagName || "").toUpperCase();
      const isCheck = (el.type === "checkbox");

      if(ro){
        el.setAttribute("data-prev-disabled", el.disabled ? "1":"0");
        el.setAttribute("data-prev-readonly", el.readOnly ? "1":"0");
        el.setAttribute("data-prev-pe", el.style.pointerEvents || "");
        el.style.pointerEvents = "none";

        if(isCheck || tag === "SELECT") el.disabled = true;
        else el.readOnly = true;
      }else{
        const prevD = el.getAttribute("data-prev-disabled");
        const prevR = el.getAttribute("data-prev-readonly");
        const prevPE = el.getAttribute("data-prev-pe");

        el.style.pointerEvents = (prevPE != null) ? prevPE : "";
        if(prevD === "0") el.disabled = false;
        if(prevR === "0") el.readOnly = false;
      }
    });

    // Botões de +/- (atributos, perícias e steppers)
    qsa("button.step-btn, .glass-stepper .step-down, .glass-stepper .step-up").forEach(btn=>{
      if(ro){
        btn.setAttribute("data-prev-disabled", btn.disabled ? "1":"0");
        btn.disabled = true;
        btn.style.pointerEvents = "none";
      }else{
        const prev = btn.getAttribute("data-prev-disabled");
        if(prev === "0") btn.disabled = false;
        btn.style.pointerEvents = "";
      }
    });

    // Bloqueia edição do personagem (lápis) quando em leitura
    ["#btn-edit-character", "#btn-edit-char-save", "#btn-edit-char-pick", "#btn-edit-char-remove"].forEach(sel=>{
      const b = qs(sel);
      if(!b) return;
      if(ro){
        b.setAttribute("data-prev-disabled", b.disabled ? "1":"0");
        b.disabled = true;
        b.style.pointerEvents = "none";
      }else{
        const prev = b.getAttribute("data-prev-disabled");
        if(prev === "0") b.disabled = false;
        b.style.pointerEvents = "";
      }
    });

    // Qualquer contenteditable
    qsa('[contenteditable="true"]').forEach(el=>{
      if(ro) el.setAttribute("contenteditable","false");
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

    const now = Date.now();
    const alive = (users||[]).filter(u => (now - (u.lastSeenMs||0)) < 45000).slice(0, 8);

    // só mostrar quando tiver MAIS DE UMA pessoa usando
    const myUid = window.VGCloud?.user?.uid || null;
    let effective = alive.length;
    if(myUid && !alive.some(u => u.uid === myUid)) effective += 1;

    if(effective <= 1){
      box.classList.add("is-hidden");
      box.innerHTML = "";
      return;
    }

    box.classList.remove("is-hidden");
    box.innerHTML = "";

    alive.forEach(u=>{
      const b = document.createElement("div");
      b.className = "vg-bubble";
      b.title = u.name || "Agente";
      if(u.photoURL) b.style.backgroundImage = `url(${u.photoURL})`;
      else b.textContent = (u.name||"A").slice(0,1).toUpperCase();
      box.appendChild(b);
    });
  }

  window.addEventListener("vg_presence_update", (e)=>{
    renderPresence(e.detail.users || []);
  });

  function mountHeaderTools(){
    const header = qs(".hero-card-floating") || qs(".sheet-header-floating") || document.body;

    // Presence (só aparece quando tiver + de 1 pessoa)
    if(!qs("#vg-presence")){
      const p = document.createElement("div");
      p.id = "vg-presence";
      p.className = "vg-presence is-hidden";
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

    // Gear button (à ESQUERDA do lápis)
    let gearBtn = qs("#vg-btn-gear");
    if(!gearBtn){
      gearBtn = document.createElement("button");
      gearBtn.id = "vg-btn-gear";
      gearBtn.className = "vg-gear-btn";
      gearBtn.type = "button";
      gearBtn.title = "Opções";
      gearBtn.setAttribute("aria-label","Opções");
      gearBtn.textContent = "⚙️";
      pencilBtn.insertAdjacentElement("beforebegin", gearBtn);
    }

    // Menu no BODY (não corta e não fica atrás de nada)
    let menu = qs("#vg-gear-menu");
    if(!menu){
      menu = document.createElement("div");
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
      document.body.appendChild(menu);
    } else {
      if(menu.parentElement !== document.body) document.body.appendChild(menu);
    }

    ensureShareModal();

    const closeMenu = () => {
      menu.classList.remove("open");
      menu.style.display = "none";
    };

    const positionMenu = () => {
      if(!menu.classList.contains("open")) return;

      const r = gearBtn.getBoundingClientRect();
      // garante medidas
      const w = menu.offsetWidth || 320;
      const h = menu.offsetHeight || 220;
      const pad = 10;

      let left = r.left;
      let top = r.bottom + 8;

      // se estourar embaixo, sobe
      if(top + h > window.innerHeight - pad){
        top = Math.max(pad, r.top - h - 8);
      }

      // se estourar à direita, puxa pra dentro
      if(left + w > window.innerWidth - pad){
        left = Math.max(pad, window.innerWidth - w - pad);
      }
      if(left < pad) left = pad;

      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    };

    if(!gearBtn.dataset.vgWired){
      gearBtn.dataset.vgWired = "1";

      gearBtn.addEventListener("click", (e)=>{
        e.stopPropagation();
        const willOpen = !menu.classList.contains("open");
        if(willOpen){
          menu.classList.add("open");
          menu.style.display = "block";
          positionMenu();
        }else{
          closeMenu();
        }
      });

      // impede fechar ao clicar dentro
      menu.addEventListener("click", (e)=> e.stopPropagation());

      // fecha clicando fora / ESC
      document.addEventListener("click", closeMenu);
      document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeMenu(); });

      // re-posiciona em resize/scroll
      window.addEventListener("resize", positionMenu);
      window.addEventListener("scroll", positionMenu, true);
    }

    // Wire "Compartilhar" dentro do menu
    const shareAction = menu.querySelector("#vg-menu-share");
    if(shareAction && !shareAction.dataset.vgWired){
      shareAction.dataset.vgWired = "1";
      shareAction.addEventListener("click", ()=>{
        closeMenu();
        const m = qs("#vg-share-modal");
        if(m) m.style.display = "flex";
      });
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
    // maker can change depending on context (public hero vs share)
    window.__vgMakeShare = make;

    const btnR = qs("#vg-share-read");
    const btnE = qs("#vg-share-edit");

    if(btnR && !btnR.dataset.vgWired){
      btnR.dataset.vgWired = "1";
      btnR.addEventListener("click", async ()=>{
        try{
          if(typeof window.__vgMakeShare !== "function") return alert("Conecte-se ao Cloud para gerar o link.");
          await window.__vgMakeShare("read");
        }catch(err){
          console.warn(err);
          alert("Não consegui gerar o link agora.");
        }
      });
    }

    if(btnE && !btnE.dataset.vgWired){
      btnE.dataset.vgWired = "1";
      btnE.addEventListener("click", async ()=>{
        try{
          if(typeof window.__vgMakeShare !== "function") return alert("Conecte-se ao Cloud para gerar o link.");
          await window.__vgMakeShare("edit");
        }catch(err){
          console.warn(err);
          alert("Não consegui gerar o link agora.");
        }
      });
    }
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

        // Se o share estiver ligado a um hero (heroId), tenta manter conectado também
        // (isso funciona quando o hero é público e/ou o usuário tem permissão de update)
        const linkedHeroId = current.heroId || current.sourceHid;
        if(linkedHeroId){
          const hp = {};
          Object.keys(patch||{}).forEach(k=>{
            if(k.startsWith("data.")) hp[k.slice(5)] = patch[k];
          });
          // share tem campos extras (title etc)
          delete hp.title;
          if(Object.keys(hp).length){
            VGCloud.patchHero(linkedHeroId, hp).catch(()=>{});
          }
        }
      }, "data.");

      wireShareButtons(async (m) => {
        const snap = collectHeroFromUI();
        // carrega o id original se existir
        if(current?.heroId) snap.id = current.heroId;
        const token = await VGCloud.createShareRoom(snap, m);
        qs("#vg-share-link").value = buildShareLink(token);
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
      let shareTokens = [];
      let warned = false;
      let addedShared = false;

      VGCloud.watchHero(heroId, (hero) => {
        currentHero = hero;

        shareTokens = Array.isArray(hero?.shareTokens)
          ? hero.shareTokens
          : (hero?.shareTokens ? Object.keys(hero.shareTokens) : []);

        const isOwner = (hero.ownerUid === VGCloud.user.uid);

        // salva automaticamente em ONLINE → SHARED (para não poluir "Meus personagens")
        if(!isOwner && !addedShared){
          addedShared = true;
          try{
            if(typeof VGCloud.addPublicHeroToMyShared === "function"){
              const title = (hero.nome || hero.dados?.["c-name"] || "Personagem público").toString();
              VGCloud.addPublicHeroToMyShared(heroId, {
                name: title,
                ownerUid: hero.ownerUid,
                ownerName: hero.ownerName,
                ownerPhotoURL: hero.ownerPhotoURL
              }).catch(()=>{});
            }
          }catch{}
        }
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

        // Se o dono editar aqui, espelha nos shares desse hero também
        if(isOwner && shareTokens && shareTokens.length){
          const sp = {};
          Object.keys(patch||{}).forEach(k=>{ sp[`data.${k}`] = patch[k]; });
          if(patch.nome) sp.title = patch.nome;
          if(patch['dados.c-name']) sp.title = patch['dados.c-name'];
          shareTokens.forEach(tok => VGCloud.patchShare(tok, sp).catch(()=>{}));
        }
      }, "");

      wireShareButtons(async (m) => {
        if(!currentHero || currentHero.ownerUid !== VGCloud.user.uid) return;
        const snap = collectHeroFromUI();
        snap.id = heroId; // garante conexão do share com o hero
        const token = await VGCloud.createShareRoom(snap, m);
        // registra token no hero para espelhar updates do perfil -> share
        try{ await VGCloud.patchHero(heroId, { [`shareTokens.${token}`]: true }); }catch{}
        qs("#vg-share-link").value = buildShareLink(token);
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
    // Aqui é onde a ficha do PERFIL precisa ficar 100% conectada com o Firestore
    // para que o público/shared recebam alterações em tempo real.
    try{
      const u = Auth.getCurrentUser?.();
      const idx = Auth.getCurrentHeroIndex?.();
      const heroes = u?.heroes || [];
      const h = (idx!=null && heroes[idx]) ? heroes[idx] : null;
      const localHeroId = h?.id || h?.heroId || null;

      setOwnerButton({ uid: VGCloud.user.uid, name: VGCloud.user.displayName, photoURL: VGCloud.user.photoURL });

      // Share visível no perfil
      const shareBtn = qs("#vg-menu-share");
      if(shareBtn) shareBtn.style.display = "";

      if(!h || !localHeroId){
        // Sem hero id -> não tem como conectar com o cloud
        wireShareButtons(async ()=> alert("Esta ficha não tem ID. Crie um personagem novo pelo PERFIL."));
        return;
      }

      // Garante que o doc exista
      try{ await VGCloud.upsertHero(h); }catch{}

      // Presence do dono conta como 1 usuário (bubbles aparecem só com 2+)
      try{ await VGCloud.joinPresence("hero", localHeroId, localProfile); }catch{}

      let currentHero = null;
      let shareTokens = [];

      // Inbound: atualiza UI + mantém o localStorage alinhado
      VGCloud.watchHero(localHeroId, (hero)=>{
        currentHero = hero || null;
        shareTokens = Array.isArray(hero?.shareTokens)
          ? hero.shareTokens
          : (hero?.shareTokens ? Object.keys(hero.shareTokens) : []);

        applyHeroToUI(hero || {});
        setOwnerButton({
          uid: hero?.ownerUid || VGCloud.user.uid,
          name: hero?.ownerName || VGCloud.user.displayName,
          photoURL: hero?.ownerPhotoURL || VGCloud.user.photoURL
        });

        // Mantém o hero local sincronizado (para Home/Perfil sempre mostrar o estado atual)
        try{
          const uu = Auth.getCurrentUser?.();
          const ii = Auth.getCurrentHeroIndex?.();
          if(uu && ii!=null && uu.heroes && uu.heroes[ii]){
            const merged = { ...uu.heroes[ii], ...hero };
            Auth.updateHero(ii, merged);
          }
        }catch{}
      });

      // Outbound: qualquer alteração na UI vira patch no hero doc
      bindOutbound((patch)=>{
        if(!localHeroId) return;
        VGCloud.patchHero(localHeroId, patch).catch(()=>{});

        // Espelha no(s) share(s) já existentes desse hero, para manter conexão
        if(shareTokens && shareTokens.length){
          const sp = {};
          Object.keys(patch||{}).forEach(k=>{ sp[`data.${k}`] = patch[k]; });
          // mantém título do share atualizado
          if(patch.nome) sp.title = patch.nome;
          if(patch['dados.c-name']) sp.title = patch['dados.c-name'];
          shareTokens.forEach(tok => VGCloud.patchShare(tok, sp).catch(()=>{}));
        }
      }, "");

      // Share links (e registra o token dentro do hero doc)
      wireShareButtons(async (m) => {
        const snap = collectHeroFromUI();
        snap.id = localHeroId;
        const token = await VGCloud.createShareRoom(snap, m);
        try{ await VGCloud.patchHero(localHeroId, { [`shareTokens.${token}`]: true }); }catch{}
        qs("#vg-share-link").value = buildShareLink(token);
      });

      // Toggle dentro do lápis (somente dono + ficha pública)
      wirePencilToggle(
        ()=>({
          show: !!(currentHero && currentHero.visibility === "public"),
          value: !!(currentHero && currentHero.allowPublicEdit)
        }),
        async (val)=>{
          if(!localHeroId) return;
          await VGCloud.patchHero(localHeroId, { allowPublicEdit: !!val });
        }
      );

    }catch(err){
      console.warn("[VGCollab] local sync failed", err);
    }
  });
})();