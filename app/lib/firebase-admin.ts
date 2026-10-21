
import admin from "firebase-admin";

let db: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      
      // Clean up private key - remove any leading/trailing whitespace, ensure proper line breaks
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      privateKey = privateKey.trim().replace(/\\n/g, "\n").replace(/\r/g, "");
      
      privateKey = privateKey.trim();
      if (!privateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
        // If it doesn't have the header, check if it's in the raw key and add it
        privateKey = "-----BEGIN PRIVATE KEY-----\n" + privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, "").trim() + "\n-----END PRIVATE KEY-----";
      }
      
      // If it still doesn't end with the footer, add it
      if (!privateKey.endsWith("-----END PRIVATE KEY-----")) {
        privateKey = privateKey + "\n-----END PRIVATE KEY-----";
      }
      
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: storageBucket,
      });
    } else {
      admin.initializeApp();
    }
    
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    
    // Eliminado test de conexión innecesario que añadía latencia
    
    adminAuth = admin.auth();
  } catch (err) {
    console.error("[Firebase Admin] Initialization error:", err);
  }
} else {
  db = admin.firestore();
  adminAuth = admin.auth();
}

export { db, adminAuth };
export default admin;
