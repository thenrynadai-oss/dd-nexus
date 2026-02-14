/* =========================================================
   ONLINE (Hub)
   - Aba ONLINE (Amigos / Públicos / Shared)
   - Privado/Público + toggle de edição pública no modal de criação
   - Corrige bug visual: NÃO força display:block no hero-grid
   ========================================================= */
(() => {
  "use strict";

  const mkId = () => "h_" + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
  const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");

  function getNewVis(modal){ return modal?.getAttribute("data-new-vis") || "private"; }
  function getNewPubEdit(modal){ return (modal?.getAttribute("data-new-public-edit") === "1"); }

  window.addEventListener("load", async () => {
    if(!window.Auth) return;

    const nav = document.querySelector(".hub-nav");
    const heroList = document.getElementById("hero-list");
    if(!nav || !heroList) return;

    // Ensure HERO button has id
    const heroBtn = nav.querySelector(".nav-btn");
    if(heroBtn && !heroBtn.id) heroBtn.id = "nav-heroes";

    // Add ONLINE button (last)
    let btnOnline = document.getElementById("nav-online");
    if(!btnOnline){
      btnOnline = document.createElement("button");
      btnOnline.id = "nav-online";
      btnOnline.className = "nav-btn";
      btnOnline.type = "button";
      btnOnline.textContent = "ONLINE";
      nav.appendChild(btnOnline);
    }

    // ONLINE panel container (after heroList)
    let panel = document.getElementById("online-panel");
    if(!panel){
      panel = document.createElement("div");
      panel.id = "online-panel";
      panel.className = "vg-online-wrap";
      panel.innerHTML = `
        <div class="vg-online-top">
          <div class="vg-chip" id="vg-cloud-status">Cloud: <b>desconectado</b></div>
          <div style="display:flex;gap:8px;">
            <button class="btn-blue" id="vg-btn-google">Entrar com Google</button>
            <button class="btn-ghost" id="vg-btn-cloudout" style="display:none;">Sair Cloud</button>
          </div>
        </div>

        <div class="vg-seg" id="vg-online-seg">
          <button data-tab="friends" class="active">AMIGOS</button>
          <button data-tab="public">PÚBLICOS</button>
          <button data-tab="shared">SHARED</button>
        </div>

        <div style="height:12px"></div>
        <div id="vg-online-list" class="vg-grid"></div>
      `;
      heroList.parentElement.appendChild(panel);
    }

    // show/hide panels (FIX: restore display original do hero-grid)
    function showHub(which){
      nav.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));

      if(which === "online"){
        btnOnline.classList.add("active");
        heroList.style.display = "none";
        panel.classList.add("show");
      }else{
        heroBtn && heroBtn.classList.add("active");
        heroList.style.display = "";     // <<< FIX PRINCIPAL (não "block")
        panel.classList.remove("show");
      }
    }
    heroBtn?.addEventListener("click", ()=>showHub("heroes"));
    btnOnline.addEventListener("click", ()=>showHub("online"));

    // ----- Add “Privado/Público” + “Edição pública” to create modal -----
    const modal = document.getElementById("modal-create");
    if(modal && !document.getElementById("vg-vis-seg")){
      const fieldCampaign = document.getElementById("new-campaign")?.closest(".field");
      const wrap = document.createElement("div");
      wrap.className = "field";
      wrap.innerHTML = `
        <label>Visibilidade</label>
        <div class="vg-seg" id="vg-vis-seg">
          <button type="button" data-vis="private" class="active">PRIVADO</button>
          <button type="button" data-vis="public">PÚBLICO</button>
        </div>
        <div style="margin-top:10px; color:rgba(255,255,255,.7); font-size:12px;">
          Público aparece para todos no ONLINE.
        </div>
      `;
      fieldCampaign?.after(wrap);

      const wrap2 = document.createElement("div");
      wrap2.className = "field";
      wrap2.id = "vg-public-edit-wrap";
      wrap2.style.display = "none";
      wrap2.innerHTML = `
        <label>Edição pública</label>
        <div class="vg-seg" id="vg-public-edit-seg">
          <button type="button" data-edit="0" class="active">DESLIGADA</button>
          <button type="button" data-edit="1">LIGADA</button>
        </div>
        <div style="margin-top:10px; color:rgba(255,255,255,.7); font-size:12px;">
          Se ligado, qualquer pessoa logada pode editar (multiplayer).
        </div>
      `;
      wrap.after(wrap2);

      modal.setAttribute("data-new-vis","private");
      modal.setAttribute("data-new-public-edit","0");

      const segVis = wrap.querySelector("#vg-vis-seg");
      const segEdit = wrap2.querySelector("#vg-public-edit-seg");

      function refresh(){
        const v = modal.getAttribute("data-new-vis") || "private";
        wrap2.style.display = (v === "public") ? "" : "none";
        if(v !== "public"){
          modal.setAttribute("data-new-public-edit","0");
          segEdit.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
          segEdit.querySelector('button[data-edit="0"]')?.classList.add("active");
        }
      }

      segVis.addEventListener("click",(e)=>{
        const b = e.target.closest("button[data-vis]");
        if(!b) return;
        segVis.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        modal.setAttribute("data-new-vis", b.getAttribute("data-vis"));
        refresh();
      });

      segEdit.addEventListener("click",(e)=>{
        const b = e.target.closest("button[data-edit]");
        if(!b) return;
        segEdit.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        modal.setAttribute("data-new-public-edit", b.getAttribute("data-edit"));
      });

      refresh();
    }

    // Patch Auth hero creation to include id/visibility/public-edit
    if(Auth && !Auth.__vg_patched){
      Auth.__vg_patched = true;

      const origCreate = Auth.createDefaultHero?.bind(Auth);
      if(origCreate){
        Auth.createDefaultHero = (name) => {
          const h = origCreate(name);
          if(h){
            h.id = h.id || mkId();
            const vis = getNewVis(modal);
            h.visibility = vis;
            h.allowPublicEdit = (vis === "public") ? getNewPubEdit(modal) : false;
          }
          return h;
        };
      }

      const origAdd = Auth.addHero?.bind(Auth);
      if(origAdd){
        Auth.addHero = (heroObj) => {
          if(heroObj){
            heroObj.id = heroObj.id || mkId();
            heroObj.visibility = heroObj.visibility || getNewVis(modal);
            heroObj.allowPublicEdit = (heroObj.visibility === "public") ? (!!heroObj.allowPublicEdit || getNewPubEdit(modal)) : false;
          }
          const r = origAdd(heroObj);

          // autosync to cloud if logged
          if(window.VGCloud?.user && window.VGCloud.enabled){
            try{ VGCloud.upsertHero(heroObj); }catch{}
          }
          return r;
        };
      }
    }

    // VGCloud wiring
    const status = document.getElementById("vg-cloud-status");
    const btnGoogle = document.getElementById("vg-btn-google");
    const btnOut = document.getElementById("vg-btn-cloudout");
    const seg = document.getElementById("vg-online-seg");
    const list = document.getElementById("vg-online-list");

    if(!window.VGCloud){
      if(status) status.innerHTML = `Cloud: <b>indisponível</b>`;
      if(btnGoogle) btnGoogle.style.display = "none";
      return;
    }

    await VGCloud.init();

    function setStatus(){
      if(!status) return;
      if(!VGCloud.enabled) status.innerHTML = `Cloud: <b>sem config</b>`;
      else if(VGCloud.user) status.innerHTML = `Cloud: <b>conectado</b> (${VGCloud.user.displayName || "agente"})`;
      else status.innerHTML = `Cloud: <b>desconectado</b>`;
      if(btnGoogle) btnGoogle.style.display = VGCloud.user ? "none" : "";
      if(btnOut) btnOut.style.display = VGCloud.user ? "" : "none";
    }
    setStatus();

    VGCloud.onAuth(async () => {
      setStatus();
      if(VGCloud.user){
        const local = Auth.getCurrentUser?.();
        await VGCloud.upsertMyProfile(local ? { name: local.name, nick: local.nick, profileImg: local.profileImg } : null);

        // autosync all local heroes (private/public)
        try{
          const heroes = Auth.getHeroes?.() || [];
          for(const h of heroes){
            if(h?.id) await VGCloud.upsertHero(h);
          }
        }catch{}

        renderCurrentTab();
      }
    });

    btnGoogle?.addEventListener("click", async () => {
      try{ await VGCloud.signInGoogle(); }catch(e){ alert("Falha ao entrar com Google."); }
    });
    btnOut?.addEventListener("click", async () => {
      try{ await VGCloud.signOut(); }catch{}
      setStatus();
    });

    let curTab = "friends";
    seg?.addEventListener("click", (e)=>{
      const b = e.target.closest("button");
      if(!b) return;
      seg.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      curTab = b.getAttribute("data-tab");
      renderCurrentTab();
    });

    async function renderCurrentTab(){
      if(!list) return;
      list.innerHTML = "";
      if(!VGCloud.enabled){
        list.innerHTML = `<div class="vg-card"><h4>Cloud não configurado</h4><p>Preencha firebase.config.js.</p></div>`;
        return;
      }
      if(!VGCloud.user){
        list.innerHTML = `<div class="vg-card"><h4>Entre no Cloud</h4><p>Faça login com Google para ONLINE.</p></div>`;
        return;
      }

      if(curTab === "friends"){
        const users = await VGCloud.listUsers();
        users.forEach(u=>{
          const card = document.createElement("div");
          card.className = "vg-card vg-friend-card";

          const nick = esc(u.nick || u.displayName || "Agente");
          const name = esc(u.displayName || "—");
          const photo = u.photoURL || "";
          const mp = u.miniProfile || {};
          const banner = (mp.bannerUrl || mp.bannerURL || "").trim();
          const bannerData = (mp.bannerData || "").trim();
          const bannerBg = banner || bannerData;
          const fav = mp.favorite || null;

          const favName = fav && fav.name ? esc(fav.name) : "";
          const favImg  = fav && fav.img ? fav.img : "";

          card.innerHTML = `
            <div class="vg-friend-banner" style="${bannerBg ? `background-image:url(${bannerBg});` : ""}"></div>
            <div class="vg-friend-inner">
              <div class="vg-friend-top">
                <div class="vg-friend-avatar" style="${photo ? `background-image:url(${photo});` : ""}">${photo ? "" : nick.slice(0,2).toUpperCase()}</div>
                <div class="vg-friend-meta">
                  <div class="vg-friend-nick">${nick}</div>
                  <div class="vg-friend-name">${name}</div>
                </div>
              </div>

              ${
                favName ? `
                  <div class="vg-friend-fav">
                    <div class="vg-friend-fav-img" style="${favImg ? `background-image:url(${favImg});` : ""}"></div>
                    <div class="vg-friend-fav-name">${favName}</div>
                  </div>
                ` : `
                  <div class="vg-friend-fav muted">Sem personagem favorito</div>
                `
              }
            </div>
          `;
          list.appendChild(card);
        });
      }


      if(curTab === "public"){
        const heroes = await VGCloud.publicHeroes();
        heroes.forEach(h=>{
          const card = document.createElement("div");
          card.className = "vg-card";

          const nm = (h.nome || h.dados?.["c-name"] || "SEM NOME");
          const own = (h.ownerName || "AGENTE");
          const camp = (h.campaign || h.dados?.["c-campaign"] || "—");

          const isOwner = (h.ownerUid === VGCloud.user.uid);
          const canEdit = isOwner || (h.allowPublicEdit === true);

          card.innerHTML = `
            <h4>${nm}</h4>
            <p>${camp} • Dono: ${own} • Edição: ${canEdit ? "ON" : "OFF"}</p>
            <div class="vg-actions">
              <button class="primary" data-open="read">LER</button>
              <button data-open="edit" ${canEdit ? "" : "disabled"} title="${canEdit ? "" : "Dono não liberou edição pública"}">EDITAR (MULTI)</button>
            </div>
          `;

          card.querySelector('button[data-open="read"]').addEventListener("click", ()=>{
            window.location.href = `ficha.html?hid=${encodeURIComponent(h.id)}&mode=read`;
          });

          const editBtn = card.querySelector('button[data-open="edit"]');
          editBtn.addEventListener("click", ()=>{
            if(!canEdit) return;
            window.location.href = `ficha.html?hid=${encodeURIComponent(h.id)}&mode=edit`;
          });

          list.appendChild(card);
        });
      }

      if(curTab === "shared"){
        const entries = await VGCloud.listMyShared();
        if(!entries.length){
          list.innerHTML = `<div class="vg-card"><h4>Nenhuma ficha compartilhada</h4><p>Abra um link share para adicionar aqui.</p></div>`;
          return;
        }
        for(const it of entries){
          const token = it.token;
          const card = document.createElement("div");
          card.className = "vg-card";
          card.innerHTML = `
            <h4>Ficha compartilhada</h4>
            <p>Token: ${token}</p>
            <div class="vg-actions">
              <button class="primary">ABRIR</button>
            </div>
          `;
          card.querySelector("button").addEventListener("click", ()=>{
            window.location.href = `ficha.html?share=${encodeURIComponent(token)}`;
          });
          list.appendChild(card);
        }
      }
    }

    renderCurrentTab();
  });
})();