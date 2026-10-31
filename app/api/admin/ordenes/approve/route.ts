import { NextRequest, NextResponse } from "next/server";
import admin from "../../../../lib/firebase-admin";
import { deducirStockOrdenAdmin } from "../../../../lib/ordenes-db-admin";

export async function POST(req: NextRequest) {
  try {
    const { ordenId, orden } = await req.json();

    if (!ordenId || !orden) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Actualizar estado de la orden a aprobada
    await db.collection("ordenes").doc(ordenId).update({
      estado: "aprobada",
      aprobadaAt: new Date(),
    });

    // Deducir el stock definitivamente (ya estaba reservado, ahora se confirma)
    await deducirStockOrdenAdmin(ordenId);

    // Track purchase analytics when order is approved
    try {
      const metodoPago = orden.metodoPago || "transferencia";
      if (metodoPago === "transferencia") {
        const today = new Date().toISOString().split("T")[0];
        const analyticsRef = db.collection("analytics").doc(today);
        const analyticsSnap = await analyticsRef.get();

        if (analyticsSnap.exists) {
          await analyticsRef.update({
            "purchases.total": admin.firestore.FieldValue.increment(1),
            "purchases.transferencia": admin.firestore.FieldValue.increment(1),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[approve] Purchase tracked for transferencia: ${ordenId}`);
        } else {
          await analyticsRef.set({
            date: today,
            uniqueVisitors: 0,
            visitorIds: [],
            totalClicks: 0,
            clicksByType: {
              productClick: 0,
              categoryClick: 0,
              buttonClick: 0,
              linkClick: 0,
              blogClick: 0,
            },
            purchases: {
              whatsapp: 0,
              transferencia: 1,
              total: 1,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`[approve] Purchase tracked (new doc) for transferencia: ${ordenId}`);
        }
      }
    } catch (analyticsError) {
      console.error("[approve] Error tracking purchase analytics:", analyticsError);
      // No fallar la aprobación si falla el tracking
    }

    console.log(`✅ Orden ${ordenId} aprobada y stock deducido`);

    return NextResponse.json({
      success: true,
      message: "Orden aprobada exitosamente",
    });
  } catch (error: any) {
    console.error("Error aprobando orden:", error);
    return NextResponse.json(
      { error: error.message || "Error al aprobar la orden" },
      { status: 500 }
    );
  }
}
