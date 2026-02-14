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
        await VGCloud.upsertMyProfile(local ? { name: local.nome || local.name, nick: local.apelido || local.nick, profileImg: local.profileImg, miniProfile: local.miniProfile } : null);

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

    const state = {
      users: [],
      heroes: [],
      shared: [],
      unsubUsers: null,
      unsubHeroes: null,
      unsubShared: null,
      friendCards: new Map(),
      publicCards: new Map(),
      sharedCards: new Map(),
    };

    function stampUpdate(el){
      if(!el) return;
      el.classList.remove("vg-upd");
      // força reflow leve para reativar transição
      void el.offsetWidth;
      el.classList.add("vg-upd");
      clearTimeout(el._updT);
      el._updT = setTimeout(()=>el.classList.remove("vg-upd"), 220);
    }

    function ensureConfirm(){
      let modal = document.getElementById("vg-confirm");
      if(modal) return modal;

      modal = document.createElement("div");
      modal.id = "vg-confirm";
      modal.className = "vg-confirm";
      modal.innerHTML = `
        <div class="vg-confirm-box">
          <div class="vg-confirm-title">Confirmar</div>
          <div class="vg-confirm-msg">—</div>
          <div class="vg-confirm-actions">
            <button class="btn-ghost" data-act="cancel">Cancelar</button>
            <button class="btn-danger" data-act="ok">Deletar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener("click", (e)=>{
        if(e.target === modal) closeConfirm();
      });

      function closeConfirm(){
        modal.classList.remove("show");
        modal._onOk = null;
      }

      modal._open = ({ title, msg, okText="Deletar", onOk } = {}) => {
        modal.querySelector(".vg-confirm-title").textContent = title || "Confirmar";
        modal.querySelector(".vg-confirm-msg").textContent = msg || "";
        modal.querySelector('button[data-act="ok"]').textContent = okText;
        modal._onOk = onOk || null;
        modal.classList.add("show");
      };

      modal.querySelector('button[data-act="cancel"]').addEventListener("click", ()=> modal.classList.remove("show"));
      modal.querySelector('button[data-act="ok"]').addEventListener("click", async ()=>{
        const fn = modal._onOk;
        modal.classList.remove("show");
        modal._onOk = null;
        if(fn) await fn();
      });

      return modal;
    }

    function showInfoCard(html){
      if(!list) return;
      list.innerHTML = `<div class="vg-card vg-info">${html}</div>`;
    }

    function mountUsers(){
      if(state.unsubUsers || !VGCloud.user) return;
      state.unsubUsers = VGCloud.subscribeUsers((arr)=>{
        state.users = arr || [];
        if(curTab === "friends") renderFriends();
      });
    }
    function mountPublic(){
      if(state.unsubHeroes || !VGCloud.user) return;
      state.unsubHeroes = VGCloud.subscribePublicHeroes((arr)=>{
        state.heroes = arr || [];
        if(curTab === "public") renderPublic();
      });
    }
    function mountShared(){
      if(state.unsubShared || !VGCloud.user) return;
      state.unsubShared = VGCloud.subscribeMyShared((arr)=>{
        state.shared = arr || [];
        if(curTab === "shared") renderShared();
      });
    }

    function renderFriends(){
      if(!list) return;
      if(state.users && state.users.length && list.querySelector(".vg-info")) list.innerHTML = "";
      const keep = new Set();
      const frag = document.createDocumentFragment();

      for(const u of (state.users || [])){
        if(!u || !u.uid) continue;
        keep.add(u.uid);

        let card = state.friendCards.get(u.uid);
        if(!card){
          card = document.createElement("div");
          card.className = "vg-card vg-friend-card";
          card.innerHTML = `
            <div class="vg-friend-banner"></div>
            <div class="vg-friend-inner">
              <div class="vg-friend-top">
                <div class="vg-friend-avatar"></div>
                <div class="vg-friend-meta">
                  <div class="vg-friend-nick"></div>
                  <div class="vg-friend-name"></div>
                </div>
              </div>
              <div class="vg-friend-fav muted">Sem personagem favorito</div>
            </div>
          `;
          state.friendCards.set(u.uid, card);
          frag.appendChild(card);
        }

        const mp = u.miniProfile || {};
        let banner = String((mp.bannerURL || "")).trim();
        if(!banner){
          const bd = String(mp.bannerData || "");
          banner = (bd.startsWith("data:") && bd.length <= 90000) ? bd : "";
        }
        const fav = mp.favorite || null;

        const nick = esc(u.nick || u.displayName || "Agente");
        const name = esc(u.displayName || "—");
        let photo = String(u.photoURL || "").trim();
        if(photo.startsWith("data:") && photo.length > 80000) photo = "";

        // banner
        if(card.dataset.banner !== banner){
          card.dataset.banner = banner;
          const b = card.querySelector(".vg-friend-banner");
          b.style.backgroundImage = banner ? `url(${banner})` : "";
          stampUpdate(card);
        }

        // avatar
        if(card.dataset.photo !== photo || card.dataset.nick !== nick){
          card.dataset.photo = photo;
          card.dataset.nick = nick;
          const a = card.querySelector(".vg-friend-avatar");
          a.style.backgroundImage = photo ? `url(${photo})` : "";
          a.textContent = photo ? "" : nick.slice(0,2).toUpperCase();
          stampUpdate(card);
        }

        // meta
        const nn = card.querySelector(".vg-friend-nick");
        const nm = card.querySelector(".vg-friend-name");
        if(nn.textContent !== nick) nn.textContent = nick;
        if(nm.textContent !== name) nm.textContent = name;

        // favorite
        const favWrap = card.querySelector(".vg-friend-fav");
        const favName = fav && fav.name ? esc(fav.name) : "";
        let favImg = fav && fav.img ? String(fav.img) : "";
        if(favImg.startsWith("data:") && favImg.length > 140000) favImg = "";
        if(favName){
          if(card.dataset.fav !== favName || card.dataset.favimg !== favImg){
            card.dataset.fav = favName;
            card.dataset.favimg = favImg;
            favWrap.classList.remove("muted");
            favWrap.innerHTML = `
              <div class="vg-friend-fav-img" style="${favImg ? `background-image:url(${favImg});` : ""}"></div>
              <div class="vg-friend-fav-name">${favName}</div>
            `;
            stampUpdate(card);
          }
        }else{
          if(card.dataset.fav !== ""){
            card.dataset.fav = "";
            card.dataset.favimg = "";
            favWrap.classList.add("muted");
            favWrap.textContent = "Sem personagem favorito";
          }
        }

        if(!card.isConnected) frag.appendChild(card);
      }

      // remove cards inexistentes
      for(const [uid, card] of state.friendCards.entries()){
        if(!keep.has(uid)){
          card.remove();
          state.friendCards.delete(uid);
        }
      }

      // primeira render: enche lista
      if(frag.childNodes.length){
        // se lista estava vazia, limpa placeholders
        if(!list.firstChild) list.appendChild(frag);
        else list.appendChild(frag);
      }

      if(!state.users.length){
        showInfoCard(`<h4>Nenhuma conta encontrada</h4><p>Crie contas no site para aparecer aqui.</p>`);
      }
    }

    function renderPublic(){
      if(!list) return;
      if(state.heroes && state.heroes.length && list.querySelector(".vg-info")) list.innerHTML = "";
      if(!state.heroes.length){
        showInfoCard(`<h4>Nenhum personagem público</h4><p>Crie um personagem como <b>PÚBLICO</b> para aparecer aqui.</p>`);
        return;
      }

      const keep = new Set();
      const frag = document.createDocumentFragment();

      for(const h of state.heroes){
        if(!h || !h.id) continue;
        keep.add(h.id);

        let card = state.publicCards.get(h.id);
        const nm = esc(h.nome || h.dados?.["c-name"] || "SEM NOME");
        const own = esc(h.ownerName || "AGENTE");
        const camp = esc(h.campaign || h.dados?.["c-campaign"] || "—");

        const isOwner = (h.ownerUid === VGCloud.user.uid);
        const canEdit = isOwner || (h.allowPublicEdit === true);

        if(!card){
          card = document.createElement("div");
          card.className = "vg-card";
          card.innerHTML = `
            <h4 class="vg-hname"></h4>
            <p class="vg-hmeta"></p>
            <div class="vg-actions">
              <button class="primary" data-open="read">LER</button>
              <button data-open="edit">EDITAR (MULTI)</button>
              <button class="btn-danger" data-act="del" style="display:none;">DELETAR</button>
            </div>
          `;

          card.querySelector('button[data-open="read"]').addEventListener("click", ()=>{
            window.location.href = `ficha.html?hid=${encodeURIComponent(h.id)}&mode=read`;
          });

          card.querySelector('button[data-open="edit"]').addEventListener("click", ()=>{
            const b = card.querySelector('button[data-open="edit"]');
            if(b && b.disabled) return;
            window.location.href = `ficha.html?hid=${encodeURIComponent(h.id)}&mode=edit`;
          });

          card.querySelector('button[data-act="del"]').addEventListener("click", ()=>{
            if(!isOwner) return;
            const modal = ensureConfirm();
            modal._open({
              title: "Deletar personagem público",
              msg: `Tem certeza que quer deletar "${nm}"? Isso não pode ser desfeito.`,
              okText: "SIM, DELETAR",
              onOk: async () => {
                try{
                  await VGCloud.deleteHero(h.id);
                }catch(e){
                  alert("Não foi possível deletar. Verifique permissões (rules).");
                }
              }
            });
          });

          state.publicCards.set(h.id, card);
          frag.appendChild(card);
        }

        // update content
        card.querySelector(".vg-hname").textContent = nm;
        card.querySelector(".vg-hmeta").textContent = `${camp} • Dono: ${own} • Edição: ${canEdit ? "ON" : "OFF"}`;

        const editBtn = card.querySelector('button[data-open="edit"]');
        editBtn.disabled = !canEdit;
        editBtn.title = canEdit ? "" : "Dono não liberou edição pública";

        const delBtn = card.querySelector('button[data-act="del"]');
        delBtn.style.display = isOwner ? "" : "none";

        if(!card.isConnected) frag.appendChild(card);
      }

      for(const [hid, card] of state.publicCards.entries()){
        if(!keep.has(hid)){
          card.remove();
          state.publicCards.delete(hid);
        }
      }

      if(frag.childNodes.length){
        if(!list.firstChild) list.appendChild(frag);
        else list.appendChild(frag);
      }
    }

    function renderShared(){
      if(!list) return;
      if(state.shared && state.shared.length && list.querySelector(".vg-info")) list.innerHTML = "";
      const entries = state.shared || [];
      if(!entries.length){
        showInfoCard(`<h4>Nenhuma ficha compartilhada</h4><p>Abra um link share para adicionar aqui.</p>`);
        return;
      }

      const keep = new Set();
      const frag = document.createDocumentFragment();

      for(const it of entries){
        const token = it.token || it.sid || it.id;
        if(!token) continue;
        keep.add(token);

        let card = state.sharedCards.get(token);
        if(!card){
          card = document.createElement("div");
          card.className = "vg-card";
          card.innerHTML = `
            <h4>Ficha compartilhada</h4>
            <p class="vg-sh-meta"></p>
            <div class="vg-actions">
              <button class="primary">ABRIR</button>
            </div>
          `;
          card.querySelector("button").addEventListener("click", ()=>{
            window.location.href = `ficha.html?share=${encodeURIComponent(token)}`;
          });
          state.sharedCards.set(token, card);
          frag.appendChild(card);
        }
        card.querySelector(".vg-sh-meta").textContent = `Token: ${token}`;

        if(!card.isConnected) frag.appendChild(card);
      }

      for(const [tok, card] of state.sharedCards.entries()){
        if(!keep.has(tok)){
          card.remove();
          state.sharedCards.delete(tok);
        }
      }

      if(frag.childNodes.length){
        if(!list.firstChild) list.appendChild(frag);
        else list.appendChild(frag);
      }
    }

    function renderCurrentTab(){
      if(!list) return;
      list.innerHTML = "";

      if(!VGCloud.enabled){
        showInfoCard(`<h4>Cloud não configurado</h4><p>Preencha firebase.config.js.</p>`);
        return;
      }
      if(!VGCloud.user){
        showInfoCard(`<h4>Entre no Cloud</h4><p>Faça login com Google para ONLINE.</p>`);
        return;
      }

      // monta listeners e renderiza cache
      if(curTab === "friends"){ mountUsers(); renderFriends(); }
      if(curTab === "public"){ mountPublic(); renderPublic(); }
      if(curTab === "shared"){ mountShared(); renderShared(); }
    }

    renderCurrentTab();
  });
})();