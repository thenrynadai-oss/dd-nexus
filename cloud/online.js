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

    // Enable/ensure BIBLIOTECA button
    let btnLibrary = document.getElementById("nav-library");
    if(!btnLibrary){
      // tenta achar pelo texto (compat com versões antigas)
      btnLibrary = Array.from(nav.querySelectorAll('button.nav-btn')).find(b => (b.textContent || '').toUpperCase().includes('BIBLIOTECA'));
      if(btnLibrary){
        btnLibrary.id = "nav-library";
        btnLibrary.classList.remove('disabled');
        btnLibrary.title = "";
        btnLibrary.textContent = "BIBLIOTECA";
      }
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

    // =========================================================
    // Painéis ONLINE + BIBLIOTECA
    // BUG do deploy: se o CSS/JS da biblioteca não estiver carregando,
    // o painel podia aparecer em todas as abas.
    // FIX: controlar também por style.display (não só por classe CSS)
    // e criar a BIBLIOTECA sob demanda.
    // =========================================================

    const hide = (el) => { if(!el) return; el.classList.remove('show'); el.style.display = 'none'; };
    const show = (el) => { if(!el) return; el.classList.add('show'); el.style.display = ''; };

    // garante online inicialmente oculto mesmo sem CSS
    hide(panel);

    let lib = null;
    function ensureLibraryPanel(){
      if(lib && lib.isConnected) return lib;
      lib = document.getElementById('library-panel');
      if(!lib){
        lib = document.createElement('div');
        lib.id = 'library-panel';
        lib.className = 'vg-library-wrap';
        lib.innerHTML = `
          <div class="vg-library-top">
            <div class="vg-library-title panel-skin">BIBLIOTECA</div>
            <div class="vg-library-search">
              <input id="vg-lib-search" placeholder="Buscar livro..." />
            </div>
          </div>
          <div id="vg-lib-shelf" class="vg-lib-shelf"></div>
        `;
        heroList.parentElement.appendChild(lib);
      }
      hide(lib);
      return lib;
    }

    // show/hide panels (FIX: restore display original do hero-grid)
    function showHub(which){
      nav.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));

      // hide all
      heroList.style.display = "none";
      hide(panel);
      hide(lib);

      if(which === "online"){
        btnOnline.classList.add("active");
        show(panel);
        return;
      }
      if(which === "library"){
        btnLibrary && btnLibrary.classList.add("active");
        const L = ensureLibraryPanel();
        show(L);
        try{ window.dispatchEvent(new CustomEvent('vg:show-library')); }catch(e){}
        return;
      }

      // heroes
      heroBtn && heroBtn.classList.add("active");
      heroList.style.display = "";     // <<< FIX PRINCIPAL (não "block")
    }

    // Qualquer clique na barra de abas (inclusive as “Em Breve”) precisa
    // esconder ONLINE/BIBLIOTECA, senão o painel "vaza" para outras abas.
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('button.nav-btn');
      if(!b) return;
      if(b.id === 'nav-online') return showHub('online');
      if(b.id === 'nav-library') return showHub('library');
      // quaisquer outras abas => volta para meus personagens
      showHub('heroes');
    });

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

          card.querySelector('button[data-open="read"]').addEventListener("click", async ()=>{
            try{
              if(!isOwner && typeof VGCloud.addPublicHeroToMyShared === "function"){
                await VGCloud.addPublicHeroToMyShared(h.id, {
                  name: nm,
                  ownerUid: h.ownerUid,
                  ownerName: h.ownerName,
                  ownerPhotoURL: h.ownerPhotoURL
                });
              }
            }catch{}
            window.location.href = `ficha.html?hid=${encodeURIComponent(h.id)}&mode=read`;
          });

          card.querySelector('button[data-open="edit"]').addEventListener("click", async ()=>{
            const b = card.querySelector('button[data-open="edit"]');
            if(b && b.disabled) return;
            try{
              if(!isOwner && typeof VGCloud.addPublicHeroToMyShared === "function"){
                await VGCloud.addPublicHeroToMyShared(h.id, {
                  name: nm,
                  ownerUid: h.ownerUid,
                  ownerName: h.ownerName,
                  ownerPhotoURL: h.ownerPhotoURL
                });
              }
            }catch{}
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
        const kind = (it.kind || (String(it.id||"").startsWith("hero_") ? "hero" : "share")).toLowerCase();

        // -------- PUBLIC HERO SAVED --------
        if(kind === "hero"){
          const hid = it.hid || String(it.id||"").replace(/^hero_/, "");
          if(!hid) continue;
          const key = `hero_${hid}`;
          keep.add(key);

          let card = state.sharedCards.get(key);
          if(!card){
            card = document.createElement("div");
            card.className = "vg-card";
            card.innerHTML = `
              <h4 class="vg-sh-title">Personagem público</h4>
              <p class="vg-sh-meta"></p>
              <div class="vg-actions">
                <button class="primary">ABRIR</button>
              </div>
            `;
            card.querySelector("button").addEventListener("click", ()=>{
              window.location.href = `ficha.html?hid=${encodeURIComponent(hid)}&mode=read`;
            });
            state.sharedCards.set(key, card);
            frag.appendChild(card);
          }

          const title = esc(it.name || "Personagem público");
          const owner = esc(it.ownerName || "—");
          card.querySelector(".vg-sh-title").textContent = title;
          card.querySelector(".vg-sh-meta").textContent = `Dono: ${owner} • ID: ${hid}`;

          if(!card.isConnected) frag.appendChild(card);
          continue;
        }

        // -------- SHARE TOKEN --------
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


/* =========================================================
   BIBLIOTECA (AnyFlip-like)
   - Mantida dentro do bundle principal (cloud/online.js) para
     evitar 404 / case-sensitivity / upload parcial no GitHub.
   - Requisitos:
     * cards 3D que “abrem” como livro no hover
     * abrir fullscreen com virada por drag
     * usar PDFs locais (library/books/*.pdf)
   ========================================================= */

(function(){
  "use strict";

  // evita duplicar se alguém deixou um library/library.js antigo no repo
  if(window.VGLibrary) return;

  var BOOKS = [
    {
      id: "dd5e",
      title: "D&D 5e sistema",
      subtitle: "Livro do Jogador",
      file: "library/books/dd5e-sistema.pdf",
    },
    {
      id: "valdas",
      title: "Valda's Spire of Secrets",
      subtitle: "Livro",
      file: "library/books/valdas-spire-of-secrets.pdf",
    }
  ];

  // CDN libs
  var PDFJS_SRC    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js";
  var PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";
  var PAGEFLIP_SRC = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js";

  // Resolve paths correctly both locally and in deploy (subpaths/case-sensitive servers)
  function resolveUrl(rel){
    try{ return new URL(rel, document.baseURI).toString(); }
    catch(e){ return rel; }
  }

  // Quick check if a file exists on the server (helps debug deploy vs local).
  // We use a small ranged request so we don't download the whole PDF.
  async function probeUrl(url){
    try{
      if(String(location.protocol || '').toLowerCase() === 'file:') return true;
      var ctrl = new AbortController();
      var t = setTimeout(function(){ try{ ctrl.abort(); }catch(e){} }, 4500);
      var resp = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-0' },
        signal: ctrl.signal,
        cache: 'no-store'
      });
      clearTimeout(t);
      return resp && (resp.status === 206 || resp.status === 200);
    }catch(e){
      return false;
    }
  }

  // Hard guarantee: mesmo se o CSS do ONLINE estiver desatualizado no deploy,
  // a Biblioteca continua com estilo correto.
  function ensureLibraryCSS(){
    if(document.getElementById('vg-lib-css')) return;
    var css = document.createElement('style');
    css.id = 'vg-lib-css';
    css.textContent = `
      .vg-library-wrap{ display:none; }
      .vg-library-wrap.show{ display:block; }
      .vg-library-top{ display:flex; align-items:center; gap:12px; justify-content:space-between; margin:4px 0 12px; }
      .vg-library-title{ padding:10px 14px; border-radius:14px; font-weight:900; letter-spacing:.6px; }
      .vg-library-search{ flex:1; display:flex; justify-content:flex-end; }
      .vg-library-search input{ width:min(560px, 92vw); padding:12px 14px; border-radius:16px; border:1px solid rgba(255,255,255,.14); background:rgba(0,0,0,.22); color:rgba(255,255,255,.92); outline:none; backdrop-filter: blur(8px); }
      .vg-library-search input::placeholder{ color:rgba(255,255,255,.55); }
      .vg-lib-shelf{ display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:14px; }

      .vg-book{ position:relative; border-radius:22px; overflow:hidden; min-height:280px; cursor:pointer; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.18); box-shadow:0 16px 60px rgba(0,0,0,.38); transform:translateZ(0); perspective:1000px; }
      .vg-book::before{ content:""; position:absolute; inset:0; background: radial-gradient(1200px 520px at 20% 10%, rgba(255,255,255,.16), transparent 55%), linear-gradient(135deg, rgba(255,255,255,.08), rgba(0,0,0,.22)); pointer-events:none; }
      .vg-book:hover{ transform: translateY(-2px); border-color: rgba(0,170,255,.35); box-shadow:0 22px 70px rgba(0,0,0,.48); }
      .vg-book .spine{ position:absolute; left:0; top:0; bottom:0; width:14px; background:linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.30)); z-index:3; }
      .vg-book .page-edges{ position:absolute; top:14px; bottom:14px; right:10px; width:14px; border-radius:12px; background: repeating-linear-gradient(180deg, rgba(255,255,255,.20) 0px, rgba(255,255,255,.06) 2px, rgba(0,0,0,.00) 4px); opacity:.35; z-index:1; }
      .vg-book .cover{ position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:16px; gap:8px; border-left:1px solid rgba(255,255,255,.10); background: linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.30)), radial-gradient(900px 420px at 30% 10%, rgba(255,255,255,.10), transparent 55%); transform-origin:left center; transform-style:preserve-3d; backface-visibility:hidden; transition: transform .35s ease, filter .35s ease; z-index:2; }
      .vg-book:hover .cover{ transform: perspective(1000px) rotateY(-118deg); filter: brightness(.95); }
      .vg-book .cover .title{ font-weight:950; font-size:16px; line-height:1.15; color:rgba(255,255,255,.95); text-shadow:0 12px 30px rgba(0,0,0,.6); }
      .vg-book .cover .sub{ font-size:12px; opacity:.78; }
      .vg-book .cover .hint{ font-size:12px; opacity:.70; }

      .vg-book .peek{ position:absolute; inset:0; padding:14px 14px 14px 22px; display:flex; align-items:center; justify-content:center; z-index:1; pointer-events:none; }
      .vg-book .peek .pages{ width:100%; height:100%; display:flex; gap:10px; align-items:center; justify-content:center; opacity:.0; transform: scale(.98); transition: opacity .25s ease, transform .25s ease; }
      .vg-book.peek-ready .peek .pages{ opacity:1; transform: scale(1); }
      .vg-book .peek canvas{ width:45%; height:auto; border-radius:10px; background:rgba(0,0,0,.22); border:1px solid rgba(255,255,255,.10); }
      .vg-book .peek .loading{ position:absolute; left:16px; bottom:14px; font-size:12px; opacity:.78; }

      .vg-book.vg-missing{ border-color: rgba(255,80,80,.40) !important; }
      .vg-book.vg-missing .cover .hint{ color: rgba(255,160,160,.92); opacity:1; }

      .vg-lib-viewer-overlay{ position:fixed; inset:0; z-index:99999; display:none; background:rgba(0,0,0,.65); backdrop-filter: blur(10px); }
      .vg-lib-viewer-overlay.show{ display:block; }
      .vg-lib-viewer-top{ position:fixed; left:16px; right:16px; top:16px; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 12px; border-radius:16px; z-index:2; }
      .vg-lib-flip-wrap{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding-top:86px; }
      #vg-lib-flip{ display:flex; align-items:center; justify-content:center; }
      .vg-page{ display:flex; align-items:center; justify-content:center; background:#111; }
      .vg-page canvas{ display:block; }
      .vg-page .ph{ font-size:12px; opacity:.85; padding:10px 14px; border-radius:12px; background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.12); }

      .vg-lib-error{ max-width:920px; margin:0 auto; padding:16px 16px; border-radius:18px; border:1px solid rgba(255,255,255,.14); background:rgba(0,0,0,.26); color:rgba(255,255,255,.92); backdrop-filter: blur(10px); }
      .vg-lib-error strong{ display:block; font-size:14px; }
    `;
    document.head.appendChild(css);
  }

  var state = {
    pdfjs: null,
    PageFlip: null,
    bookCache: new Map(),
    hoverTimers: new Map(),
    viewer: {
      open: false,
      book: null,
      pdf: null,
      pages: 0,
      zoom: 1.0,
      flip: null,
      rendered: new Set()
    }
  };

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $$(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function esc(s){
    s = String(s == null ? "" : s);
    return s.replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c] || c;
    });
  }

  function loadScriptOnce(src, key){
    return new Promise(function(resolve, reject){
      var existing = document.querySelector('script[data-vg-lib="'+key+'"]');
      if(existing){
        if(existing.getAttribute('data-loaded') === '1') return resolve();
        existing.addEventListener('load', function(){ resolve(); });
        existing.addEventListener('error', function(){ reject(new Error('Falha ao carregar '+src)); });
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-vg-lib', key);
      s.addEventListener('load', function(){ s.setAttribute('data-loaded','1'); resolve(); });
      s.addEventListener('error', function(){ reject(new Error('Falha ao carregar '+src)); });
      document.head.appendChild(s);
    });
  }

  async function ensureLibs(){
    if(!state.pdfjs){
      await loadScriptOnce(PDFJS_SRC, 'pdfjs');
      state.pdfjs = window.pdfjsLib;
      try{ state.pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }catch(e){}
    }
    if(!state.PageFlip){
      await loadScriptOnce(PAGEFLIP_SRC, 'pageflip');
      state.PageFlip = (window.St && window.St.PageFlip) ? window.St.PageFlip : null;
      if(!state.PageFlip) throw new Error('PageFlip não carregou (St.PageFlip ausente)');
    }
  }

  function getPdfCached(bookId){
    var c = state.bookCache.get(bookId);
    if(!c) return null;
    if(c && c.pdf) return c;
    return c;
  }

  async function getPdf(book, onProgress){
    var cached = getPdfCached(book.id);
    if(cached && cached.pdf) return cached;
    if(cached && cached.promise) return await cached.promise;

    await ensureLibs();

    function attachProgress(task, touch){
      if(task && task.onProgress){
        task.onProgress = function(evt){
          try{ touch(); }catch(e){}
          try{ if(onProgress) onProgress(evt); }catch(e){}
        };
      }
    }

    async function loadAttempt(opts){
      var controller = new AbortController();
      var lastProgressAt = Date.now();
      var startedAt = Date.now();
      function touch(){ lastProgressAt = Date.now(); }

      var task = state.pdfjs.getDocument(Object.assign({
        url: resolveUrl(book.file),
        disableStream: true,
        disableRange: true,
        disableAutoFetch: false,
        signal: controller.signal
      }, opts || {}));

      attachProgress(task, touch);

      var timer = setInterval(function(){
        var now = Date.now();
        if((now - lastProgressAt) > 20000) { try{ controller.abort(); }catch(e){} }
        if((now - startedAt) > 240000) { try{ controller.abort(); }catch(e){} }
      }, 1200);

      try{
        var pdf = await task.promise;
        clearInterval(timer);
        return pdf;
      }catch(e){
        clearInterval(timer);
        throw e;
      }
    }

    var p = (async function(){
      try{
        var pdf = await loadAttempt({ disableWorker: false });
        var out = { pdf: pdf, pages: pdf.numPages };
        state.bookCache.set(book.id, out);
        return out;
      }catch(err){
        try{
          var pdf2 = await loadAttempt({ disableWorker: true });
          var out2 = { pdf: pdf2, pages: pdf2.numPages };
          state.bookCache.set(book.id, out2);
          return out2;
        }catch(err2){
          state.bookCache.delete(book.id);
          throw err2;
        }
      }
    })();

    state.bookCache.set(book.id, { promise: p });
    return await p;
  }

  /* =========================
     SHELF (cards)
  ========================== */

  function mountShelf(panel){
    var shelf = $('#vg-lib-shelf', panel);
    if(!shelf) return;

    shelf.innerHTML = '';

    for(var i=0;i<BOOKS.length;i++){
      (function(book){
        var el = document.createElement('div');
        el.className = 'vg-book panel-skin';
        el.setAttribute('data-file', resolveUrl(book.file));
        el.setAttribute('data-book-id', book.id);
        el.innerHTML =
          '<div class="spine"></div>'+
          '<div class="page-edges"></div>'+
          '<div class="peek">'+
            '<div class="pages">'+
              '<canvas class="l"></canvas>'+
              '<canvas class="r"></canvas>'+
            '</div>'+
            '<div class="loading">passa o mouse…</div>'+
          '</div>'+
          '<div class="cover">'+
            '<div class="title">'+esc(book.title)+'</div>'+
            '<div class="sub">'+esc(book.subtitle || 'PDF')+'</div>'+
            '<div class="hint">Clique para abrir</div>'+
          '</div>';

        el.addEventListener('mouseenter', function(){ schedulePeek(el, book); });
        el.addEventListener('mouseleave', function(){ cancelPeek(el); });
        el.addEventListener('click', function(){ openViewer(book); });

        shelf.appendChild(el);
        try{ var io = ensureObserver(); if(io) io.observe(el); }catch(e){}
      })(BOOKS[i]);
    }
  }

  // Preload leve: quando o card entra na tela, testamos se o PDF existe no deploy.
  // Se não existir (muito comum quando o PDF não foi enviado pro GitHub por limite do upload web),
  // mostramos uma mensagem clara no card.
  var _io = null;
  function ensureObserver(){
    if(_io) return _io;
    if(!('IntersectionObserver' in window)) return null;
    _io = new IntersectionObserver(async function(entries){
      for(var i=0;i<entries.length;i++){
        var it = entries[i];
        if(!it.isIntersecting) continue;
        var card = it.target;
        try{ _io.unobserve(card); }catch(e){}

        var url = card.getAttribute('data-file') || '';
        var ok = await probeUrl(url);
        if(!ok){
          card.classList.add('vg-missing');
          var hint = card.querySelector('.cover .hint');
          if(hint) hint.textContent = 'PDF não encontrado no deploy';
          var sub = card.querySelector('.cover .sub');
          if(sub) sub.textContent = 'Confere se o PDF foi enviado ao GitHub (upload web tem limite).';
          var loading = card.querySelector('.peek .loading');
          if(loading){ loading.textContent = 'arquivo ausente'; loading.style.display = ''; }
        }
      }
    }, { root: null, threshold: 0.12 });
    return _io;
  }

  function schedulePeek(card, book){
    cancelPeek(card);
    var t = setTimeout(function(){ runPeek(card, book); }, 220);
    state.hoverTimers.set(card, t);
  }

  function cancelPeek(card){
    var t = state.hoverTimers.get(card);
    if(t) clearTimeout(t);
    state.hoverTimers.delete(card);
  }

  function pct(evt){
    if(!evt || !evt.loaded || !evt.total) return null;
    return Math.max(0, Math.min(100, Math.round((evt.loaded/evt.total)*100)));
  }

  async function runPeek(card, book){
    if(!card || !card.isConnected) return;
    var peek = $('.peek', card);
    if(!peek) return;
    var loading = $('.loading', peek);
    if(loading){
      loading.textContent = 'carregando…';
      loading.style.display = '';
    }

    try{
      var cached = await getPdf(book, function(evt){
        var p = pct(evt);
        if(p != null && loading) loading.textContent = 'baixando… ' + p + '%';
      });
      var pdf = cached.pdf;
      var pages = cached.pages;

      var max = Math.min(pages, 40);
      var base = 2 + Math.floor(Math.random() * Math.max(1, (max - 2)));
      var left = base;
      var right = Math.min(pages, base + 1);

      var cL = $('canvas.l', peek);
      var cR = $('canvas.r', peek);
      await renderThumb(pdf, left, cL);
      await renderThumb(pdf, right, cR);

      card.classList.add('peek-ready');
      if(loading) loading.style.display = 'none';
    }catch(e){
      if(loading){
        loading.textContent = 'falha ao carregar';
        loading.style.display = '';
      }
    }
  }

  async function renderThumb(pdf, pageNumber, canvas){
    if(!canvas) return;
    var page = await pdf.getPage(pageNumber);
    var viewport = page.getViewport({ scale: 0.35 });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    var ctx = canvas.getContext('2d', { alpha: false });
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  }

  /* =========================
     VIEWER (fullscreen flipbook)
  ========================== */

  function ensureViewerShell(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) return ov;

    ov = document.createElement('div');
    ov.id = 'vg-lib-viewer';
    ov.className = 'vg-lib-viewer-overlay';
    ov.innerHTML =
      '<div class="vg-lib-viewer-top panel-skin">'+
        '<div class="left">'+
          '<button id="vg-lib-close" class="icon-btn" title="Fechar">✕</button>'+
          '<div class="meta">'+
            '<strong id="vg-lib-title">Livro</strong>'+
            '<span id="vg-lib-page">—</span>'+
          '</div>'+
        '</div>'+
        '<div class="right">'+
          '<button id="vg-lib-full" class="icon-btn" title="Tela cheia">⛶</button>'+
          '<button id="vg-lib-zoomout" class="icon-btn" title="Zoom -">−</button>'+
          '<button id="vg-lib-zoomin" class="icon-btn" title="Zoom +">+</button>'+
        '</div>'+
      '</div>'+
      '<div class="vg-lib-flip-wrap">'+
        '<div id="vg-lib-flip"></div>'+
      '</div>';

    document.body.appendChild(ov);

    $('#vg-lib-close', ov).addEventListener('click', closeViewer);
    ov.addEventListener('click', function(e){ if(e.target === ov) closeViewer(); });

    $('#vg-lib-zoomin', ov).addEventListener('click', function(){ setZoom(state.viewer.zoom + 0.1); });
    $('#vg-lib-zoomout', ov).addEventListener('click', function(){ setZoom(state.viewer.zoom - 0.1); });

    $('#vg-lib-full', ov).addEventListener('click', function(){
      try{ if(!document.fullscreenElement){ ov.requestFullscreen(); } else { document.exitFullscreen(); } }catch(e){}
    });

    window.addEventListener('keydown', function(e){
      if(!state.viewer.open) return;
      if(e.key === 'Escape') closeViewer();
    });

    window.addEventListener('resize', function(){
      if(state.viewer.open) rebuildFlip();
    });

    return ov;
  }

  function setZoom(z){
    state.viewer.zoom = Math.max(0.7, Math.min(1.6, z));
    rebuildFlip();
  }

  function calcFlipSize(){
    var w = Math.min(1100, window.innerWidth - 36);
    var h = Math.min(760, window.innerHeight - 110);
    return { w: w, h: h };
  }

  async function openViewer(book){
    var ov = ensureViewerShell();

    ov.classList.add('show');
    state.viewer.open = true;
    state.viewer.book = book;

    $('#vg-lib-title', ov).textContent = book.title;
    $('#vg-lib-page', ov).textContent = 'carregando…';

    var host = document.getElementById('vg-lib-flip');
    if(host) host.innerHTML = '<div class="vg-lib-error"><strong>Carregando livro…</strong><div style="opacity:.8;margin-top:6px">Se demorar muito, é porque o navegador travou o leitor (CDN/worker) ou o PDF é muito pesado.</div></div>';

    try{
      await ensureLibs();
    }catch(e){
      showViewerError(book, 'Falha ao carregar o leitor (scripts externos bloqueados).', e);
      return;
    }

    try{
      var cached = await getPdf(book, function(evt){
        var p = pct(evt);
        if(p != null) $('#vg-lib-page', ov).textContent = 'baixando… ' + p + '%';
      });

      state.viewer.pdf = cached.pdf;
      state.viewer.pages = cached.pages;

      buildFlip();
    }catch(e2){
      showViewerError(book, 'Não consegui abrir o PDF. Pode ser Range/Stream do deploy ou download travado.', e2);
    }
  }

  function showViewerError(book, msg, err){
    var ov = document.getElementById('vg-lib-viewer');
    var host = document.getElementById('vg-lib-flip');
    var url = resolveUrl(book.file);
    if(ov){
      $('#vg-lib-title', ov).textContent = book.title;
      $('#vg-lib-page', ov).textContent = 'erro';
    }
    if(host){
      var details = '';
      try{ details = (err && err.message) ? String(err.message) : String(err||''); }catch(e){}
      host.innerHTML =
        '<div class="vg-lib-error">'
        + '<strong>'+esc(msg)+'</strong>'
        + '<div style="opacity:.85;margin-top:8px">Teste abrindo o PDF direto no navegador. Se abrir, o problema é só no leitor.</div>'
        + '<div class="actions" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">'
        +   '<button class="icon-btn" id="vg-lib-openraw">Abrir PDF</button>'
        +   '<button class="icon-btn" id="vg-lib-retry">Tentar de novo</button>'
        + '</div>'
        + (details ? ('<div style="opacity:.6;margin-top:10px;font-size:12px">'+esc(details)+'</div>') : '')
        + '</div>';

      var b1 = document.getElementById('vg-lib-openraw');
      if(b1) b1.addEventListener('click', function(e){ e.stopPropagation(); try{ window.open(url, '_blank'); }catch(_e){} });
      var b2 = document.getElementById('vg-lib-retry');
      if(b2) b2.addEventListener('click', function(e){ e.stopPropagation(); openViewer(book); });
    }
  }

  function closeViewer(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) ov.classList.remove('show');

    try{ if(state.viewer.flip && state.viewer.flip.destroy) state.viewer.flip.destroy(); }catch(e){}

    state.viewer.open = false;
    state.viewer.book = null;
    state.viewer.pdf = null;
    state.viewer.pages = 0;
    state.viewer.flip = null;
    state.viewer.rendered = new Set();

    var host = document.getElementById('vg-lib-flip');
    if(host) host.innerHTML = '';
  }

  function buildPageDiv(n){
    var d = document.createElement('div');
    d.className = 'vg-page';
    d.setAttribute('data-page', String(n));
    d.innerHTML = '<div class="ph">carregando…</div>';
    return d;
  }

  async function buildFlip(){
    var host = document.getElementById('vg-lib-flip');
    if(!host) return;

    host.innerHTML = '';

    var pages = state.viewer.pages;
    for(var i=1;i<=pages;i++) host.appendChild(buildPageDiv(i));

    var size = calcFlipSize();
    var w = size.w;
    var h = size.h;

    var flip = new state.PageFlip(host, {
      width:  Math.floor((w/2) * state.viewer.zoom),
      height: Math.floor(h * state.viewer.zoom),
      size: 'stretch',
      minWidth: 320,
      minHeight: 420,
      maxWidth: 1400,
      maxHeight: 900,
      showCover: true,
      mobileScrollSupport: true,
      useMouseEvents: true,
      useTouchEvents: true,
    });

    flip.loadFromHTML($$('.vg-page', host));

    flip.on('flip', function(e){
      var page = ((e && e.data) ? e.data : 0) + 1;
      updatePageLabel(page);
      renderAround(page);
    });

    state.viewer.flip = flip;

    updatePageLabel(1);
    renderAround(1);

    try{ host.parentElement.classList.add('animate-in'); setTimeout(function(){ host.parentElement.classList.remove('animate-in'); }, 350); }catch(e){}
  }

  function rebuildFlip(){
    if(!state.viewer.open) return;
    try{ if(state.viewer.flip && state.viewer.flip.destroy) state.viewer.flip.destroy(); }catch(e){}
    state.viewer.flip = null;
    state.viewer.rendered = new Set();
    buildFlip();
  }

  function updatePageLabel(p){
    var ov = document.getElementById('vg-lib-viewer');
    if(!ov) return;
    $('#vg-lib-page', ov).textContent = 'Página ' + p + ' / ' + state.viewer.pages;
  }

  async function renderAround(page){
    var pdf = state.viewer.pdf;
    if(!pdf) return;

    var want = [page, page-1, page+1, page-2, page+2];
    for(var i=0;i<want.length;i++){
      var n = want[i];
      if(n < 1 || n > state.viewer.pages) continue;
      if(state.viewer.rendered.has(n)) continue;
      state.viewer.rendered.add(n);
      renderPageInto(n);
    }
  }

  async function renderPageInto(pageNumber){
    var host = document.getElementById('vg-lib-flip');
    if(!host) return;

    var pageEl = host.querySelector('.vg-page[data-page="'+pageNumber+'"]');
    if(!pageEl) return;

    var ph = $('.ph', pageEl);
    if(ph){ ph.textContent = 'renderizando…'; ph.style.display = ''; }

    try{
      var pdf = state.viewer.pdf;
      var page = await pdf.getPage(pageNumber);

      var canvas = pageEl.querySelector('canvas');
      if(!canvas){
        canvas = document.createElement('canvas');
        pageEl.insertBefore(canvas, pageEl.firstChild);
      }

      var size = calcFlipSize();
      var targetW = Math.floor((size.w/2) * state.viewer.zoom);
      var baseVp = page.getViewport({ scale: 1 });
      var scale = targetW / baseVp.width;
      var vp = page.getViewport({ scale: scale });

      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);

      var ctx = canvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      if(ph) ph.style.display = 'none';
    }catch(e){
      if(ph){ ph.textContent = 'falha ao renderizar'; ph.style.display = ''; }
    }
  }

  /* =========================
     SEARCH
  ========================== */

  function mountSearch(panel){
    var input = $('#vg-lib-search', panel);
    if(!input) return;

    input.addEventListener('input', function(){
      var q = (input.value || '').trim().toLowerCase();
      var cards = $$('.vg-book', panel);
      cards.forEach(function(c){
        var id = c.getAttribute('data-book-id');
        var book = null;
        for(var i=0;i<BOOKS.length;i++) if(BOOKS[i].id === id) book = BOOKS[i];
        var hay = ((book ? book.title : '') + ' ' + (book ? (book.subtitle||'') : '')).toLowerCase();
        c.style.display = (!q || hay.indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }

  function mountWhenReady(){
    var panel = document.getElementById('library-panel');
    if(!panel) return;

    // garante estilo no deploy (mesmo se o CSS externo estiver cacheado/desatualizado)
    try{ ensureLibraryCSS(); }catch(e){}

    if(panel.getAttribute('data-vg-lib-mounted') === '1') return;
    panel.setAttribute('data-vg-lib-mounted', '1');
    mountShelf(panel);
    mountSearch(panel);
  }

  window.VGLibrary = {
    mount: mountWhenReady,
    open: openViewer,
    books: BOOKS
  };

  window.addEventListener('vg:show-library', function(){ mountWhenReady(); });
  window.addEventListener('load', function(){ mountWhenReady(); });
  window.addEventListener('DOMContentLoaded', function(){ mountWhenReady(); });

})();