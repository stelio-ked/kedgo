import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDk6v4loUYa4UXzYAf9CS46oryHbci5X4o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ked-go.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ked-go",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ked-go.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1072443531959",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1072443531959:web:2a03139cf8536491ace332",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GPCZEHE7VC",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");


