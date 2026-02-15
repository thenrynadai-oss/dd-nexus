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
/* =========================================================
   BIBLIOTECA (AnyFlip-like)
   - Sem CDN: usa libs locais (pdf.js + turn.js)
   - Card 3D (capa real) + Viewer fullscreen com virada por drag
   - PDFs locais (library/books/*.pdf)
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
      cover: "library/covers/dd5e.webp",
    },
    {
      id: "valdas",
      title: "Valda's Spire of Secrets",
      subtitle: "Livro",
      file: "library/books/valdas-spire-of-secrets.pdf",
      cover: "library/covers/valdas.webp",
    }
  ];

  var LOCAL = {
    PDFJS: "library/vendor/pdfjs/pdf.min.js",
    PDFJS_WORKER: "library/vendor/pdfjs/pdf.worker.min.js",
    JQUERY: "library/vendor/jquery/jquery.min.js",
    TURN: "library/vendor/turn/turn.min.js",
    CSS: "library/library.css",
  };

  function esc(s){
    return String(s ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function resolveUrl(rel){
    try{ return new URL(rel, document.baseURI).toString(); }
    catch(e){ return rel; }
  }

  function loadStyleOnce(href){
    var url = resolveUrl(href);
    if(document.querySelector('link[data-vg-lib-css="1"][href="'+url+'"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-vg-lib-css','1');
    document.head.appendChild(link);
  }

  function loadScriptOnce(key, src){
    return new Promise(function(resolve, reject){
      var url = resolveUrl(src);
      var existing = document.querySelector('script[data-vg-lib="'+key+'"]');
      if(existing){
        if(existing.getAttribute('data-loaded') === '1') return resolve();
        if(existing.readyState === 'complete' || existing.readyState === 'loaded'){
          existing.setAttribute('data-loaded','1');
          return resolve();
        }
        existing.addEventListener('load', function(){ existing.setAttribute('data-loaded','1'); resolve(); }, { once:true });
        existing.addEventListener('error', function(){ reject(new Error('Falha ao carregar: '+url)); }, { once:true });
        return;
      }
      var s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.defer = false;
      s.setAttribute('data-vg-lib', key);
      s.onload = function(){ s.setAttribute('data-loaded','1'); resolve(); };
      s.onerror = function(){ reject(new Error('Falha ao carregar: '+url)); };
      document.head.appendChild(s);
    });
  }

  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  async function ensureLibs(){
    // CSS
    loadStyleOnce(LOCAL.CSS);

    // pdf.js (local)
    if(!window.pdfjsLib){
      await loadScriptOnce('pdfjs', LOCAL.PDFJS);
    }
    if(!window.pdfjsLib) throw new Error('pdfjsLib não carregou');

    // worker local (mesma origem)
    try{
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = resolveUrl(LOCAL.PDFJS_WORKER);
    }catch(e){}

    // Reaproveita instância já pronta
    if(window.__VG_JQ && window.__VG_JQ.fn && window.__VG_JQ.fn.turn){
      return { pdfjsLib: window.pdfjsLib, $: window.__VG_JQ };
    }

    // jQuery (local)
    if(!window.jQuery || !window.jQuery.fn){
      await loadScriptOnce('jquery', LOCAL.JQUERY);
    }
    var jq = window.jQuery || window.$;
    if(!jq || !jq.fn) throw new Error('jQuery não carregou');

    // turn.js (local)
    if(!jq.fn.turn){
      await loadScriptOnce('turn', LOCAL.TURN);
    }
    if(!jq.fn.turn) throw new Error('Turn.js não carregou');

    // Guarda e mantém global (não removemos window.jQuery,
    // porque isso quebra próximas aberturas)
    window.__VG_JQ = jq;

    return { pdfjsLib: window.pdfjsLib, $: window.__VG_JQ };
  }

  function getShelf(){ return document.getElementById('vg-lib-shelf'); }
  function getSearch(){ return document.getElementById('vg-lib-search'); }

  function createBookCard(b){
    var el = document.createElement('div');
    el.className = 'vg-book';
    el.setAttribute('data-book', b.id);
    el.innerHTML = 
      '<div class="spine"></div>'+
      '<div class="page-edges"></div>'+
      '<div class="peek"><div class="paper"></div></div>'+
      '<div class="cover" style="background-image:url('+esc(resolveUrl(b.cover))+')">'+
        '<div class="title">'+esc(b.title)+'</div>'+
        '<div class="sub">'+esc(b.subtitle)+'</div>'+
        '<div class="hint">Clique para abrir</div>'+
      '</div>';
    el.addEventListener('click', function(){ openViewer(b); });
    return el;
  }

  function renderShelf(filter){
    var shelf = getShelf();
    if(!shelf) return;
    shelf.innerHTML = '';
    var q = String(filter || '').trim().toLowerCase();
    BOOKS.forEach(function(b){
      var hay = (b.title+' '+b.subtitle).toLowerCase();
      if(q && !hay.includes(q)) return;
      shelf.appendChild(createBookCard(b));
    });
  }

  function ensureViewer(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) return ov;

    ov = document.createElement('div');
    ov.id = 'vg-lib-viewer';
    ov.className = 'vg-lib-viewer-overlay';
    ov.innerHTML = 
      '<div class="vg-lib-viewer-top panel-skin">'+
        '<div class="left">'+
          '<button class="btn-ghost" id="vg-lib-close" title="Fechar">✕</button>'+
          '<div class="meta">'+
            '<strong id="vg-lib-title">Livro</strong>'+
            '<span id="vg-lib-sub">carregando…</span>'+
          '</div>'+
        '</div>'+
        '<div class="right">'+
          '<button class="btn-ghost" id="vg-lib-zoomout" title="Diminuir">−</button>'+
          '<button class="btn-ghost" id="vg-lib-zoomin" title="Aumentar">+</button>'+
        '</div>'+
      '</div>'+
      '<div class="vg-lib-flip-wrap">'+
        '<div class="vg-lib-loading" id="vg-lib-loading">'+
          '<div class="box">'+
            '<div class="t">Carregando livro…</div>'+
            '<div class="s" id="vg-lib-progress">Preparando leitor…</div>'+
            '<div class="btns">'+
              '<a class="btn-ghost" id="vg-lib-openpdf" target="_blank" rel="noopener">Abrir PDF</a>'+
              '<button class="btn-blue" id="vg-lib-tryagain" type="button">Tentar de novo</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div id="vg-flipbook" class="vg-flipbook"></div>'+
      '</div>';

    document.body.appendChild(ov);

    ov.querySelector('#vg-lib-close').addEventListener('click', function(){ closeViewer(); });
    ov.addEventListener('click', function(e){
      if(e.target === ov) closeViewer();
    });

    return ov;
  }

  var state = {
    open: false,
    book: null,
    pdf: null,
    $: null,
    pdfjsLib: null,
    zoom: 1,
    rendered: Object.create(null),
    loadingTask: null,
  };

  function showOverlay(){
    var ov = ensureViewer();
    ov.classList.add('show');
    state.open = true;
    document.documentElement.style.overflow = 'hidden';
  }

  function closeViewer(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) ov.classList.remove('show');
    state.open = false;
    document.documentElement.style.overflow = '';

    // limpa flipbook
    try{ destroyFlipbook(); }catch(e){}

    // cancela loadingTask pdf.js se estiver carregando
    try{ if(state.loadingTask) state.loadingTask.destroy(); }catch(e){}
    state.loadingTask = null;

    state.book = null;
    state.pdf = null;
    state.rendered = Object.create(null);
    state.zoom = 1;
  }

  function setLoading(text){
    var box = document.getElementById('vg-lib-loading');
    var p = document.getElementById('vg-lib-progress');
    if(box) box.style.display = '';
    if(p) p.textContent = text || '';
  }

  function hideLoading(){
    var box = document.getElementById('vg-lib-loading');
    if(box) box.style.display = 'none';
  }

  function withTimeout(promise, ms, label){
    var to;
    var t = new Promise(function(_, rej){
      to = setTimeout(function(){ rej(new Error(label || 'timeout')); }, ms);
    });
    return Promise.race([promise, t]).finally(function(){ clearTimeout(to); });
  }

  function fmtMB(bytes){
    var mb = bytes / (1024*1024);
    return mb.toFixed(mb >= 10 ? 0 : 1) + ' MB';
  }

  async function loadPdf(url){
    var pdfjsLib = state.pdfjsLib;

    // 1) Tenta streaming por URL (melhor pra PDFs grandes)
    try{
      var task = pdfjsLib.getDocument({
        url: url,
        // mitiga alertas de segurança em builds antigos
        isEvalSupported: false,
      });
      state.loadingTask = task;

      task.onProgress = function(p){
        if(!p) return;
        var loaded = p.loaded || 0;
        var total = p.total || 0;
        if(total){
          setLoading('Baixando: '+fmtMB(loaded)+' / '+fmtMB(total));
        }else{
          setLoading('Baixando: '+fmtMB(loaded));
        }
      };

      var pdf = await withTimeout(task.promise, 180000, 'Leitura do PDF demorou demais (timeout)');
      state.loadingTask = null;
      return pdf;
    }catch(err){
      try{ if(state.loadingTask) state.loadingTask.destroy(); }catch(e){}
      state.loadingTask = null;

      // 2) Fallback: baixa inteiro e abre por data
      try{
        setLoading('Baixando arquivo inteiro (fallback)…');
        var resp = await withTimeout(fetch(url, { cache: 'no-store' }), 180000, 'Download demorou demais (timeout)');
        if(!resp.ok) throw new Error('HTTP '+resp.status);
        var buf = await withTimeout(resp.arrayBuffer(), 180000, 'Download demorou demais (timeout)');

        var task2 = pdfjsLib.getDocument({ data: buf, isEvalSupported: false, disableWorker: true });
        state.loadingTask = task2;
        var pdf2 = await withTimeout(task2.promise, 180000, 'Parse do PDF demorou demais (timeout)');
        state.loadingTask = null;
        return pdf2;
      }catch(err2){
        throw err2 || err;
      }
    }
  }

  function calcBookSize(pageW, pageH){
    // page ratio
    var ratio = pageW / pageH;
    var maxW = Math.min(window.innerWidth * 0.96, 1400);
    var maxH = Math.min(window.innerHeight * 0.86, 900);

    var doubleMode = window.innerWidth > 860;
    var targetH = Math.min(maxH, doubleMode ? (maxW / (2*ratio)) : (maxW / ratio));
    targetH = Math.max(360, targetH);

    var pH = targetH;
    var pW = pH * ratio;

    if(!doubleMode){
      return { display: 'single', pageW: pW, pageH: pH, bookW: pW, bookH: pH };
    }
    return { display: 'double', pageW: pW, pageH: pH, bookW: pW*2, bookH: pH };
  }

  function destroyFlipbook(){
    var $ = state.$;
    if(!$) return;
    var $fb = $('#vg-flipbook');
    if($fb.length && $fb.data('turn')){
      try{ $fb.turn('destroy'); }catch(e){}
    }
    var el = document.getElementById('vg-flipbook');
    if(el) el.innerHTML = '';
  }

  function makePageEl(pageNum){
    var d = document.createElement('div');
    d.className = 'page';
    d.setAttribute('data-page', String(pageNum));
    d.innerHTML = '<div class="inner"><canvas></canvas><div class="ph">Carregando…</div></div>';
    return d;
  }

  async function renderPageToCanvas(pdf, pageNum, canvas, targetW, targetH){
    var key = String(pageNum);
    if(state.rendered[key]) return state.rendered[key];

    state.rendered[key] = (async () => {
      var page = await pdf.getPage(pageNum);
      var viewport1 = page.getViewport({ scale: 1 });
      var scale = targetW / viewport1.width;
      var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      var viewport = page.getViewport({ scale: scale * dpr * state.zoom });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      var ctx = canvas.getContext('2d', { alpha: false });
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.restore();

      var renderTask = page.render({ canvasContext: ctx, viewport: viewport });
      await renderTask.promise;

      var ph = canvas.parentElement && canvas.parentElement.querySelector('.ph');
      if(ph) ph.style.display = 'none';
    })().catch((e) => {
      var ph = canvas.parentElement && canvas.parentElement.querySelector('.ph');
      if(ph){ ph.style.display = ''; ph.textContent = 'Falha ao renderizar.'; }
      throw e;
    });

    return state.rendered[key];
  }

  async function initFlipbook(pdf){
    var $ = state.$;

    // mede primeira página
    setLoading('Preparando páginas…');
    var p1 = await pdf.getPage(1);
    var vp = p1.getViewport({ scale: 1 });

    var sizes = calcBookSize(vp.width, vp.height);

    destroyFlipbook();

    var fbEl = document.getElementById('vg-flipbook');
    if(!fbEl) throw new Error('Flipbook container não encontrado');

    fbEl.style.width = Math.round(sizes.bookW) + 'px';
    fbEl.style.height = Math.round(sizes.bookH) + 'px';

    var $fb = $(fbEl);

    // turn.js: cria com num total de páginas e usa missing() pra lazy add
    $fb.turn({
      width: Math.round(sizes.bookW),
      height: Math.round(sizes.bookH),
      autoCenter: true,
      gradients: true,
      acceleration: true,
      display: sizes.display,
      pages: pdf.numPages,
      when: {
        missing: function(e, pages){
          for(var i=0; i<pages.length; i++){
            var p = pages[i];
            var pageEl = makePageEl(p);
            $fb.turn('addPage', pageEl, p);
            var canvas = pageEl.querySelector('canvas');
            renderPageToCanvas(pdf, p, canvas, sizes.pageW, sizes.pageH);
          }
        },
        turning: function(e, page){
          // pré-render próximos
          var a = [page-2, page-1, page, page+1, page+2];
          a.forEach(function(p){
            if(p < 1 || p > pdf.numPages) return;
            var el = fbEl.querySelector('.page[data-page="'+p+'"]');
            if(!el) return; // missing vai chamar
            var canvas = el.querySelector('canvas');
            if(canvas) renderPageToCanvas(pdf, p, canvas, sizes.pageW, sizes.pageH);
          });
        }
      }
    });

    // força carregar páginas iniciais
    $fb.turn('page', 1);

    // renderiza já a capa rapidamente
    await wait(30);
    var el1 = fbEl.querySelector('.page[data-page="1"]');
    if(el1){
      var c1 = el1.querySelector('canvas');
      if(c1) await renderPageToCanvas(pdf, 1, c1, sizes.pageW, sizes.pageH);
    }

    hideLoading();
  }

  async function openViewer(book){
    showOverlay();

    var ov = ensureViewer();
    var title = document.getElementById('vg-lib-title');
    var sub = document.getElementById('vg-lib-sub');
    if(title) title.textContent = book.title;
    if(sub) sub.textContent = 'carregando…';

    // botão abrir pdf
    var url = resolveUrl(book.file);
    var openPdf = document.getElementById('vg-lib-openpdf');
    if(openPdf) openPdf.href = url;

    // actions
    var tryAgainBtn = document.getElementById('vg-lib-tryagain');
    if(tryAgainBtn){
      tryAgainBtn.onclick = function(){
        try{ destroyFlipbook(); }catch(e){}
        // reabrir
        openViewer(book);
      };
    }

    var zoomIn = document.getElementById('vg-lib-zoomin');
    var zoomOut = document.getElementById('vg-lib-zoomout');

    if(zoomIn) zoomIn.onclick = function(){
      state.zoom = Math.min(2, (state.zoom || 1) + 0.1);
      if(state.pdf) initFlipbook(state.pdf).catch(function(){});
    };
    if(zoomOut) zoomOut.onclick = function(){
      state.zoom = Math.max(0.8, (state.zoom || 1) - 0.1);
      if(state.pdf) initFlipbook(state.pdf).catch(function(){});
    };

    // carrega libs + pdf
    setLoading('Preparando leitor…');

    try{
      var libs = await ensureLibs();
      state.pdfjsLib = libs.pdfjsLib;
      state.$ = libs.$;

      setLoading('Abrindo PDF…');
      var pdf = await loadPdf(url);
      state.pdf = pdf;
      if(sub) sub.textContent = pdf.numPages + ' páginas';

      await initFlipbook(pdf);
    }catch(err){
      console.error('[Biblioteca] erro:', err);
      if(sub) sub.textContent = 'erro ao carregar';
      setLoading('Erro: '+(err && err.message ? err.message : String(err)));
      // mantém a caixa com Abrir PDF + Tentar de novo
    }
  }

  // init on tab open
  var inited = false;
  function init(){
    if(inited) return;
    inited = true;

    loadStyleOnce(LOCAL.CSS);

    renderShelf('');
    var inp = getSearch();
    if(inp){
      inp.addEventListener('input', function(){ renderShelf(inp.value); });
    }
  }

  window.addEventListener('vg:show-library', init);

  window.VGLibrary = {
    init: init,
    open: openViewer,
    list: function(){ return BOOKS.slice(); }
  };

})();
