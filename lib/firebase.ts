import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // 🚩 IMPORTANTE

const firebaseConfig = {
  apiKey: "AIzaSyDlfyIiNhws0F5Z0cIhEULCcHD8r7Vx8c4",
  authDomain: "mty-plusvalia-73037885-e0b25.firebaseapp.com",
  projectId: "mty-plusvalia-73037885-e0b25",
  storageBucket: "mty-plusvalia-73037885-e0b25.firebasestorage.app",
  messagingSenderId: "990980476093",
  appId: "1:990980476093:web:a2dece4d2e88c773edfbd4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// LOGIN
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();