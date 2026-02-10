
/* VASTERIA GATE - Firebase Professional Layer
   Auth + Firestore + Offline cache
   Safe fallback when Firebase is not configured
*/
(function () {
  const cfg = window.FIREBASE_CONFIG;
  const enabled = !!(cfg && cfg.apiKey && cfg.projectId);

  const API = {
    enabled,
    user: null,
    init: async () => {},
    onAuth: cb => API._cbs.push(cb),
    loginGoogle: async () => { throw "Firebase disabled"; },
    loginEmail: async () => { throw "Firebase disabled"; },
    registerEmail: async () => { throw "Firebase disabled"; },
    logout: async () => {},
    heroes: {
      list: async () => [],
      save: async () => {},
      remove: async () => {}
    },
    _cbs: []
  };

  window.FirebaseGate = API;
  if (!enabled) return;

  const CDN = "https://www.gstatic.com/firebasejs/10.12.5/";

  async function load(p){ return import(CDN + p); }

  API.init = async () => {
    const { initializeApp } = await load("firebase-app.js");
    const { getAuth, GoogleAuthProvider, signInWithPopup,
            signInWithEmailAndPassword, createUserWithEmailAndPassword,
            onAuthStateChanged, signOut } = await load("firebase-auth.js");
    const { getFirestore, doc, setDoc, getDocs, collection,
            deleteDoc, serverTimestamp } = await load("firebase-firestore.js");

    const app = initializeApp(cfg);
    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, u => {
      API.user = u || null;
      API._cbs.forEach(fn => fn(API.user));
    });

    API.loginGoogle = async () => {
      const prov = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, prov);
      return res.user;
    };

    API.loginEmail = async (e,p) => {
      const r = await signInWithEmailAndPassword(auth,e,p);
      return r.user;
    };

    API.registerEmail = async (e,p) => {
      const r = await createUserWithEmailAndPassword(auth,e,p);
      return r.user;
    };

    API.logout = async () => signOut(auth);

    API.heroes.list = async () => {
      if(!API.user) return [];
      const snap = await getDocs(collection(db,"users",API.user.uid,"heroes"));
      return snap.docs.map(d=>({id:d.id,...d.data()}));
    };

    API.heroes.save = async (hero) => {
      if(!API.user) return;
      const ref = doc(db,"users",API.user.uid,"heroes",hero.id);
      await setDoc(ref,{...hero,updatedAt:serverTimestamp()},{merge:true});
    };

    API.heroes.remove = async (id) => {
      if(!API.user) return;
      await deleteDoc(doc(db,"users",API.user.uid,"heroes",id));
    };
  };
})();
