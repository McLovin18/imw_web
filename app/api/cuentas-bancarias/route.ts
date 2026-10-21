import { NextRequest, NextResponse } from "next/server";
import admin from "../../lib/firebase-admin";

export async function GET() {
  try {
    console.log("[cuentas-bancarias API] Iniciando GET...");
    console.log("[cuentas-bancarias API] Admin apps length:", admin.apps.length);
    
    const adminDb = admin.firestore();
    console.log("[cuentas-bancarias API] Firestore instance obtenida");
    
    const snapshot = await adminDb.collection("cuentas_bancarias").orderBy("createdAt", "desc").get();
    console.log("[cuentas-bancarias API] Snapshot obtenido, docs:", snapshot.size);
    
    const cuentas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("[cuentas-bancarias API] Cuentas mapeadas:", cuentas.length);
    console.log("[cuentas-bancarias API] IDs de cuentas:", cuentas.map(c => c.id));
    
    // Verificar si cada documento existe individualmente
    for (const cuenta of cuentas) {
      const docRef = adminDb.collection("cuentas_bancarias").doc(cuenta.id);
      const docSnap = await docRef.get();
      console.log(`[cuentas-bancarias API] Verificando ID ${cuenta.id}: existe=${docSnap.exists}`);
    }
    
    return NextResponse.json(cuentas, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error("[cuentas-bancarias API] Error:", error);
    console.error("[cuentas-bancarias API] Error message:", error.message);
    console.error("[cuentas-bancarias API] Error code:", error.code);
    return NextResponse.json(
      { error: error.message || "Error al obtener cuentas bancarias" },
      { status: 500 }
    );
  }
}
