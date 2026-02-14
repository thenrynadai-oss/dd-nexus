/* =========================================================
   VASTERIA GATE — HUB
   Depende de: auth.js, themes.js, bg.js
   ========================================================= */

(() => {
  "use strict";

  // Require session
  window.addEventListener("load", () => {
    if(!window.Auth.requireSession({ redirectTo:"index.html" })) return;
    if(window.Theme && Theme.applySavedTheme) Theme.applySavedTheme();
    if(window.BG && BG.mount) BG.mount();

    boot();
  });

  const elUserImg = document.getElementById("current-user-img");
  const elUserNick = document.getElementById("current-user-nick");
  const elUserName = document.getElementById("current-user-name");
  const heroList = document.getElementById("hero-list");

  const btnLogout = document.getElementById("btn-logout");
  const btnCreateHero = document.getElementById("btn-create-hero");
  const btnEditProfile = document.getElementById("btn-edit-profile");

  // Create modal
  const modalCreate = document.getElementById("modal-create");
  const btnCloseCreate = document.getElementById("btn-close-create");
  const btnCreateCancel = document.getElementById("btn-create-cancel");
  const btnCreateConfirm = document.getElementById("btn-create-confirm");
  const newName = document.getElementById("new-name");
  const newPlayer = document.getElementById("new-player");
  const newCampaign = document.getElementById("new-campaign");
  const charFile = document.getElementById("char-file");
  const charPhotoBtn = document.getElementById("char-photo-btn");
  const charPreview = document.getElementById("char-preview");

  // Profile modal
  const modalProfile = document.getElementById("modal-profile");
  const btnCloseProfile = document.getElementById("btn-close-profile");
  const btnProfileCancel = document.getElementById("btn-profile-cancel");
  const btnProfileSave = document.getElementById("btn-profile-save");
  const profileName = document.getElementById("profile-name");
  const profileNick = document.getElementById("profile-nick");
  const profileFile = document.getElementById("profile-file");
  const profilePhotoBtn = document.getElementById("profile-photo-btn");
  const profilePreview = document.getElementById("profile-preview");

  // Mini Perfil (ONLINE → Amigos)
  const miniBannerPreview = document.getElementById("mini-banner-preview");
  const btnMiniBanner = document.getElementById("btn-mini-banner");
  const miniBannerFile = document.getElementById("mini-banner-file");
  const miniBannerUrl = document.getElementById("mini-banner-url");
  const miniFavHero = document.getElementById("mini-fav-hero");

  let tempCharImg = null;
  let tempProfileImg = null;
  let tempMiniBannerUrl = "";
  let tempMiniBannerData = null; // base64 pequeno (Firestore-only)
  let tempMiniBannerFile = null;

  function initials(s){
    const t = (s||"").trim();
    if(!t) return "VG";
    return t.slice(0,2).toUpperCase();
  }

  function setAvatar(div, img, fallbackText){
    if(img){
      div.style.backgroundImage = `url(${img})`;
      div.textContent = "";
    } else {
      div.style.backgroundImage = "";
      div.textContent = fallbackText;
    }
  }

  
  // =========================================================
  // Image helpers (evita banners/fotos gigantes travarem o site)
  // - converte arquivos em dataURL pequeno (canvas + compress)
  // =========================================================
  function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function compressDataURL(dataUrl, {
    targetW = 256,
    targetH = 256,
    mode = "cover",          // cover (corta) | contain (sem cortar)
    mime = "image/webp",
    quality = 0.82,
    minQuality = 0.45,
    maxChars = 90000,        // limite do base64 (string)
    maxIters = 8,
  } = {}){
    const src = String(dataUrl || "");
    if(!src.startsWith("data:")) return src;

    let img;
    try { img = await loadImage(src); }
    catch { return src; }

    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;

    // área de recorte (cover) ou encaixe (contain)
    let sx=0, sy=0, sw=iw, sh=ih;

    if(mode === "cover"){
      const srcAR = iw / ih;
      const dstAR = targetW / targetH;
      if(srcAR > dstAR){
        // imagem mais larga: corta laterais
        sh = ih;
        sw = Math.round(ih * dstAR);
        sx = Math.round((iw - sw) / 2);
        sy = 0;
      }else{
        // imagem mais alta: corta topo/baixo
        sw = iw;
        sh = Math.round(iw / dstAR);
        sx = 0;
        sy = Math.round((ih - sh) / 2);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: true });

    ctx.clearRect(0,0,targetW,targetH);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

    let q = quality;
    let out = "";
    for(let i=0;i<maxIters;i++){
      try{
        out = canvas.toDataURL(mime, q);
      }catch{
        out = canvas.toDataURL("image/jpeg", q);
      }
      if(out.length <= maxChars || q <= minQuality) break;
      q -= 0.07;
    }
    return out || src;
  }

  async function compressImageFile(file, opts){
    const f = file;
    if(!f) return null;
    // evita travar com arquivos absurdos
    if(f.size && f.size > 12 * 1024 * 1024){
      alert("Essa imagem é grande demais. Use uma menor (até ~12MB).");
      return null;
    }
    const data = await readFileAsDataURL(f);
    return await compressDataURL(data, opts);
  }


function boot(){
    renderHeader();
    renderHeroes();
    bindEvents();
  }

  function renderHeader(){
    const u = Auth.getCurrentUser();
    if(!u) return;

    elUserNick.textContent = (u.apelido || "AGENTE").toUpperCase();
    elUserName.textContent = u.nome || "—";

    setAvatar(elUserImg, u.profileImg, initials(u.apelido));
  }

  function heroLevel(hero){
    const v = hero?.dados?.["c-level"];
    const n = parseInt(v, 10);
    if(Number.isFinite(n)) return n;
    return v || 1;
  }

  function setMiniBanner(src){
    if(!miniBannerPreview) return;
    const url = String(src || "").trim();
    if(url){
      miniBannerPreview.classList.add("has-img");
      miniBannerPreview.style.backgroundImage = `url(${url})`;
      miniBannerPreview.innerHTML = "<span></span>";
    }else{
      miniBannerPreview.classList.remove("has-img");
      miniBannerPreview.style.backgroundImage = "";
      miniBannerPreview.innerHTML = "<span>+ BANNER</span>";
    }
  }

  function populateFavHeroSelect(){
    if(!miniFavHero) return;
    const u = Auth.getCurrentUser();
    const heroes = u?.heroes || [];
    // preserve first option
    const keep = miniFavHero.querySelector("option[value='']")?.outerHTML || '<option value="">— Nenhum —</option>';
    miniFavHero.innerHTML = keep;
    heroes.forEach((h, idx) => {
      const nm = (h.nome || h.dados?.["c-name"] || "SEM NOME").toString();
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = nm;
      miniFavHero.appendChild(opt);
    });
  }

  function heroCampaign(hero){
    return hero?.campaign || hero?.dados?.["c-campaign"] || "—";
  }

  function renderHeroes(){
    const u = Auth.getCurrentUser();
    const heroes = u?.heroes || [];
    heroList.innerHTML = "";

    if(!heroes.length){
      heroList.innerHTML = `
        <div class="panel-skin" style="padding:18px;border-radius:22px;text-align:center;color:rgba(255,255,255,0.75);">
          Você ainda não tem personagens.<br/>Clique em <b>+ PERSONAGEM</b> para criar o primeiro.
        </div>
      `;
      return;
    }

    heroes.forEach((h, idx) => {
      const card = document.createElement("div");
      card.className = "hero-card";

      const img = document.createElement("div");
      img.className = "hero-img";
      if(h.img) img.style.backgroundImage = `url(${h.img})`;
      else img.style.backgroundImage = "linear-gradient(135deg, rgba(0,170,255,0.25), rgba(0,0,0,0.15))";

      const body = document.createElement("div");
      body.className = "hero-body";

      const top = document.createElement("div");
      top.className = "hero-title-row";

      const titleWrap = document.createElement("div");
      titleWrap.className = "hero-title";
      const nm = (h.nome || h.dados?.["c-name"] || "SEM NOME").toString();
      titleWrap.innerHTML = `<h4>${nm}</h4><p>${heroCampaign(h)} • Nível ${heroLevel(h)}</p>`;

      const actions = document.createElement("div");
      actions.className = "hero-actions";

      const openBtn = document.createElement("button");
      openBtn.textContent = "ABRIR";
      openBtn.addEventListener("click", () => {
        Auth.setCurrentHeroIndex(idx);
        window.location.href = "ficha.html";
      });

      const delBtn = document.createElement("button");
      delBtn.textContent = "REMOVER";
      delBtn.classList.add("danger");
      delBtn.addEventListener("click", () => {
        if(!confirm(`Remover o personagem "${nm}"?`)) return;
        Auth.deleteHero(idx);
        renderHeroes();
      });

      actions.appendChild(openBtn);
      actions.appendChild(delBtn);

      top.appendChild(titleWrap);
      top.appendChild(actions);

      const meta = document.createElement("div");
      meta.className = "hero-meta-row";
      const p1 = document.createElement("div");
      p1.className = "hero-pill";
      p1.textContent = `Jogador: ${h.player || h.dados?.["c-player"] || "—"}`;
      const p2 = document.createElement("div");
      p2.className = "hero-pill";
      p2.textContent = `Campanha: ${heroCampaign(h)}`;
      meta.appendChild(p1);
      meta.appendChild(p2);

      body.appendChild(top);
      body.appendChild(meta);

      card.appendChild(img);
      card.appendChild(body);

      heroList.appendChild(card);
    });
  }

  // -----------------------------
  // Modals
  // -----------------------------
  function openModal(modal){
    modal.style.display = "flex";
  }
  function closeModal(modal){
    modal.style.display = "none";
  }

  function resetCreateModal(){
    tempCharImg = null;
    charPreview.style.backgroundImage = "";
    charPreview.innerHTML = "<span>+ FOTO</span>";
    newName.value = "";
    newPlayer.value = "";
    newCampaign.value = "";
    charFile.value = "";
  }

  // -----------------------------
  // Events
  // -----------------------------
  function bindEvents(){
    btnLogout.addEventListener("click", async () => {
      try{ if(window.VGCloud && VGCloud.enabled) await VGCloud.signOut(); }catch(e){}
      Auth.logout();
      window.location.href = "index.html";
    });

    // Create hero modal
    btnCreateHero.addEventListener("click", () => {
      resetCreateModal();
      openModal(modalCreate);
      newName.focus();
    });
    btnCloseCreate.addEventListener("click", () => closeModal(modalCreate));
    btnCreateCancel.addEventListener("click", () => closeModal(modalCreate));
    modalCreate.addEventListener("click", (e) => { if(e.target === modalCreate) closeModal(modalCreate); });

    charPhotoBtn.addEventListener("click", () => charFile.click());
    charFile.addEventListener("change", async () => {
      const file = charFile.files && charFile.files[0];
      if(!file) return;

      // reduz para não travar (quadrado)
      const small = await compressImageFile(file, { targetW: 640, targetH: 640, maxChars: 140000, quality: 0.84 });
      if(!small) return;

      tempCharImg = small;
      charPreview.style.backgroundImage = `url(${tempCharImg})`;
      charPreview.innerHTML = "";
    });
btnCreateConfirm.addEventListener("click", () => {
      const nm = newName.value.trim() || "Novo Herói";
      const pl = newPlayer.value.trim();
      const cp = newCampaign.value.trim();

      const hero = Auth.createDefaultHero(nm);
      hero.nome = nm;
      hero.player = pl;
      hero.campaign = cp;
      hero.img = tempCharImg;

      hero.dados["c-name"] = nm;
      hero.dados["c-player"] = pl;
      hero.dados["c-campaign"] = cp;

      Auth.addHero(hero);
      closeModal(modalCreate);
      renderHeroes();
    });

    // Profile modal
    btnEditProfile.addEventListener("click", () => {
      const u = Auth.getCurrentUser();
      if(!u) return;

      tempProfileImg = u.profileImg || null;
      profileName.value = u.nome || "";
      profileNick.value = u.apelido || "";

      if(tempProfileImg){
        profilePreview.style.backgroundImage = `url(${tempProfileImg})`;
        profilePreview.innerHTML = "";
      } else {
        profilePreview.style.backgroundImage = "";
        profilePreview.innerHTML = "<span>+ FOTO</span>";
      }


      // Mini perfil (ONLINE → Amigos)
      tempMiniBannerFile = null;
      const mini = u.miniProfile || {};
      tempMiniBannerUrl = (mini.bannerURL || "").trim();
      tempMiniBannerData = (typeof mini.bannerData === "string" && mini.bannerData.startsWith("data:")) ? mini.bannerData : null;

      if(miniBannerUrl) miniBannerUrl.value = tempMiniBannerUrl || "";
      setMiniBanner(tempMiniBannerUrl || tempMiniBannerData || "");
      populateFavHeroSelect();
      if(miniFavHero){
        // tenta selecionar por índice salvo, senão por nome
        if(typeof mini.favIndex === "number") miniFavHero.value = String(mini.favIndex);
        else if(mini.favorite && mini.favorite.name){
          const opts = Array.from(miniFavHero.options);
          const found = opts.find(o => o.textContent === mini.favorite.name);
          if(found) miniFavHero.value = found.value;
        }
      }

      openModal(modalProfile);
    });

    btnCloseProfile.addEventListener("click", () => closeModal(modalProfile));
    btnProfileCancel.addEventListener("click", () => closeModal(modalProfile));
    modalProfile.addEventListener("click", (e) => { if(e.target === modalProfile) closeModal(modalProfile); });

    profilePhotoBtn.addEventListener("click", () => profileFile.click());

    if(btnMiniBanner && miniBannerFile){
      btnMiniBanner.addEventListener("click", () => miniBannerFile.click());
    }
    if(miniBannerFile){
      miniBannerFile.addEventListener("change", async () => {
        const f = miniBannerFile.files && miniBannerFile.files[0];
        if(!f) return;

        // GIF via upload vira só 1 frame (canvas) e tende a ficar pesado — use URL para GIF
        if(String(f.type||"").toLowerCase() === "image/gif"){
          alert("Para GIF, use a opção de URL do banner (upload de GIF não é recomendado).");
          miniBannerFile.value = "";
          return;
        }

        tempMiniBannerFile = f;

        // comprime para banner retangular (Firestore-only)
        const small = await compressImageFile(f, { targetW: 980, targetH: 240, maxChars: 90000, quality: 0.82 });
        if(!small) return;

        tempMiniBannerData = small;
        tempMiniBannerUrl = "";
        if(miniBannerUrl) miniBannerUrl.value = "";

        setMiniBanner(tempMiniBannerData);
      });
}
    if(miniBannerUrl){
      let tmr = null;
      miniBannerUrl.addEventListener("input", () => {
        clearTimeout(tmr);
        tmr = setTimeout(() => {
          tempMiniBannerFile = null;
          tempMiniBannerData = null; // URL vence o base64
          tempMiniBannerUrl = miniBannerUrl.value.trim();
          setMiniBanner(tempMiniBannerUrl);
        }, 120);
      });
}

    profileFile.addEventListener("change", async () => {
      const file = profileFile.files && profileFile.files[0];
      if(!file) return;

      const small = await compressImageFile(file, { targetW: 256, targetH: 256, maxChars: 90000, quality: 0.82 });
      if(!small) return;

      tempProfileImg = small;
      profilePreview.style.backgroundImage = `url(${tempProfileImg})`;
      profilePreview.innerHTML = "";
    });
btnProfileSave.addEventListener("click", async () => {
      const btn = btnProfileSave;
      const oldTxt = btn.textContent;
      btn.disabled = true;
      btn.textContent = "SALVANDO...";
      try{
        const cur = Auth.getCurrentUser();
        if(!cur){ alert("Sem sessão."); return; }

        // favorito
        let fav = null;
        let favIndex = null;
        if(miniFavHero && miniFavHero.value !== ""){
          const idx = parseInt(miniFavHero.value, 10);
          if(Number.isFinite(idx) && cur.heroes && cur.heroes[idx]){
            favIndex = idx;
            const h = cur.heroes[idx];
            const nm = (h.nome || h.dados?.["c-name"] || "SEM NOME").toString();
            fav = { name: nm, img: h.img || null };
          }
        }

        const bannerURL = (tempMiniBannerUrl || "").trim();
        let bannerData = tempMiniBannerData;

        // Se tiver URL, ela vence (evita base64 pesado)
        if(bannerURL) bannerData = null;

        // safety: se algo escapou do compress e ficou gigante, bloqueia
        if(bannerData && String(bannerData).length > 140000){
          alert("Banner muito pesado. Use uma imagem menor ou cole um link (URL).");
          bannerData = null;
        }

        const miniLocal = { bannerURL, bannerData, favorite: fav, favIndex };
        const patch = {
          nome: profileName.value.trim(),
          apelido: profileNick.value.trim(),
          profileImg: tempProfileImg,
          miniProfile: miniLocal
        };

        const res = Auth.updateCurrentUser(patch);
        if(!res.ok){
          alert(res.msg || "Não foi possível salvar.");
          return;
        }

        // Sync cloud (se logado)
        if(window.VGCloud && VGCloud.enabled && VGCloud.user){
          const miniCloud = { bannerURL, bannerData, favorite: fav, favIndex };
          await VGCloud.upsertMyProfile({
            name: patch.nome,
            nick: patch.apelido,
            profileImg: patch.profileImg,
            miniProfile: miniCloud
          });
        }

        closeModal(modalProfile);
        renderHeader();
        renderHeroes();
      } finally {
        btn.disabled = false;
        btn.textContent = oldTxt;
      }
    });
  }

})();
