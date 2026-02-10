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

  let tempCharImg = null;
  let tempProfileImg = null;

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
    btnLogout.addEventListener("click", () => {
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
    charFile.addEventListener("change", () => {
      const file = charFile.files && charFile.files[0];
      if(!file) return;
      const r = new FileReader();
      r.onload = (ev) => {
        tempCharImg = ev.target.result;
        charPreview.style.backgroundImage = `url(${tempCharImg})`;
        charPreview.innerHTML = "";
      };
      r.readAsDataURL(file);
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

      openModal(modalProfile);
    });

    btnCloseProfile.addEventListener("click", () => closeModal(modalProfile));
    btnProfileCancel.addEventListener("click", () => closeModal(modalProfile));
    modalProfile.addEventListener("click", (e) => { if(e.target === modalProfile) closeModal(modalProfile); });

    profilePhotoBtn.addEventListener("click", () => profileFile.click());
    profileFile.addEventListener("change", () => {
      const file = profileFile.files && profileFile.files[0];
      if(!file) return;
      const r = new FileReader();
      r.onload = (ev) => {
        tempProfileImg = ev.target.result;
        profilePreview.style.backgroundImage = `url(${tempProfileImg})`;
        profilePreview.innerHTML = "";
      };
      r.readAsDataURL(file);
    });

    btnProfileSave.addEventListener("click", () => {
      const patch = {
        nome: profileName.value.trim(),
        apelido: profileNick.value.trim(),
        profileImg: tempProfileImg
      };
      const res = Auth.updateCurrentUser(patch);
      if(!res.ok){
        alert(res.msg || "Não foi possível salvar.");
        return;
      }
      closeModal(modalProfile);
      renderHeader();
      renderHeroes();
    });
  }

})();
