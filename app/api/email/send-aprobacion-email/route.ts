import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSnapshotPricing } from "../../../lib/pricing";

// Función para obtener URL de imagen proxy para correos
function getProxyImageUrl(url: string): string {
  if (!url) {
    return "https://via.placeholder.com/60x60?text=No+Image";
  }
  // Usar servicio de proxy de imágenes público para asegurar compatibilidad con correos
  try {
    const encodedUrl = encodeURIComponent(url);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=60&h=60&fit=crop&output=webp`;
  } catch (error) {
    return url;
  }
}

function buildAprobacionEmailText(orden: any, tipo: "cliente" | "dueño", siteName: string): string {
  const isCliente = tipo === "cliente";

  let text = `${siteName}\n`;
  text += `${isCliente ? "Tu orden ha sido aprobada" : "Orden aprobada"}\n\n`;
  text += `Numero de orden: ${orden.orderId || "N/A"}\n`;
  text += `Fecha: ${orden.createdAt ? new Date(orden.createdAt).toLocaleDateString("es-ES") : "N/A"}\n`;
  text += `Estado: Aprobada\n\n`;

  if (isCliente) {
    text += `TUS DATOS\n`;
    text += `Nombre: ${orden.datosCliente?.nombre || "N/A"}\n`;
    text += `Cedula/RUC: ${orden.datosCliente?.cedulaRuc || "N/A"}\n`;
    text += `Telefono: ${orden.datosCliente?.telefono || "N/A"}\n`;
    text += `Email: ${orden.datosCliente?.email || "N/A"}\n`;
    text += `Direccion: ${orden.datosEnvio?.direccion || "N/A"}, ${orden.datosEnvio?.nombreCiudad || orden.datosEnvio?.ciudad || "N/A"}\n\n`;
  } else {
    text += `DATOS DEL CLIENTE\n`;
    text += `Nombre: ${orden.datosCliente?.nombre || "N/A"}\n`;
    text += `Cedula/RUC: ${orden.datosCliente?.cedulaRuc || "N/A"}\n`;
    text += `Telefono: ${orden.datosCliente?.telefono || "N/A"}\n`;
    text += `Email: ${orden.datosCliente?.email || "N/A"}\n`;
    text += `Direccion: ${orden.datosEnvio?.direccion || "N/A"}, ${orden.datosEnvio?.nombreCiudad || orden.datosEnvio?.ciudad || "N/A"}\n\n`;
  }

  text += `CUENTA BANCARIA UTILIZADA\n`;
  text += `Banco: ${orden.cuentaBancaria?.banco || "N/A"}\n`;
  text += `Tipo: ${orden.cuentaBancaria?.tipo || "N/A"}\n`;
  text += `Numero: ${orden.cuentaBancaria?.numeroCuenta || "N/A"}\n`;
  text += `Titular: ${orden.cuentaBancaria?.titular || "N/A"}\n\n`;

  text += `PRODUCTOS\n`;
  if (orden.productos && Array.isArray(orden.productos)) {
    orden.productos.forEach((p: any) => {
      const { finalPrice: precioUnit } = getSnapshotPricing(p);
      const cantidad = Number(p.cantidad || 1);
      const subtotal = precioUnit * cantidad;
      text += `- ${p.nombre || "Producto"}\n`;
      text += `  Cantidad: ${cantidad}\n`;
      text += `  Precio: $${precioUnit.toFixed(2)}\n`;
      text += `  Subtotal: $${subtotal.toFixed(2)}\n`;
    });
  }

  text += `\nTOTALES\n`;
  text += `Subtotal productos: $${((orden.total || 0) - (orden.datosEnvio?.costoEnvio || 0)).toFixed(2)}\n`;
  text += `Costo de envio (${orden.datosEnvio?.nombreCiudad || orden.datosEnvio?.ciudad || "N/A"}): $${(orden.datosEnvio?.costoEnvio || 0).toFixed(2)}\n`;
  text += `Total a pagar: $${(orden.total || 0).toFixed(2)}\n\n`;

  if (isCliente) {
    text += `TU ORDEN HA SIDO APROBADA\n`;
    text += `Tu pago ha sido verificado y tu orden esta siendo procesada.\n`;
    text += `Te notificaremos cuando tu pedido sea enviado.\n\n`;
  } else {
    text += `ORDEN APROBADA\n`;
    text += `La orden ha sido aprobada exitosamente.\n\n`;
  }

  text += `Este correo fue enviado automaticamente por ${siteName}\n`;
  text += `© ${new Date().getFullYear()} ${siteName}. Todos los derechos reservados.`;

  return text;
}

function buildAprobacionEmailHTML(orden: any, tipo: "cliente" | "dueño"): string {
  const isCliente = tipo === "cliente";
  const siteName = process.env.SITE_NAME || "IMW";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td>
        <!-- Header con gradiente verde -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #059669 0%, #10b981 100%);border-radius:12px 12px 0 0;">
          <tr>
            <td style="padding:32px;text-align:center;color:white;">
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:bold;">✅ ${siteName}</h1>
              <p style="margin:0;font-size:14px;opacity:0.9;">${isCliente ? "¡Tu pago ha sido aprobado!" : "Orden aprobada"}</p>
            </td>
          </tr>
        </table>

        <!-- Número de orden y estado -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px 36px;">
              <div style="background:#ecfdf5;border-left:4px solid #059669;padding:16px;border-radius:4px;">
                <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Número de orden</p>
                <p style="margin:0;font-size:24px;font-weight:bold;color:#059669;">${orden.orderId || "N/A"}</p>
                <p style="margin:8px 0 0;font-size:13px;color:#666;">Fecha: ${orden.createdAt ? new Date(orden.createdAt).toLocaleDateString("es-ES") : "N/A"}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#059669;font-weight:bold;">✅ Estado: Aprobada</p>
              </div>
            </td>
          </tr>
        </table>

        ${isCliente ? `
        <!-- Datos de envío -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Datos de envío</h2>
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Ciudad:</strong> ${orden.datosEnvio?.nombreCiudad || orden.datosEnvio?.ciudad || "N/A"}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Dirección:</strong> ${orden.datosEnvio?.direccion || "N/A"}</p>
                <p style="margin:0;font-size:14px;color:#374151;"><strong>Costo de envío:</strong> $${(orden.datosEnvio?.costoEnvio || 0).toFixed(2)}</p>
              </div>
            </td>
          </tr>
        </table>
        ` : `
        <!-- Datos del cliente (para el dueño) -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Datos del cliente</h2>
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Nombre:</strong> ${orden.datosCliente?.nombre || "N/A"}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Cédula/RUC:</strong> ${orden.datosCliente?.cedulaRuc || "N/A"}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Teléfono:</strong> ${orden.datosCliente?.telefono || "N/A"}</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Email:</strong> ${orden.datosCliente?.email || "N/A"}</p>
                <p style="margin:0;font-size:14px;color:#374151;"><strong>Dirección:</strong> ${orden.datosEnvio?.direccion || "N/A"}, ${orden.datosEnvio?.nombreCiudad || orden.datosEnvio?.ciudad || "N/A"}</p>
              </div>
            </td>
          </tr>
        </table>
        `}

        <!-- Tabla de productos -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#1f2937;">Productos</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
                    <th style="padding:12px 8px;text-align:left;font-size:13px;font-weight:bold;color:#374151;">Imagen</th>
                    <th style="padding:12px 8px;text-align:left;font-size:13px;font-weight:bold;color:#374151;">Producto</th>
                    <th style="padding:12px 8px;text-align:center;font-size:13px;font-weight:bold;color:#374151;width:60px;">Cant.</th>
                    <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#374151;width:100px;">Precio</th>
                    <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#374151;width:100px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    orden.productos && Array.isArray(orden.productos)
                      ? orden.productos.map((p: any) => {
                          const { finalPrice: precioUnit, discount: descuento, hasDiscount: hasDescuento } = getSnapshotPricing(p);
                          const cantidad = Number(p.cantidad || 1);
                          const subtotal = precioUnit * cantidad;
                          const imagen = getProxyImageUrl(p.imagen || p.imagenes?.[0] || "");
                          let variantText = "";

                          // Variaciones dinámicas
                          if (p.selectedVariationsConNombres) {
                            const variants = Object.values(p.selectedVariationsConNombres).map((v: any) => `${v.nombre}: ${v.valor}`).join(", ");
                            if (variants) variantText = `<br><span style="font-size:11px;color:#666;">${variants}</span>`;
                          }

                          return `
                    <tr style="border-bottom:1px solid #e5e7eb;">
                      <td style="padding:12px 8px;text-align:center;">
                        <img src="${imagen}" alt="${p.nombre}" width="60" height="60" style="width:60px;height:60px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;display:block;" border="0">
                      </td>
                      <td style="padding:12px 8px;font-size:13px;color:#374151;">
                        <strong>${p.nombre || "Producto"}</strong>
                        ${variantText}
                        ${hasDescuento ? `<br><span style="font-size:11px;color:#dc2626;">-${Math.round(descuento)}%</span>` : ""}
                      </td>
                      <td style="padding:12px 8px;text-align:center;font-size:13px;color:#374151;">${cantidad}</td>
                      <td style="padding:12px 8px;text-align:right;font-size:13px;color:#374151;">$${precioUnit.toFixed(2)}</td>
                      <td style="padding:12px 8px;text-align:right;font-size:13px;font-weight:bold;color:#059669;">$${subtotal.toFixed(2)}</td>
                    </tr>
                  `;
                        })
                      : "<tr><td colspan=5 style='padding:12px;text-align:center;color:#999;'>No hay productos</td></tr>"
                  }
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totales -->
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Subtotal productos:</span>
                  <span style="color:#1f2937;font-weight:bold;">$${((orden.total || 0) - (orden.datosEnvio?.costoEnvio || 0)).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                  <span style="color:#666;">Costo de envío (${orden.datosEnvio?.nombreCiudad || orden.datosEnvio?.ciudad || "N/A"}):</span>
                  <span style="color:#1f2937;font-weight:bold;">$${(orden.datosEnvio?.costoEnvio || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:bold;">
                  <span style="color:#1f2937;">Total pagado:</span>
                  <span style="color:#059669;">$${(orden.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        ${isCliente ? `
        <!-- Info para el cliente -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:14px;color:#065f46;font-weight:bold;">📦 Tu pedido está siendo procesado</p>
                <p style="margin:0 0 8px;font-size:14px;color:#065f46;">
                  Hemos verificado tu transferencia y tu orden ha sido aprobada. Estamos preparando tu pedido para envío.
                </p>
                <p style="margin:0;font-size:14px;color:#065f46;">
                  <strong>Tiempo estimado de entrega:</strong> 24-48 horas hábiles
                </p>
              </div>
            </td>
          </tr>
        </table>
        ` : `
        <!-- Info para el dueño -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:14px;color:#1e40af;font-weight:bold;">✅ Orden aprobada</p>
                <p style="margin:0 0 8px;font-size:14px;color:#1e40af;">
                  La orden ha sido aprobada y el stock ha sido deducido. El cliente ha sido notificado.
                </p>
                <p style="margin:0;font-size:14px;color:#1e40af;">
                  <a href="${process.env.NEXT_PUBLIC_DOMAIN || "https://imw.com"}/admin/pedidos" style="color:#1e40af;font-weight:bold;text-decoration:underline;">Ver en panel de administración</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
        `}

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Este correo fue enviado automáticamente por ${siteName}</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} ${siteName}. Todos los derechos reservados.</p>
          </td>
        </tr>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { orden, tipo } = await req.json();

    if (!orden || !tipo || (tipo !== "cliente" && tipo !== "dueño")) {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    const email = tipo === "cliente"
      ? (orden.datosCliente?.email || orden.guestEmail || orden.userEmail)
      : process.env.OWNER_EMAIL || "dueño@imw.com";

    if (!email || typeof email !== "string" || email.trim() === "" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[send-aprobacion-email] RESEND_API_KEY no configurado");
      return NextResponse.json(
        { error: "Servicio de email no disponible" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const emailFrom = process.env.EMAIL_FROM || "pedidos@imw.com";
    const emailReplyTo = process.env.EMAIL_REPLY_TO || "soporte@imw.com";
    const siteName = process.env.SITE_NAME || "IMW";

    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: email.trim(),
      subject: tipo === "cliente"
        ? `Tu orden ${orden.orderId} ha sido aprobada - ${siteName}`
        : `Orden ${orden.orderId} aprobada - ${siteName}`,
      html: buildAprobacionEmailHTML(orden, tipo),
      text: buildAprobacionEmailText(orden, tipo, siteName),
      replyTo: emailReplyTo,
    });

    if (emailResponse.error) {
      console.error("[send-aprobacion-email] Resend error:", emailResponse.error);
      return NextResponse.json(
        { error: "Error al enviar el correo" },
        { status: 500 }
      );
    }

    console.log(
      `✅ [APROBACION_EMAIL_ENVIADO] ${orden.orderId} | ` +
      `Tipo: ${tipo} | ` +
      `Email: ${email.trim()} | ` +
      `ResendId: ${emailResponse.data?.id}`
    );

    return NextResponse.json({
      success: true,
      message: `Email enviado a ${email.trim()}`,
      resendId: emailResponse.data?.id,
    });
  } catch (err: any) {
    console.error("[send-aprobacion-email] ❌ Error:", err);
    return NextResponse.json(
      { error: err.message || "Error al enviar el correo" },
      { status: 500 }
    );
  }
}
