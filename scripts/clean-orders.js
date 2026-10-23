import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function cleanOrders() {
  console.log("🧹 Limpiando todas las órdenes...");

  try {
    // Inicializar Firebase Admin con la misma configuración que el proyecto
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      privateKey = privateKey.trim().replace(/\\n/g, "\n").replace(/\r/g, "");
      privateKey = privateKey.trim();
      if (!privateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
        privateKey = "-----BEGIN PRIVATE KEY-----\n" + privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, "").trim() + "\n-----END PRIVATE KEY-----";
      }
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

    const adminDb = admin.firestore();
    adminDb.settings({ ignoreUndefinedProperties: true });

    // 1. Eliminar todas las órdenes
    console.log("📦 Eliminando documentos de la colección 'ordenes'...");
    const ordersSnapshot = await adminDb.collection("ordenes").get();

    if (ordersSnapshot.empty) {
      console.log("✅ No hay órdenes para eliminar.");
    } else {
      const batch = adminDb.batch();
      ordersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ ${ordersSnapshot.size} órdenes eliminadas.`);
    }

    // 2. Reiniciar el contador a 0
    console.log("🔢 Reiniciando el contador de órdenes...");
    await adminDb.collection("ordenes_meta").doc("counter").set({
      lastNumber: 0,
    });

    console.log("✅ Contador reiniciado a 0.");
    console.log("🎉 Limpieza completada exitosamente.");
    console.log("📝 La próxima orden será ID-000001");
  } catch (error) {
    console.error("❌ Error al limpiar las órdenes:", error);
    process.exit(1);
  }
}

// Ejecutar el script
cleanOrders().then(() => {
  process.exit(0);
});
