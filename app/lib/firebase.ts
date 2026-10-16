// Inicialización de Firebase para el cliente (navegador)
import { initializeApp, getApps, getApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("[Firebase] =======================================");
console.log("[Firebase] INICIALIZANDO FIREBASE");
console.log("[Firebase] Project ID:", firebaseConfig.projectId);
console.log("[Firebase] Auth Domain:", firebaseConfig.authDomain);
console.log("[Firebase] Has API Key:", !!firebaseConfig.apiKey);
console.log("[Firebase] Storage Bucket:", firebaseConfig.storageBucket);
console.log("[Firebase] App ID:", firebaseConfig.appId);
console.log("[Firebase] =======================================");

// Solo inicializa si no hay apps
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export { app };

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Loguear el token de autenticación para verificar claims
if (typeof window !== "undefined") {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Forzar refresh del token para obtener claims actualizados
      const token = await user.getIdTokenResult(true);
      console.log("[Firebase Auth] Token claims (force refreshed):", token.claims);
      console.log("[Firebase Auth] Has admin claim:", token.claims.admin);
      console.log("[Firebase Auth] Has token.admin:", token.claims.token?.admin);
    } else {
      console.log("[Firebase Auth] No user authenticated");
    }
  });
}

// Deshabilitado temporalmente persistencia offline para verificar si causa lentitud
// if (typeof window !== "undefined") {
//   enableIndexedDbPersistence(db).catch((err) => {
//     if (err.code === "failed-precondition") {
//       console.log("[Firebase] Múltiples pestañas abiertas, persistencia no disponible");
//     } else if (err.code === "unimplemented") {
//       console.log("[Firebase] El navegador no soporta IndexedDB");
//     } else {
//       console.error("[Firebase] Error al habilitar persistencia:", err);
//     }
//   });
// }
