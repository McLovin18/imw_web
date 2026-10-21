import { NextRequest, NextResponse } from "next/server";
import admin from "../../../../lib/firebase-admin";
import { devolverStockOrdenAdmin } from "../../../../lib/ordenes-db-admin";

export async function POST(req: NextRequest) {
  try {
    const { ordenId, orden, motivo } = await req.json();

    if (!ordenId || !orden) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    await db.collection("ordenes").doc(ordenId).update({
      estado: "rechazada",
      rechazadaAt: new Date(),
      motivoRechazo: motivo || "",
    });

    await devolverStockOrdenAdmin(ordenId);

    return NextResponse.json({
      success: true,
      message: "Orden rechazada exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al rechazar la orden" },
      { status: 500 }
    );
  }
}
