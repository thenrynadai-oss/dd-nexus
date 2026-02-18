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
          '<button class="btn-ghost" id="vg-lib-prev" title="Página anterior">‹</button>'+
          '<div class="vg-lib-page-ind" id="vg-lib-pageind">1 / 1</div>'+
          '<button class="btn-ghost" id="vg-lib-next" title="Próxima página">›</button>'+
          '<button class="btn-ghost" id="vg-lib-pages" title="Páginas">☰</button>'+
          '<button class="btn-ghost" id="vg-lib-loupe" title="Lupa">🔍</button>'+
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
        '<div class="vg-lib-stage" id="vg-lib-stage">'+
          '<div id="vg-flipbook" class="vg-flipbook"></div>'+
          '<div id="vg-lib-dragfx" aria-hidden="true"><div class="fx left"></div><div class="fx right"></div></div>'+
          '<div id="vg-lib-draglayer" aria-hidden="true"></div>'+
          '<div id="vg-lib-panlayer" aria-hidden="true"></div>'+
        '</div>'+
      '</div>'+
      '<div class="vg-lib-pagemodal" id="vg-lib-pagemodal" aria-hidden="true">'+
        '<div class="vg-lib-modal-card panel-skin">'+
          '<div class="vg-lib-modal-top">'+
            '<strong>Selecionar página</strong>'+
            '<button class="btn-ghost" id="vg-lib-pages-close" title="Fechar">✕</button>'+
          '</div>'+
          '<div class="vg-lib-modal-search">'+
            '<input id="vg-lib-page-input" inputmode="numeric" type="number" min="1" placeholder="Número da página…" />'+
            '<button class="btn-blue" id="vg-lib-page-go" type="button">Ir</button>'+
          '</div>'+
          '<div class="vg-lib-thumb-scroll" id="vg-lib-thumb-scroll">'+
            '<div class="vg-lib-thumb-grid" id="vg-lib-thumb-grid"></div>'+
          '</div>'+
        '</div>'+
      '</div>';

    document.body.appendChild(ov);

    ov.querySelector('#vg-lib-close').addEventListener('click', function(){ closeViewer(); });
    ov.addEventListener('click', function(e){ if(e.target === ov) closeViewer(); });

    // modal páginas (abre/fecha)
    var pm = ov.querySelector('#vg-lib-pagemodal');
    var btnPages = ov.querySelector('#vg-lib-pages');
    var btnClosePages = ov.querySelector('#vg-lib-pages-close');
    function setPagesOpen(v){
      if(!pm) return;
      pm.setAttribute('aria-hidden', v ? 'false' : 'true');
      pm.classList.toggle('show', !!v);
      if(v){
        // foco no input
        var inp = ov.querySelector('#vg-lib-page-input');
        inp && inp.focus && inp.focus();
      }
    }
    if(btnPages) btnPages.addEventListener('click', function(){ if(!state.open) return; setPagesOpen(true); buildThumbGrid(); });
    if(btnClosePages) btnClosePages.addEventListener('click', function(){ setPagesOpen(false); });
    if(pm) pm.addEventListener('click', function(e){ if(e.target === pm) setPagesOpen(false); });

    // ir para página
    var btnGo = ov.querySelector('#vg-lib-page-go');
    var inpGo = ov.querySelector('#vg-lib-page-input');
    function go(){
      if(!state.open || !state.$ || !state.pdf) return;
      var n = parseInt(String(inpGo && inpGo.value || '').trim(), 10);
      if(!n || n < 1) n = 1;
      if(n > state.pdf.numPages) n = state.pdf.numPages;
      gotoPage(n);
      setPagesOpen(false);
    }
    if(btnGo) btnGo.addEventListener('click', go);
    if(inpGo) inpGo.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); go(); }
    });

    // lupa / zoom
    var btnLoupe = ov.querySelector('#vg-lib-loupe');
    if(btnLoupe) btnLoupe.addEventListener('click', function(){ toggleZoomMode(); });

    // setas de navegação (UI)
    var btnPrev = ov.querySelector('#vg-lib-prev');
    var btnNext = ov.querySelector('#vg-lib-next');
    if(btnPrev && !btnPrev.__vgBound){
      btnPrev.__vgBound = true;
      btnPrev.addEventListener('click', function(){ prevPage(); });
    }
    if(btnNext && !btnNext.__vgBound){
      btnNext.__vgBound = true;
      btnNext.addEventListener('click', function(){ nextPage(); });
    }

    return ov;
  }


  var state = {
    open: false,
    book: null,
    pdf: null,
    $: null,
    pdfjsLib: null,
    zoom: 1,
    // Render cache (por sessão do flipbook) para evitar re-render duplicado.
    // IMPORTANTE: precisa ser recriado a cada initFlipbook(), porque o Turn.js recria o DOM
    // (senão a gente fica “achando” que a página já renderizou e o canvas novo fica branco).
    rendered: new Map(),
    pageUrls: new Map(),
    pagePromises: new Map(),
    fullRender: true,
    loadingTask: null,
    sessionId: 0,
  zoomScale: 1, panX: 0, panY: 0, zoomMode: false, doubleCapable: false, pageW:0, pageH:0, bookW:0, bookH:0, thumbCache: new Map(), thumbQueue: [], thumbActive: 0, thumbObserver: null, thumbPromises: new Map(), _opening:false,
  };

  function showOverlay(){
    var ov = ensureViewer();
    ov.classList.add('show');
    state.open = true;
    document.documentElement.style.overflow = 'hidden';
    try{ document.body.classList.add('vg-lib-noselect'); }catch(e){}
    bindKeyNav();
  }

  function closeViewer(){
    var ov = document.getElementById('vg-lib-viewer');
    if(ov) ov.classList.remove('show');
    state.open = false;
    document.documentElement.style.overflow = '';
    try{ document.body.classList.remove('vg-lib-noselect'); }catch(e){}
    unbindKeyNav();

    // limpa flipbook
    try{ destroyFlipbook(); }catch(e){}

    // cancela loadingTask pdf.js se estiver carregando
    try{ if(state.loadingTask) state.loadingTask.destroy(); }catch(e){}
    state.loadingTask = null;

    // libera thumbs
    try{
      if(state.thumbObserver){ try{ state.thumbObserver.disconnect(); }catch(e){} }
      if(state.thumbCache){
        state.thumbCache.forEach(function(u){ try{ URL.revokeObjectURL(u); }catch(e){} });
      }
    }catch(e){}

    state.book = null;
    state.pdf = null;
    state.rendered = new Map();
    state.pagePromises = new Map();
    state.pageUrls = new Map();
    state.pagePromises = new Map();

    if(!$){
      if(el0) el0.innerHTML = '';
      return;
    }

    var $fb = $(el0);
    if($fb && $fb.length && $fb.data && $fb.data('turn')){
      try{ $fb.turn('destroy'); }catch(e){}
    }
    if(el0) el0.innerHTML = '';
  }


  // =========================================================
  // UX: zoom/pan + bloqueio de seleção
  // - sem overlay capturando drag (Turn.js precisa receber eventos)
  // - zoom é virtual (transform + pan), sem re-render pesado
  // =========================================================

  function applyBookTransform(){
    var fb = document.getElementById('vg-flipbook');
    if(!fb) return;
    var z = state.zoomScale || 1;
    var x = state.panX || 0;
    var y = state.panY || 0;
    fb.style.transformOrigin = 'center center';
    fb.style.transform = 'translate('+x+'px,'+y+'px) scale('+z+')';
  }

  function setZoomScale(z){
    state.zoomScale = Math.max(1, Math.min(2.6, z || 1));
    if(state.zoomScale === 1){ state.panX = 0; state.panY = 0; }
    applyBookTransform();
    refreshZoomUi();
  }

  function refreshZoomUi(){
    var ov = document.getElementById('vg-lib-viewer');
    if(!ov) return;
    var btnLoupe = ov.querySelector('#vg-lib-loupe');
    if(btnLoupe){
      btnLoupe.classList.toggle('active', !!state.zoomMode);
      btnLoupe.textContent = state.zoomMode ? '🔎' : '🔍';
      btnLoupe.title = state.zoomMode ? 'Sair da lupa' : 'Lupa';
    }
  }

  function toggleZoomMode(force){
    var v = (force==null) ? !state.zoomMode : !!force;
    state.zoomMode = v;
    var layer = document.getElementById('vg-lib-panlayer');
    if(layer){
      layer.style.pointerEvents = v ? 'auto' : 'none';
      layer.classList.toggle('vg-pan-on', v);
    }
    var drag = document.getElementById('vg-lib-draglayer');
    if(drag){
      drag.classList.toggle('vg-drag-off', v);
      drag.style.pointerEvents = v ? 'none' : 'auto';
    }

    if(!v){
      // ao sair, reseta pan (mantém zoom se usuário quiser)
      state.panX = 0; state.panY = 0;
      applyBookTransform();
    } else {
      // zoom mínimo ao entrar na lupa
      if((state.zoomScale||1) < 1.35) setZoomScale(1.35);
    }
    refreshZoomUi();
  }

  function bindPanLayer(){
    var layer = document.getElementById('vg-lib-panlayer');
    if(!layer || layer.__vgBound) return;
    layer.__vgBound = true;

    var down=false, sx=0, sy=0, px=0, py=0, pid=null;

    layer.addEventListener('pointerdown', function(e){
      if(!state.open || !state.zoomMode) return;
      down=true;
      sx=e.clientX; sy=e.clientY;
      px=state.panX||0; py=state.panY||0;
      pid=e.pointerId;
      try{ layer.setPointerCapture(pid); }catch(err){}
      layer.classList.add('vg-panning');
      e.preventDefault();
      e.stopPropagation();
    }, { passive:false });

    layer.addEventListener('pointermove', function(e){
      if(!down || e.pointerId!==pid) return;
      var dx=e.clientX-sx;
      var dy=e.clientY-sy;
      state.panX = px + dx;
      state.panY = py + dy;
      applyBookTransform();
      e.preventDefault();
      e.stopPropagation();
    }, { passive:false });

    function end(e){
      if(!down || (pid!=null && e.pointerId!==pid)) return;
      down=false;
      try{ layer.releasePointerCapture(pid); }catch(err){}
      pid=null;
      layer.classList.remove('vg-panning');
      e.preventDefault();
      e.stopPropagation();
    }

    layer.addEventListener('pointerup', end, { passive:false });
    layer.addEventListener('pointercancel', end, { passive:false });

    // rolagem do mouse dentro do livro (ctrl+scroll dá zoom)
    layer.addEventListener('wheel', function(e){
      if(!state.open || !state.zoomMode) return;
      if(!e.ctrlKey) return; // evita roubar scroll normal do app
      e.preventDefault();
      var dz = (e.deltaY > 0) ? -0.08 : 0.08;
      setZoomScale((state.zoomScale||1) + dz);
    }, { passive:false });

    // bloqueia seleção
    layer.addEventListener('contextmenu', function(e){ e.preventDefault(); }, { passive:false });
  }



  function bindDragLayer(){
    var layer = document.getElementById('vg-lib-draglayer');
    var fxWrap = document.getElementById('vg-lib-dragfx');
    if(!layer || layer.__vgBound) return;
    layer.__vgBound = true;

    var down=false, sx=0, sy=0, dx=0, dir=0, pid=null;
    var TH = 140;   // distância para “confirmar” virada
    var START = 10; // distância mínima para começar a mostrar o efeito

    function resetFx(){
      if(!fxWrap) return;
      fxWrap.classList.remove('show','dir-next','dir-prev');
      var l = fxWrap.querySelector('.fx.left');
      var r = fxWrap.querySelector('.fx.right');
      if(l) l.style.transform = 'perspective(1000px) rotateY(0deg)';
      if(r) r.style.transform = 'perspective(1000px) rotateY(0deg)';
    }

    function setFx(d, prog){
      if(!fxWrap) return;
      var p = Math.max(0, Math.min(1, prog || 0));
      var ang = p * 55;
      fxWrap.classList.add('show');
      fxWrap.classList.toggle('dir-next', d>0);
      fxWrap.classList.toggle('dir-prev', d<0);
      var l = fxWrap.querySelector('.fx.left');
      var r = fxWrap.querySelector('.fx.right');
      if(d>0){
        if(r) r.style.transform = 'perspective(1000px) rotateY(' + (-ang) + 'deg)';
        if(l) l.style.transform = 'perspective(1000px) rotateY(0deg)';
      } else {
        if(l) l.style.transform = 'perspective(1000px) rotateY(' + (ang) + 'deg)';
        if(r) r.style.transform = 'perspective(1000px) rotateY(0deg)';
      }
    }

    function commit(d){
      var $fb = state.$fb;
      if(!$fb) return;
      try{
        if(d>0) $fb.turn('next');
        else $fb.turn('previous');
      }catch(e){
        try{
          var cur = $fb.turn('page') || 1;
          $fb.turn('page', cur + (d>0?1:-1));
        }catch(err){}
      }
    }

    layer.addEventListener('pointerdown', function(e){
      if(!state.open || state.zoomMode) return;
      down=true;
      sx=e.clientX; sy=e.clientY;
      dx=0; dir=0;
      pid=e.pointerId;
      try{ layer.setPointerCapture(pid); }catch(err){}
      // não deixa o browser iniciar seleção
      e.preventDefault();
    }, { passive:false });

    layer.addEventListener('pointermove', function(e){
      if(!down || (pid!=null && e.pointerId!==pid)) return;
      dx = (e.clientX - sx);
      var adx = Math.abs(dx);

      if(dir===0 && adx > START){
        // arrastar para esquerda = próxima página
        dir = (dx < 0) ? 1 : -1;
      }

      if(dir!==0){
        setFx(dir, adx / TH);
        e.preventDefault();
      }
    }, { passive:false });

    function end(e){
      if(!down || (pid!=null && e.pointerId!==pid)) return;
      down=false;
      try{ layer.releasePointerCapture(pid); }catch(err){}
      var adx = Math.abs(dx);
      var localDir = dir;
      pid=null;
      resetFx();

      // “clique” nas laterais como fallback
      if(adx < 8){
        var rect = layer.getBoundingClientRect();
        var relX = e.clientX - rect.left;
        if(relX > rect.width*0.56) localDir = 1;
        else if(relX < rect.width*0.44) localDir = -1;
      }

      if(state._opening) return;

      if(localDir!==0 && (adx > TH*0.28 || adx < 8)){
        commit(localDir);
      }

      dx=0; dir=0;
      e.preventDefault();
    }

    layer.addEventListener('pointerup', end, { passive:false });
    layer.addEventListener('pointercancel', end, { passive:false });

    resetFx();
  }
  function bindNoSelect(){
    var ov = document.getElementById('vg-lib-viewer');
    if(!ov || ov.__vgNoSel) return;
    ov.__vgNoSel = true;

    // Em alguns browsers, mesmo com user-select:none, o drag pode tentar selecionar.
    // Isso cancela seleção SEM atrapalhar o Turn.js (não intercepta mousedown/mousemove).
    ov.addEventListener('selectstart', function(e){
      if(!state.open) return;
      e.preventDefault();
    });

    ov.addEventListener('dragstart', function(e){
      if(!state.open) return;
      e.preventDefault();
    });
  }


  // =========================================================
  // Drag-to-flip a partir de QUALQUER ponto da página (AnyFlip feel)
  // Turn.js só inicia o “peel” se o mousedown começar perto do topo/baixo.
  // Então, quando o usuário clica no meio, redirecionamos o início para o canto correto,
  // mas deixamos o mousemove/up reais seguirem normalmente — assim a dobra acompanha o cursor.
  // =========================================================
  function bindAnyDragStart(){
    var fbEl = state.fbEl;
    if(!fbEl || fbEl.__vgAnyDrag) return;
    fbEl.__vgAnyDrag = true;

    // evita recursão ao disparar evento sintético
    state.__vgSynth = false;

    fbEl.addEventListener('mousedown', function(e){
      if(!state.open || state.zoomMode) return;
      if(state.__vgSynth) return;
      if(e.button !== 0) return;

      var rect = fbEl.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      if(x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      var b = state.cornerSize || 160;
      // Se já está perto do topo/baixo, deixa o Turn.js fazer o trabalho normal
      if(y < b || y > (rect.height - b)) return;

      // decide direção e canto com base na posição clicada
      var side = (x < rect.width/2) ? 'l' : 'r';

      // capa (página 1) e última página: força o canto correto pra evitar bug na primeira virada
      try{
        if(state.$fb && state.$fb.turn){
          var curPage = state.$fb.turn('page') || 1;
          var total = (state.pdf && state.pdf.numPages) ? state.pdf.numPages : 0;
          if(curPage === 1) side = 'r';
          if(total && curPage === total) side = 'l';
        }
      }catch(err){}
      var top  = (y < rect.height/2);
      var sx = (side === 'l') ? (rect.left + 2) : (rect.right - 2);
      var sy = top ? (rect.top + 2) : (rect.bottom - 2);

      // cancela o evento original e inicia o peel em um ponto válido
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();

      // escolhe um target real sob o ponto sintético
      var target = document.elementFromPoint(sx, sy) || fbEl;

      state.__vgSynth = true;
      try{
        var ev = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: sx,
          clientY: sy,
          screenX: e.screenX,
          screenY: e.screenY,
          button: 0,
          buttons: 1
        });
        target.dispatchEvent(ev);
      } finally {
        // libera no próximo tick pra não reentrar no mesmo frame
        setTimeout(function(){ state.__vgSynth = false; }, 0);
      }
    }, true);
  }

  // =========================================================
  // Páginas: grid com thumbnails (scroll progressivo estilo Pinterest)
  // =========================================================

  function buildThumbGrid(){
    if(!state.open || !state.pdf) return;
    var ov = document.getElementById('vg-lib-viewer');
    if(!ov) return;
    var grid = ov.querySelector('#vg-lib-thumb-grid');
    if(!grid) return;

    // já construído para esse pdf
    if(grid.getAttribute('data-built') === String(state.sessionId)){
      return;
    }

    grid.innerHTML = '';
    grid.setAttribute('data-built', String(state.sessionId));

    var frag = document.createDocumentFragment();
    for(var i=1;i<=state.pdf.numPages;i++){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'vg-thumb';
      b.setAttribute('data-page', String(i));
      b.innerHTML = '<div class="ph">Carregando…</div><img alt="" loading="lazy" /><div class="num">'+i+'</div>';
      frag.appendChild(b);
    }
    grid.appendChild(frag);

    // clique para ir (bind uma vez)
    if(!grid.__vgClickBound){
      grid.__vgClickBound = true;
      grid.addEventListener('click', function(e){
        var t = e.target.closest('button.vg-thumb');
        if(!t) return;
        var p = parseInt(t.getAttribute('data-page')||'1',10);
        if(!p) p=1;
        gotoPage(p);
        // fecha modal
        var pm = ov.querySelector('#vg-lib-pagemodal');
        if(pm){ pm.classList.remove('show'); pm.setAttribute('aria-hidden','true'); }
      }, { passive:true });
    }

    // lazy thumbs com IntersectionObserver
    if(state.thumbObserver){ try{ state.thumbObserver.disconnect(); }catch(e){} }
    state.thumbObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(ent){
        if(!ent.isIntersecting) return;
        var btn = ent.target;
        state.thumbObserver.unobserve(btn);
        var p = parseInt(btn.getAttribute('data-page')||'1',10);
        var img = btn.querySelector('img');
        if(!img) return;
        enqueueThumb(p, img, btn);
      });
    }, { root: ov.querySelector('#vg-lib-thumb-scroll') || null, rootMargin: '300px 0px', threshold: 0.01 });

    var items = grid.querySelectorAll('button.vg-thumb');
    for(var j=0;j<items.length;j++) state.thumbObserver.observe(items[j]);
  }

  function enqueueThumb(pageNum, imgEl, btnEl){
    if(!state.pdf) return;
    if(!state.thumbCache) state.thumbCache = new Map();

    if(state.thumbCache.has(pageNum)){
      var u = state.thumbCache.get(pageNum);
      imgEl.src = u;
      imgEl.style.display = 'block';
      var ph = btnEl && btnEl.querySelector('.ph');
      if(ph) ph.style.display = 'none';
      return;
    }

    if(!state.thumbQueue) state.thumbQueue = [];
    if(!state.thumbActive) state.thumbActive = 0;

    // evita enfileirar repetido
    if(imgEl.__vgQueued) return;
    imgEl.__vgQueued = true;

    state.thumbQueue.push({ page: pageNum, img: imgEl, btn: btnEl, sessionId: state.sessionId });
    pumpThumbQueue();
  }

  function pumpThumbQueue(){
    if(!state.thumbQueue) return;
    while((state.thumbActive||0) < 2 && state.thumbQueue.length){
      var job = state.thumbQueue.shift();
      state.thumbActive = (state.thumbActive||0) + 1;
      (async function(){
        try{
          var u = await renderThumb(job.page, job.sessionId);
          if(job.sessionId !== state.sessionId) return;
          if(u){
            if(!state.thumbCache) state.thumbCache = new Map();
            state.thumbCache.set(job.page, u);
            job.img.src = u;
            job.img.style.display = 'block';
            var ph = job.btn && job.btn.querySelector('.ph');
            if(ph) ph.style.display = 'none';
          }
        }catch(e){
          var ph2 = job.btn && job.btn.querySelector('.ph');
          if(ph2) ph2.textContent = 'Falha';
        }
      })().finally(function(){
        state.thumbActive = Math.max(0,(state.thumbActive||1)-1);
        pumpThumbQueue();
      });
    }
  }

  async function renderThumb(pageNum, sessionId){
    if(!state.pdfjsLib || !state.pdf) return null;
    if(sessionId != null && sessionId !== state.sessionId) return null;

    // cache promise
    state.thumbPromises = state.thumbPromises || new Map();
    if(state.thumbPromises.has(pageNum)) return state.thumbPromises.get(pageNum);

    var prom = (async () => {
      var page = await state.pdf.getPage(pageNum);
      var vp1 = page.getViewport({ scale: 1 });
      var targetW = 260; // thumb grande, estilo pinterest
      var scale = targetW / vp1.width;
      var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.6));
      var vp = page.getViewport({ scale: scale * dpr });

      var c = document.createElement('canvas');
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      var ctx = c.getContext('2d', { alpha:false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,c.width,c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      if(sessionId != null && sessionId !== state.sessionId) return null;

      var blob = await new Promise(function(res){
        try{ c.toBlob(function(b){ res(b); }, 'image/webp', 0.82); }catch(e){ res(null); }
      });
      if(!blob) return null;
      return URL.createObjectURL(blob);
    })();

    state.thumbPromises.set(pageNum, prom);
    try{ return await prom; }
    finally{ state.thumbPromises.delete(pageNum); }
  }

  function updatePageIndicator(page, total){
    var el = document.getElementById('vg-lib-pageind');
    if(!el) return;
    el.textContent = String(page||1) + ' / ' + String(total||1);
  }

  // Aplica corretamente o modo "capa" (single) vs livro aberto (double)
  // e atualiza tanto o flipbook quanto o stage (container), senão o livro fica
  // "preso" em largura de 1 página (bug visto no deploy).
  function applyDisplayForPage($fb, fbEl, sizes, page){
    if(!state.doubleCapable) return;
    var stage = document.getElementById('vg-lib-stage');
    if(page === 1){
      try{ $fb.turn('display','single'); }catch(e){}
      try{ $fb.turn('size', Math.round(sizes.pageW), Math.round(sizes.pageH)); }catch(e){}
      fbEl.style.width  = Math.round(sizes.pageW) + 'px';
      fbEl.style.height = Math.round(sizes.pageH) + 'px';
      if(stage){
        stage.style.width  = Math.round(sizes.pageW) + 'px';
        stage.style.height = Math.round(sizes.pageH) + 'px';
        stage.classList.remove('vg-double');
      }
    } else {
      try{ $fb.turn('display','double'); }catch(e){}
      try{ $fb.turn('size', Math.round(sizes.bookW), Math.round(sizes.bookH)); }catch(e){}
      fbEl.style.width  = Math.round(sizes.bookW) + 'px';
      fbEl.style.height = Math.round(sizes.bookH) + 'px';
      if(stage){
        stage.style.width  = Math.round(sizes.bookW) + 'px';
        stage.style.height = Math.round(sizes.bookH) + 'px';
        stage.classList.add('vg-double');
      }
    }
  }

  function gotoPage(n){
    if(!state.$) return;
    var fbEl = document.getElementById('vg-flipbook');
    if(!fbEl) return;
    var $fb = state.$(fbEl);
    try{
      // aplica modo correto (capa / double) + ajusta container
      if(state.doubleCapable && state.sizes){
        applyDisplayForPage($fb, fbEl, state.sizes, n);
      }
      $fb.turn('page', n);
    }catch(e){}
  }

  function makePageEl(pageNum){
    var d = document.createElement('div');
    d.className = 'page';
    d.setAttribute('data-page', String(pageNum));
    // Renderizamos em canvas, mas depois trocamos por <img> (Blob URL) pra não estourar memória
    // quando o livro é grande (e para evitar “branco” em páginas já renderizadas).
    d.innerHTML = '<div class="inner"><img class="img" alt=""><canvas></canvas><div class="ph">Carregando…</div></div>';
    return d;
  }

  async function renderPageToCanvas(pdf, pageNum, canvas, targetW, targetH, sessionId){
    // Cada initFlipbook() cria uma nova sessão; renders antigos não podem “contaminar” o DOM novo.
    if(sessionId != null && sessionId !== state.sessionId) return;

    var key = String(pageNum);

    // Se já temos a imagem desta página (cache), reaplica no DOM atual (Turn.js pode recriar nós ao trocar display/size)
    var cachedUrl = state.pageUrls && state.pageUrls.get(key);
    if(cachedUrl){
      var wrap0 = canvas.parentElement;
      var img0 = wrap0 && wrap0.querySelector('img.img');
      if(img0){
        img0.src = cachedUrl;
        img0.__vgUrl = cachedUrl;
        img0.style.display = 'block';
        canvas.style.display = 'none';
      }
      var ph0 = wrap0 && wrap0.querySelector('.ph');
      if(ph0) ph0.style.display = 'none';
      return Promise.resolve(cachedUrl);
    }

    var inflight = state.pagePromises && state.pagePromises.get(key);
    if(inflight){
      return inflight.then(function(){
        var u = state.pageUrls && state.pageUrls.get(key);
        if(u){
          var wrap1 = canvas.parentElement;
          var img1 = wrap1 && wrap1.querySelector('img.img');
          if(img1){ img1.src = u; img1.__vgUrl = u; img1.style.display='block'; canvas.style.display='none'; }
          var ph1 = wrap1 && wrap1.querySelector('.ph');
          if(ph1) ph1.style.display='none';
        }
        return u;
      });
    }

    var p = (async () => {
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

      // Se durante o render o usuário deu zoom/rebuild, não aplica “resultado” no DOM novo.
      if(sessionId != null && sessionId !== state.sessionId) return;

      // Converte para imagem (Blob URL) e libera o bitmap do canvas.
      var wrap = canvas.parentElement;
      var img = wrap && wrap.querySelector('img.img');

      if(img && canvas.toBlob){
        var blob = await new Promise(function(res){
          try{
            canvas.toBlob(function(b){ res(b); }, 'image/webp', 0.85);
          }catch(e){ res(null); }
        });
        if(sessionId != null && sessionId !== state.sessionId) return;

        if(blob){
          // revoga anterior (se existir)
          try{ if(img.__vgUrl) URL.revokeObjectURL(img.__vgUrl); }catch(e){}
          var u = URL.createObjectURL(blob);
          // guarda URL para reaplicar caso o Turn.js recrie o DOM
          try{ state.pageUrls && state.pageUrls.set(String(pageNum), u); }catch(e){}
          img.__vgUrl = u;
          img.src = u;
          img.style.display = 'block';
          canvas.style.display = 'none';
          // libera memória do canvas
          try{ canvas.width = 1; canvas.height = 1; }catch(e){}
        }
      }

      var ph = wrap && wrap.querySelector('.ph');
      if(ph) ph.style.display = 'none';
    })().catch((e) => {
      var ph = canvas.parentElement && canvas.parentElement.querySelector('.ph');
      if(ph){ ph.style.display = ''; ph.textContent = 'Falha ao renderizar.'; }
      throw e;
    });

    // promessa em voo
    state.pagePromises.set(key, p);
    return p.finally(function(){
      try{ state.pagePromises.delete(key); }catch(e){}
    });
  }

  
  async function initFlipbook(pdf){
    var $ = state.$;

    // destrói qualquer instância anterior (revoga blobs e limpa DOM)
    try{ destroyFlipbook(); }catch(e){}

    // Nova sessão: invalida qualquer render antigo (zoom/rebuild etc.)
    state.sessionId = (state.sessionId || 0) + 1;
    var sessionId = state.sessionId;
    state.rendered = new Map();
    state.pagePromises = new Map();
    state.pageUrls = new Map();

    // reset zoom/pan
    state.zoomMode = false;
    state.zoomScale = 1;
    state.panX = 0;
    state.panY = 0;

    // mede primeira página
    setLoading('Preparando páginas…');
    var p1 = await pdf.getPage(1);
    var vp = p1.getViewport({ scale: 1 });

    var sizes = calcBookSize(vp.width, vp.height);

    var fbEl = document.getElementById('vg-flipbook');
    if(!fbEl) throw new Error('Flipbook container não encontrado');

    // guarda tamanhos (usado por gotoPage)
    state.doubleCapable = (sizes.display === 'double');
    state.pageW = sizes.pageW;
    state.pageH = sizes.pageH;
    state.bookW = sizes.bookW;
    state.bookH = sizes.bookH;

    // stage
    var stage = document.getElementById('vg-lib-stage');
    if(stage){
      stage.style.width = Math.round(state.doubleCapable ? sizes.pageW : sizes.bookW) + 'px';
      stage.style.height = Math.round(sizes.bookH) + 'px';
    }

    // A pedido do usuário: render completo.
    // Para o Turn.js ficar estável, criamos TODAS as páginas no DOM antes do .turn().
    var frag = document.createDocumentFragment();
    for(var pi=1; pi<=pdf.numPages; pi++){
      frag.appendChild(makePageEl(pi));
    }
    fbEl.appendChild(frag);

    // inicia sempre em SINGLE (capa central)
    fbEl.style.width = Math.round(state.doubleCapable ? sizes.pageW : sizes.bookW) + 'px';
    fbEl.style.height = Math.round(sizes.pageH) + 'px';
    var $fb = $(fbEl);

    // guarda referências para o drag layer / zoom
    state.$fb = $fb;
    state.fbEl = fbEl;
    state.sizes = sizes;

    // cornerSize do Turn.js controla onde o drag começa. Se for grande demais, ele “gruda” no canto errado.
// Mantemos um valor moderado e habilitamos drag em qualquer lugar via redirect (abaixo).
var corner = Math.round(Math.max(120, Math.min(220, (sizes.pageW||600) * 0.22)));
state.cornerSize = corner;

    // Turn.js
    $fb.turn({
      width: Math.round(state.doubleCapable ? sizes.pageW : sizes.bookW),
      height: Math.round(sizes.pageH),
      autoCenter: true,
      gradients: true,
      acceleration: true,
      display: 'single',
      corners: 'all',
      cornerSize: corner,
      duration: 650,
      pages: pdf.numPages,
      page: 1,
      when: {
        turning: function(e, page){
          // Abertura do livro (visual) ao sair da capa
          // IMPORTANTE: não bloqueia o turn, para manter a dobra/drag fluida (AnyFlip feel)
          if(state.doubleCapable && $fb.turn('page') === 1 && page > 1){
            var stageEl = document.getElementById('vg-lib-stage');
            stageEl && stageEl.classList.add('vg-opening');
            state._opening = true;
            setTimeout(function(){
              stageEl && stageEl.classList.remove('vg-opening');
              state._opening = false;
            }, 240);
          }

          // render vizinhança caso usuário tente folhear cedo
          queueRenderAround(pdf, fbEl, page, sizes, sessionId);
        },
        turned: function(e, page){
          // modo capa (single) só na página 1; depois abre em double spread
          if(state.doubleCapable){
            applyDisplayForPage($fb, fbEl, sizes, page);
            // Turn.js pode recriar nós ao trocar display/size: reaplica imagens
            try{ queueRenderAround(pdf, fbEl, page, sizes, sessionId); }catch(e){}
          }
          updatePageIndicator(page, pdf.numPages);
        }
      }
    });

    updatePageIndicator(1, pdf.numPages);

    // seleção/drag bloqueados + pan/drag layers
    bindNoSelect();
    bindPanLayer();
    bindAnyDragStart();
    // Drag AnyFlip-like: Turn.js recebe eventos diretamente + redirect para iniciar em qualquer ponto.

    // zoom buttons agora são virtuais
    var ov = document.getElementById('vg-lib-viewer');
    if(ov){
      var zoomIn = ov.querySelector('#vg-lib-zoomin');
      var zoomOut = ov.querySelector('#vg-lib-zoomout');
      if(zoomIn && !zoomIn.__vgBound){
        zoomIn.__vgBound = true;
        zoomIn.addEventListener('click', function(){ setZoomScale((state.zoomScale||1) + 0.12); });
      }
      if(zoomOut && !zoomOut.__vgBound){
        zoomOut.__vgBound = true;
        zoomOut.addEventListener('click', function(){ setZoomScale((state.zoomScale||1) - 0.12); });
      }
    }

    // força página 1
    $fb.turn('page', 1);

    // Render COMPLETO antes de liberar o usuário (evita páginas brancas)
    if(state.fullRender){
      await renderAllPages(pdf, fbEl, sizes, sessionId);
    } else {
      await renderEssentialPages(pdf, fbEl, sizes, sessionId);
      startBackgroundRender(pdf, fbEl, sizes, sessionId);
    }

    hideLoading();

    // garante que o input volte ao normal (zoom off)
    toggleZoomMode(false);
    setZoomScale(1);
  }

  function queueRenderAround(pdf, fbEl, page, sizes, sessionId){
    // renderiza vizinhança sem travar (caso o usuário comece a folhear antes do fim)
    var a = [page-2, page-1, page, page+1, page+2];
    a.forEach(function(p){
      if(p < 1 || p > pdf.numPages) return;
      var el = fbEl.querySelector('.page[data-page="'+p+'"]');
      if(!el) return;
      var canvas = el.querySelector('canvas');
      if(canvas) renderPageToCanvas(pdf, p, canvas, sizes.pageW, sizes.pageH, sessionId).catch(function(){});
    });
  }

  async function renderAllPages(pdf, fbEl, sizes, sessionId){
    // Concurrency pequena (adaptativa) pra não explodir memória
    var total = pdf.numPages;
    var idx = 1;
    var conc = (window.innerWidth < 740) ? 1 : 3;

    function setProg(n){
      setLoading('Renderizando páginas: '+n+' / '+total);
    }

    setProg(0);

    async function worker(){
      while(true){
        if(sessionId !== state.sessionId) return; // nova sessão (zoom/rebuild)
        var cur = idx++;
        if(cur > total) return;

        var el = fbEl.querySelector('.page[data-page="'+cur+'"]');
        if(!el) continue;
        var canvas = el.querySelector('canvas');
        if(!canvas) continue;

        try{
          await renderPageToCanvas(pdf, cur, canvas, sizes.pageW, sizes.pageH, sessionId);
        }catch(e){
          // deixa placeholder de falha na própria página
        }

        // atualiza texto (não spamma demais)
        if(cur % 4 === 0 || cur === total) setProg(cur);
      }
    }

    var runners = [];
    for(var i=0;i<conc;i++) runners.push(worker());
    await Promise.all(runners);
  }



  async function renderEssentialPages(pdf, fbEl, sizes, sessionId){
    // Renderiza rápido a capa e a vizinhança imediata para o usuário já poder folhear.
    var pages = [1, 2, 3, 4];
    var done = 0;
    for(var i=0;i<pages.length;i++){
      var p = pages[i];
      if(p < 1 || p > pdf.numPages) continue;
      var el = fbEl.querySelector('.page[data-page="'+p+'"]');
      if(!el) continue;
      var canvas = el.querySelector('canvas');
      if(!canvas) continue;
      setLoading('Preparando páginas… ('+(++done)+'/'+pages.length+')');
      try{ await renderPageToCanvas(pdf, p, canvas, sizes.pageW, sizes.pageH, sessionId); }catch(e){}
      if(sessionId !== state.sessionId) return;
    }
  }

  function startBackgroundRender(pdf, fbEl, sizes, sessionId){
    if(!pdf || !fbEl) return;
    if(state.__bgRenderSid === sessionId) return;
    state.__bgRenderSid = sessionId;

    var total = pdf.numPages;
    var idx = 1;
    var conc = 2;

    // mantém o “sub” útil: páginas + progresso
    var sub = document.getElementById('vg-lib-sub');
    state.__subBase = state.__subBase || (total + ' páginas');

    function setSubProg(n){
      if(!sub) return;
      if(n >= total){
        sub.textContent = state.__subBase;
      }else{
        sub.textContent = state.__subBase + ' • renderizando ' + n + '/' + total;
      }
    }

    setSubProg(0);

    async function worker(){
      while(true){
        if(sessionId !== state.sessionId) return;
        var cur = idx++;
        if(cur > total) return;

        var el = fbEl.querySelector('.page[data-page="'+cur+'"]');
        if(!el) continue;
        var canvas = el.querySelector('canvas');
        if(!canvas) continue;

        try{ await renderPageToCanvas(pdf, cur, canvas, sizes.pageW, sizes.pageH, sessionId); }catch(e){}

        if(cur % 6 === 0 || cur === total) setSubProg(cur);
      }
    }

    // dispara em background (não await)
    var runners = [];
    for(var i=0;i<conc;i++) runners.push(worker());
    Promise.all(runners).then(function(){ setSubProg(total); }).catch(function(){});
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
      state.__subBase = pdf.numPages + ' páginas';

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
