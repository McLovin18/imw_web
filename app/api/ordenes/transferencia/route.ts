import { NextRequest, NextResponse } from "next/server";
import { crearOrdenAdmin, reservarStockOrdenAdmin } from "../../../lib/ordenes-db-admin";
import admin from "../../../lib/firebase-admin";
import { obtenerAtributos } from "../../../lib/atributos-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productos,
      metodoPago,
      datosCliente,
      datosEnvio,
      cuentaBancariaId,
      evidenciaTransferencia,
      total,
    } = body;

    // Validaciones básicas
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json(
        { error: "Debe haber al menos un producto" },
        { status: 400 }
      );
    }

    if (!datosCliente || !datosCliente.email) {
      return NextResponse.json(
        { error: "Datos del cliente incompletos" },
        { status: 400 }
      );
    }

    // Validar cédula/RUC (10 o 13 dígitos)
    const cedulaRucDigits = datosCliente.cedulaRuc?.replace(/\D/g, '') || '';
    if (cedulaRucDigits.length !== 10 && cedulaRucDigits.length !== 13) {
      return NextResponse.json(
        { error: "La cédula debe tener 10 dígitos o el RUC 13 dígitos" },
        { status: 400 }
      );
    }

    if (!datosEnvio || !datosEnvio.ciudad || !datosEnvio.direccion) {
      return NextResponse.json(
        { error: "Datos de envío incompletos" },
        { status: 400 }
      );
    }

    if (!cuentaBancariaId) {
      return NextResponse.json(
        { error: "Debe seleccionar una cuenta bancaria" },
        { status: 400 }
      );
    }

    if (!evidenciaTransferencia) {
      return NextResponse.json(
        { error: "Debe adjuntar la evidencia de transferencia" },
        { status: 400 }
      );
    }

    // Obtener información de la cuenta bancaria usando admin SDK
    const adminDb = admin.firestore();
    const cuentaDoc = await adminDb.collection("cuentas_bancarias").doc(cuentaBancariaId).get();
    if (!cuentaDoc.exists) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }
    const cuentaBancaria = { id: cuentaDoc.id, ...cuentaDoc.data() } as any;

    // Limpiar campos de Timestamp para compatibilidad con Admin SDK
    const cuentaBancariaLimpia = {
      banco: cuentaBancaria.banco,
      tipo: cuentaBancaria.tipo,
      numeroCuenta: cuentaBancaria.numeroCuenta,
      titular: cuentaBancaria.titular,
      cedulaRuc: cuentaBancaria.cedulaRuc,
    };

    // Obtener atributos para nombres de variaciones
    const atributos = await obtenerAtributos();
    const atributosMap = new Map(atributos.map((a) => [a.id, a.nombre]));

    // Procesar productos para incluir nombres de variaciones
    const productosProcesados = productos.map((p: any) => {
      const producto = { ...p };

      // Agregar nombres de variaciones dinámicas
      if (producto.selectedVariations && producto.variationAttributeIds) {
        producto.selectedVariationsConNombres = {};
        producto.variationAttributeIds.forEach((attrId: string) => {
          const attrName = atributosMap.get(attrId) || attrId;
          const value = producto.selectedVariations[attrId];
          if (value) {
            producto.selectedVariationsConNombres[attrId] = {
              nombre: attrName,
              valor: value,
            };
          }
        });
      }

      // Agregar nombres de personalización
      if (producto.personalizacionValues) {
        // Aquí podrías agregar lógica similar para personalización si existe
        producto.personalizacionValuesConNombres = producto.personalizacionValues;
      }

      return producto;
    });

    // Crear la orden
    const ordenPayload = {
      productos: productosProcesados,
      metodoPago,
      datosCliente,
      datosEnvio,
      cuentaBancariaId,
      cuentaBancaria: cuentaBancariaLimpia,
      evidenciaTransferencia,
      total,
      estado: "pendiente_pago",
      guestEmail: datosCliente.email,
    };

    const orden = await crearOrdenAdmin(ordenPayload);

    // Reservar stock (para transferencias pendientes)
    await reservarStockOrdenAdmin(orden.id);

    // Enviar emails
    try {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");

      // Convertir Timestamp a string ISO para serialización JSON
      const ordenParaEmail = {
        ...orden,
        createdAt: orden.createdAt?.toDate ? orden.createdAt.toDate().toISOString() : 
                   orden.createdAt?.seconds ? new Date(orden.createdAt.seconds * 1000).toISOString() :
                   orden.createdAt
      };

      console.log("[transferencia] Enviando email al cliente...");
      const emailClienteRes = await fetch(`${baseUrl}/api/email/send-transferencia-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orden: ordenParaEmail,
          tipo: "cliente",
        }),
      });

      if (!emailClienteRes.ok) {
        const text = await emailClienteRes.text();
        console.error("[transferencia] Error email cliente - Status:", emailClienteRes.status);
        console.error("[transferencia] Error email cliente - Response:", text);
      } else {
        console.log("[transferencia] ✅ Email cliente enviado");
      }

      console.log("[transferencia] Enviando email al dueño...");
      const emailDueñoRes = await fetch(`${baseUrl}/api/email/send-transferencia-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orden: ordenParaEmail,
          tipo: "dueño",
        }),
      });

      if (!emailDueñoRes.ok) {
        const text = await emailDueñoRes.text();
        console.error("[transferencia] Error email dueño - Status:", emailDueñoRes.status);
        console.error("[transferencia] Error email dueño - Response:", text);
      } else {
        console.log("[transferencia] ✅ Email dueño enviado");
      }
    } catch (emailError) {
      console.error("[transferencia] Error enviando emails:", emailError);
      // No fallar la orden si falla el email
    }

    return NextResponse.json({
      success: true,
      ordenId: orden.orderId,
      id: orden.id,
    });
  } catch (error: any) {
    console.error("Error creando orden de transferencia:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear la orden" },
      { status: 500 }
    );
  }
}
