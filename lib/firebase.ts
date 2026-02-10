import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Importar Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDlfyIiNhws0F5Z0cIhEULCcHD8r7Vx8c4",
  authDomain: "mty-plusvalia-73037885-e0b25.firebaseapp.com",
  projectId: "mty-plusvalia-73037885-e0b25",
  storageBucket: "mty-plusvalia-73037885-e0b25.firebasestorage.app",
  messagingSenderId: "990980476093",
  appId: "1:990980476093:web:a2dece4d2e88c773edfbd4"
};

// Singleton: Evita que Firebase se inicialice 2 veces (causa común de errores)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Exportar la Base de Datos