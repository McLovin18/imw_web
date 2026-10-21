import { NextRequest, NextResponse } from "next/server";
import admin from "../../../lib/firebase-admin";
import { crearCuentaBancariaAdmin, actualizarCuentaBancariaAdmin, eliminarCuentaBancariaAdmin } from "../../../lib/cuentas-bancarias-db-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cuenta = await crearCuentaBancariaAdmin(body);
    return NextResponse.json(cuenta);
  } catch (error: any) {
    console.error("Error creando cuenta bancaria:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear cuenta bancaria" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    await actualizarCuentaBancariaAdmin(id, data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error actualizando cuenta bancaria:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar cuenta bancaria" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("[DELETE cuentas-bancarias] Iniciando...");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log("[DELETE cuentas-bancarias] ID recibido:", id);
    
    if (!id) {
      console.error("[DELETE cuentas-bancarias] ID no proporcionado");
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    
    console.log("[DELETE cuentas-bancarias] Llamando a eliminarCuentaBancariaAdmin...");
    await eliminarCuentaBancariaAdmin(id);
    console.log("[DELETE cuentas-bancarias] Cuenta eliminada exitosamente");
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE cuentas-bancarias] Error:", error);
    console.error("[DELETE cuentas-bancarias] Error message:", error.message);
    console.error("[DELETE cuentas-bancarias] Error code:", error.code);
    return NextResponse.json(
      { error: error.message || "Error al eliminar cuenta bancaria" },
      { status: 500 }
    );
  }
}
