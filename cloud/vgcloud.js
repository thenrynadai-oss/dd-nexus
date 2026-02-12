/* =========================================================
   VASTERIA GATE — VGCloud (Firebase Pro Layer)
   - Auth (Google)
   - Firestore: users / heroes / shares
   - Presence (Google Docs style)
   - Offline persistence (IndexedDB) + fallback graceful
   ========================================================= */
(() => {
  "use strict";

  const CFG = window.FIREBASE_CONFIG;
  const enabled = !!(CFG && CFG.apiKey && CFG.projectId);


  function sanitizeNick(s){
    return String(s||"").trim().toLowerCase().replace(/[^a-z0-9_\-\.]/g,"").slice(0, 22) || "agente";
  }
  function rand4(){ return Math.random().toString(36).slice(2,6); }


  const VGCloud = {
    enabled,
    ready: false,
    user: null,
    db: null,
    auth: null,
    fb: {},
    _authCbs: [],
    onAuth(cb){ this._authCbs.push(cb); if(this.user) cb(this.user); },

    async init(){
      if(!enabled || this.ready) return this.ready;

      const CDN = "https://www.gstatic.com/firebasejs/10.12.5/";
      const appMod  = await import(CDN + "firebase-app.js");
      const authMod = await import(CDN + "firebase-auth.js");
      const fsMod   = await import(CDN + "firebase-firestore.js");
      let stMod = null;
      const { initializeApp } = appMod;
      const { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = authMod;
      // Storage é opcional (pode não existir em projetos Spark / sem bucket)
      let storage = null;
      let fbStorage = null;
      const {
        getFirestore, enableIndexedDbPersistence,
        doc, setDoc, getDoc, updateDoc,
        collection, getDocs, query, where, orderBy, limit,
        onSnapshot, serverTimestamp, addDoc, deleteDoc
      } = fsMod;

      this.fb = { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp, addDoc, deleteDoc };

      const app = initializeApp(CFG);
      this.auth = getAuth(app);
      this.db = getFirestore(app);
      try {
        stMod = await import(CDN + "firebase-storage.js");
        const { getStorage, ref, uploadBytes, getDownloadURL } = stMod;
        storage = getStorage(app);
        fbStorage = { ref, uploadBytes, getDownloadURL };
      } catch (e) {
        console.warn("[VGCloud] Storage desabilitado (sem bucket ou plano). Use URL externa para banners.", e);
      }

      this.storage = storage;
      this.fbStorage = fbStorage;

      try { await enableIndexedDbPersistence(this.db); } catch(e){}

      onAuthStateChanged(this.auth, (u) => {
        this.user = u || null;
        this._authCbs.forEach(fn => { try{ fn(this.user); }catch{} });
      });

      this.signInGoogle = async () => {
        const prov = new GoogleAuthProvider();
        const res = await signInWithPopup(this.auth, prov);
        return res.user;
      };


      this.signInEmail = async (email, pass) => {
        const e = String(email||"").trim().toLowerCase();
        const p = String(pass||"");
        const res = await signInWithEmailAndPassword(this.auth, e, p);
        return res.user;
      };

      this.registerEmail = async (email, pass, { displayName, photoURL, nick } = {}) => {
        const e = String(email||"").trim().toLowerCase();
        const p = String(pass||"");
        const res = await createUserWithEmailAndPassword(this.auth, e, p);
        if(displayName || photoURL){
          try{ await updateProfile(res.user, { displayName: displayName || res.user.displayName || null, photoURL: photoURL || res.user.photoURL || null }); }catch(e){}
        }
        // cria/garante perfil no Firestore + índice de nick
        await this.ensureUserProfile({ nick, displayName, photoURL });
        return res.user;
      };

      this.resolveNickToEmail = async (nick) => {
        const { doc, getDoc } = this.fb;
        const key = sanitizeNick(nick);
        const snap = await getDoc(doc(this.db, "nicks", key));
        if(!snap.exists()) return null;
        return snap.data();
      };

      this.signInNickOrEmail = async (identifier, pass) => {
        const id = String(identifier||"").trim();
        if(id.includes("@")) return this.signInEmail(id, pass);
        let map = null;
        try{ map = await this.resolveNickToEmail(id); }
        catch(err){
          const msg = String(err && (err.code || err.message) || err);
          if(msg.includes("permission") || msg.includes("PERMISSION_DENIED")) throw new Error("NICK_RULES_BLOCKED");
          throw err;
        }
        if(!map || !map.email) throw new Error("APELIDO_NAO_ENCONTRADO");
        return this.signInEmail(map.email, pass);
      };

      this.getMyProfile = async () => {
        if(!this.user) return null;
        const { doc, getDoc } = this.fb;
        const snap = await getDoc(doc(this.db, "users", this.user.uid));
        return snap.exists() ? snap.data() : null;
      };

      this.ensureUserProfile = async ({ nick, displayName, photoURL, miniProfile } = {}) => {
        if(!this.user) return null;
        const { doc, setDoc, getDoc, serverTimestamp } = this.fb;

        const uid = this.user.uid;
        const email = (this.user.email || "").toLowerCase() || null;
        const name = displayName || this.user.displayName || "AGENTE";
        const baseNick = nick || (email ? email.split("@")[0] : name);
        let safeNick = sanitizeNick(baseNick);

        // resolve colisão global
        const nickRef = doc(this.db, "nicks", safeNick);
        const nickSnap = await getDoc(nickRef);
        if(nickSnap.exists() && nickSnap.data()?.uid && nickSnap.data().uid !== uid){
          for(let i=0;i<20;i++){
            const t = sanitizeNick(baseNick + "_" + rand4());
            const tRef = doc(this.db, "nicks", t);
            const tSnap = await getDoc(tRef);
            if(!tSnap.exists() || tSnap.data()?.uid === uid){ safeNick = t; break; }
          }
        }

        const userPayload = {
          uid,
          displayName: name,
          nick: safeNick,
          email,
          photoURL: photoURL || this.user.photoURL || null,
          updatedAt: serverTimestamp(),
        };

        const miniPayload = {};
        if(miniProfile && typeof miniProfile === "object"){
          const mp = {};
          if(typeof miniProfile.bannerURL === "string" && miniProfile.bannerURL.trim()){
            mp.bannerURL = miniProfile.bannerURL.trim();
          }
          if(miniProfile.favorite && typeof miniProfile.favorite === "object"){
            const fv = {};
            if(typeof miniProfile.favorite.name === "string" && miniProfile.favorite.name.trim()) fv.name = miniProfile.favorite.name.trim();
            if(typeof miniProfile.favorite.img === "string" && miniProfile.favorite.img.trim()) fv.img = miniProfile.favorite.img.trim();
            if(Object.keys(fv).length) mp.favorite = fv;
          }
          if(Number.isFinite(miniProfile.favIndex)) mp.favIndex = miniProfile.favIndex;
          if(Object.keys(mp).length) miniPayload.miniProfile = mp;
        }

        // user doc
        await setDoc(doc(this.db,"users",uid), { ...userPayload, ...miniPayload, createdAt: serverTimestamp() }, { merge:true });
        // nick index
        await setDoc(doc(this.db,"nicks",safeNick), { uid, email, nick: safeNick, updatedAt: serverTimestamp() }, { merge:true });

        return userPayload;
      };


      this.signOut = async () => signOut(this.auth);

      this.ready = true;
      return true;
    },

    // ---------- USERS ----------
    async upsertMyProfile(localUser){
      if(!this.user) return;
      // garante user doc + nick index (global)
      await this.ensureUserProfile({
        nick: localUser?.nick,
        displayName: localUser?.name,
        photoURL: localUser?.profileImg,
        miniProfile: localUser?.miniProfile,
      });
    },


    async uploadUserBanner(file){
      if(!this.user) throw new Error("NOT_AUTH");
      if(!this.storage || !this.fbStorage) throw new Error("NO_STORAGE_BUCKET");
      const { ref, uploadBytes, getDownloadURL } = this.fbStorage;

      const f = file;
      const ext = (String(f?.name||"banner").split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,6);
      const name = Date.now() + "_" + Math.random().toString(36).slice(2,8) + "." + (ext || "png");
      const path = `users/${this.user.uid}/mini_profile/${name}`;
      const r = ref(this.storage, path);

      const meta = {};
      if(f && f.type) meta.contentType = f.type;

      const snap = await uploadBytes(r, f, meta);
      return await getDownloadURL(snap.ref);
    },

    async listUsers(){
      if(!this.user) return [];
      const { collection, getDocs } = this.fb;
      const snap = await getDocs(collection(this.db, "users"));
      return snap.docs.map(d => {
        const v = d.data() || {};
        return {
          uid: v.uid,
          displayName: v.displayName || null,
          nick: v.nick || null,
          photoURL: v.photoURL || null,
          miniProfile: v.miniProfile || null,
        };
      });
    },

    // ---------- HEROES (GLOBAL) ----------
    heroRef(heroId){
      const { doc } = this.fb;
      return doc(this.db, "heroes", heroId);
    },

    async myHeroes(){
      if(!this.user) return [];
      const { collection, query, where, getDocs } = this.fb;
      try{
        const q = query(
          collection(this.db, "heroes"),
          where("ownerUid","==", this.user.uid)
        );
        const snap = await getDocs(q);
        const arr = snap.docs.map(d => d.data());
        // sort client-side (evita index composto)
        arr.sort((a,b)=>(b?.clientUpdatedAt||0)-(a?.clientUpdatedAt||0));
        return arr;
      }catch(err){
        console.warn("[VGCloud] myHeroes() failed", err);
        return [];
      }
    },

    async publicHeroes(){
      if(!this.user) return [];
      const { collection, query, where, getDocs } = this.fb;
      try{
        const q = query(
          collection(this.db, "heroes"),
          where("visibility","==","public")
        );
        const snap = await getDocs(q);
        const arr = snap.docs.map(d => d.data());
        arr.sort((a,b)=>(b?.clientUpdatedAt||0)-(a?.clientUpdatedAt||0));
        return arr;
      }catch(err){
        console.warn("[VGCloud] publicHeroes() failed", err);
        return [];
      }
    },

    async upsertHero(hero){
      if(!this.user) return;
      const { setDoc, serverTimestamp } = this.fb;

      const heroId = hero.id || hero.heroId;
      if(!heroId) throw new Error("Hero sem id");

      const payload = {
        ...hero,
        id: heroId,
        heroId,
        ownerUid: this.user.uid,
        ownerName: this.user.displayName || hero.ownerName || "AGENTE",
        ownerPhotoURL: this.user.photoURL || hero.ownerPhotoURL || null,
        visibility: hero.visibility || "private",
        allowPublicEdit: (hero.visibility === "public") ? !!hero.allowPublicEdit : false,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await setDoc(this.heroRef(heroId), payload, { merge:true });
    },

    watchHero(heroId, cb){
      const { onSnapshot } = this.fb;
      return onSnapshot(this.heroRef(heroId), (snap) => {
        if(!snap.exists()) return;
        cb(snap.data());
      });
    },

    async patchHero(heroId, patch){
      const { updateDoc, serverTimestamp } = this.fb;
      await updateDoc(this.heroRef(heroId), {
        ...patch,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp()
      });
    },

    // ---------- SHARE DOCS ----------
    shareRef(token){
      const { doc } = this.fb;
      return doc(this.db, "shares", token);
    },

    async createShareRoom(heroSnapshot, mode="read"){
      if(!this.user) throw new Error("Sem auth");
      const token = "sh_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

      const { setDoc, serverTimestamp } = this.fb;

      const payload = {
        token,
        mode, // "read" | "edit"
        ownerUid: this.user.uid,
        ownerName: this.user.displayName || "AGENTE",
        ownerPhotoURL: this.user.photoURL || null,
        title: (heroSnapshot?.nome || heroSnapshot?.dados?.["c-name"] || "Ficha"),
        data: heroSnapshot,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await setDoc(this.shareRef(token), payload, { merge:true });
      return token;
    },

    watchShare(token, cb){
      const { onSnapshot } = this.fb;
      return onSnapshot(this.shareRef(token), (snap) => {
        if(!snap.exists()) return;
        cb(snap.data());
      });
    },

    async patchShare(token, patch){
      const { updateDoc, serverTimestamp } = this.fb;
      await updateDoc(this.shareRef(token), {
        ...patch,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp()
      });
    },

    async addToMyShared(token){
      if(!this.user) throw new Error("Sem auth");
      const { doc, setDoc, serverTimestamp } = this.fb;
      await setDoc(doc(this.db, "users", this.user.uid, "shared", token), {
        token,
        addedAt: serverTimestamp()
      }, { merge:true });
    },

    async listMyShared(){
      if(!this.user) return [];
      const { collection, getDocs } = this.fb;
      const snap = await getDocs(collection(this.db, "users", this.user.uid, "shared"));
      return snap.docs.map(d => {
        const v = d.data() || {};
        return {
          uid: v.uid,
          displayName: v.displayName || null,
          nick: v.nick || null,
          photoURL: v.photoURL || null,
          miniProfile: v.miniProfile || null,
        };
      });
    },

    // ---------- PRESENCE ----------
    async joinPresence(kind, id, profile){
      if(!this.user) return () => {};
      const { doc, setDoc, serverTimestamp, onSnapshot, collection } = this.fb;

      const base = kind === "share" ? this.shareRef(id) : this.heroRef(id);
      const presenceCol = collection(base, "presence");
      const meRef = doc(presenceCol, this.user.uid);

      const basePayload = {
        uid: this.user.uid,
        name: profile?.name || this.user.displayName || "AGENTE",
        photoURL: profile?.photoURL || this.user.photoURL || null,
      };

      let alive = true;
      const tick = async () => {
        if(!alive) return;
        try{
          await setDoc(meRef, { ...basePayload, lastSeenAt: serverTimestamp(), lastSeenMs: Date.now() }, { merge:true });
        }catch(e){}
        setTimeout(tick, 15000);
      };
      tick();

      const unsub = onSnapshot(presenceCol, (snap) => {
        const arr = snap.docs.map(d => d.data());
        window.dispatchEvent(new CustomEvent("vg_presence_update", { detail:{ kind, id, users: arr }}));
      });

      return () => { alive=false; try{ unsub(); }catch{} };
    }
  };

  window.VGCloud = VGCloud;
})();