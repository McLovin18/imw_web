import { NextRequest, NextResponse } from "next/server";
import admin from "../../../lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const db = admin.firestore();
    const auth = admin.auth();

    const authHeader = req.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: "No tiene permisos de administrador" },
        { status: 403 }
      );
    }

    const ordenesSnap = await db.collection("ordenes").get();
    
    const ordenes = ordenesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json(ordenes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener órdenes" },
      { status: 500 }
    );
  }
}
