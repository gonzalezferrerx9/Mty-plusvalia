// =================================================================================================
// IMPORTS AND DEPENDENCIES / IMPORTACIONES Y DEPENDENCIAS
// =================================================================================================
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

// =================================================================================================
// CREDENTIALS / CREDENCIALES
// =================================================================================================
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto-id.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto-id.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// =================================================================================================
// CORE
// =================================================================================================


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// =================================================================================================
// SERVICIOS Y EXPORTACIONES
// =================================================================================================

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Database
export const db = getFirestore(app); 