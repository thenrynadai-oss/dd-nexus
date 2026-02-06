// Importa o Firebase direto da CDN do Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// SUAS chaves do projeto "Vasteria Gate"
const firebaseConfig = {
  apiKey: "AIzaSyAu8BqHB-zqXKmeY2eMbTFxfd_-W9xNIbI",
  authDomain: "vasteria-gate.firebaseapp.com",
  projectId: "vasteria-gate",
  storageBucket: "vasteria-gate.firebasestorage.app",
  messagingSenderId: "732190407959",
  appId: "1:732190407959:web:0ee5760ccdcf295c220b52"
};

// Inicializa a conexão
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta as ferramentas para o sheet.js usar
export { db, doc, getDoc, setDoc, updateDoc, onSnapshot };
