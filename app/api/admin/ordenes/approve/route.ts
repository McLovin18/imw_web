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
