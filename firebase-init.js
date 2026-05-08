import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9zeCmCDloV7Xlpt83HTZ47trmQBZ0LaU",
  authDomain: "vasteria-gate-dd.firebaseapp.com",
  projectId: "vasteria-gate-dd",
  storageBucket: "vasteria-gate-dd.firebasestorage.app",
  messagingSenderId: "772207439440",
  appId: "1:772207439440:web:1dc74c935be2ddf8672b55"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, getDoc, setDoc, updateDoc, onSnapshot };
