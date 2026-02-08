/* =========================================================
   VASTERIA GATE — INDEX (LOGIN/CADASTRO + QUICKLOAD)
   Depende de: auth.js, themes.js, bg.js
   ========================================================= */

(() => {
  "use strict";

  // Theme + background
  window.addEventListener("load", () => {
    // Aplica tema salvo, se existir
    if(window.Theme && Theme.applySavedTheme) Theme.applySavedTheme();
    if(window.BG && BG.mount) BG.mount();

    // Se já estiver logado, pula para o hub
    const u = window.Auth?.getCurrentUser?.();
    if(u) window.location.href = "home.html";
  });

  // Elements
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const msgBox = document.getElementById("msg");

  const loginId = document.getElementById("login-id");
  const loginPass = document.getElementById("login-pass");
  const btnLogin = document.getElementById("btn-login");

  const regName = document.getElementById("reg-name");
  const regNick = document.getElementById("reg-nick");
  const regContact = document.getElementById("reg-contact");
  const regPass = document.getElementById("reg-pass");
  const regPhotoInput = document.getElementById("reg-photo");
  const regPhotoBtn = document.getElementById("reg-photo-btn");
  const regPhotoPreview = document.getElementById("reg-photo-preview");
  const btnRegister = document.getElementById("btn-register");

  const quickList = document.getElementById("quick-list");
  const btnClearQuick = document.getElementById("btn-clear-quick");

  let tempImg = null;

  function showMsg(text, type="info"){
    msgBox.style.display = "block";
    msgBox.textContent = text;
    msgBox.style.borderColor = type === "err" ? "rgba(255,80,80,0.55)" : "rgba(0,170,255,0.55)";
    msgBox.style.boxShadow = type === "err" ? "0 0 18px rgba(255,80,80,0.15)" : "0 0 18px rgba(0,170,255,0.15)";
  }
  function clearMsg(){ msgBox.style.display = "none"; msgBox.textContent=""; }

  function setMode(mode){
    clearMsg();
    if(mode === "register"){
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      registerForm.style.display = "block";
      loginForm.style.display = "none";
    } else {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      loginForm.style.display = "block";
      registerForm.style.display = "none";
    }
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  // Upload foto (Cadastro)
  regPhotoBtn.addEventListener("click", () => regPhotoInput.click());
  regPhotoInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      tempImg = ev.target.result;
      regPhotoPreview.style.backgroundImage = `url(${tempImg})`;
      regPhotoPreview.innerHTML = "";
    };
    reader.readAsDataURL(file);
  });

  // Cadastro
  async function doRegister(){
    clearMsg();

    const payload = {
      nome: regName.value,
      apelido: regNick.value,
      contato: regContact.value,
      pass: regPass.value,
      imgBase64: tempImg,
    };

    const res = window.Auth.register(payload);
    if(!res.ok){
      showMsg(res.msg || "Falha no cadastro.", "err");
      return;
    }

    showMsg("Conta criada! Indo para o HUB…");
    setTimeout(() => window.location.href = "home.html", 350);
  }

  // Login
  async function doLogin(){
    clearMsg();

    const payload = {
      identifier: loginId.value,
      pass: loginPass.value
    };
    const res = window.Auth.login(payload);
    if(!res.ok){
      showMsg(res.msg || "Falha no login.", "err");
      return;
    }

    showMsg("Conectado! Indo para o HUB…");
    setTimeout(() => window.location.href = "home.html", 250);
  }

  btnRegister.addEventListener("click", doRegister);
  btnLogin.addEventListener("click", doLogin);

  // Enter submits
  document.addEventListener("keydown", (e) => {
    if(e.key !== "Enter") return;
    if(registerForm.style.display !== "none"){
      doRegister();
    } else {
      doLogin();
    }
  });

  // Quickload
  function initialsFromNick(nick){
    const s = (nick||"").trim();
    if(!s) return "?";
    return s.slice(0,2).toUpperCase();
  }

  function renderQuickload(){
    const list = window.Auth.quickload.listUsers();
    quickList.innerHTML = "";

    if(!list.length){
      quickList.innerHTML = `<div class="empty-quick">Nenhuma conta salva ainda.<br/>Cadastre uma conta para aparecer aqui.</div>`;
      return;
    }

    list.forEach(u => {
      const contact = u.email || u.phone || "";
      const item = document.createElement("div");
      item.className = "quick-item";
      item.dataset.uid = u.uid;

      const avatar = document.createElement("div");
      avatar.className = "quick-avatar";
      if(u.profileImg){
        avatar.style.backgroundImage = `url(${u.profileImg})`;
        avatar.textContent = "";
      }else{
        avatar.textContent = initialsFromNick(u.apelido);
      }

      const meta = document.createElement("div");
      meta.className = "quick-meta";
      meta.innerHTML = `<strong>${(u.apelido||"").toUpperCase()}</strong><span>${contact || "—"}</span>`;

      const trash = document.createElement("button");
      trash.className = "quick-trash";
      trash.type = "button";
      trash.title = "Remover do Quickload";
      trash.textContent = "🗑️";

      trash.addEventListener("click", (ev) => {
        ev.stopPropagation();
        window.Auth.quickload.remove(u.uid);
        renderQuickload();
      });

      item.addEventListener("click", () => {
        setMode("login");
        loginId.value = u.apelido || u.email || u.phone || "";
        loginPass.focus();
        // som de feedback se existir
        if(window.SFX && SFX.tick) SFX.tick();
      });

      item.appendChild(avatar);
      item.appendChild(meta);
      item.appendChild(trash);
      quickList.appendChild(item);
    });
  }

  btnClearQuick.addEventListener("click", () => {
    window.Auth.quickload.clear();
    renderQuickload();
  });

  // Render inicial
  renderQuickload();
})();
