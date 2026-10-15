import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

export const firebaseConfig = {
  apiKey: "AIzaSyAMhUzeljjRuXIRLM-e-UkxJYeZQmLZZrg",
  authDomain: "aksara-bef7b.firebaseapp.com",
  projectId: "aksara-bef7b",
  storageBucket: "aksara-bef7b.firebasestorage.app",
  messagingSenderId: "513901728364",
  appId: "1:513901728364:web:799bc7d2d16ec9c913be49",
  measurementId: "G-L9VVS00DSR",
}

// Initialize Firebase safely for SSR/Next.js
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: "select_account",
})

/**
 * Trigger Google Sign In Popup with Firebase
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  const firebaseUser = result.user
  const idToken = await firebaseUser.getIdToken()

  return {
    firebaseUser,
    idToken,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    avatar: firebaseUser.photoURL || null,
  }
}
