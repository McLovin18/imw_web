import admin from "./firebase-admin";
import { getCatalogPricing } from "./pricing";

// ── Funciones que usan admin SDK (solo para API routes) ─────────────────────

export async function crearOrdenAdmin(orden: any) {
  const adminDb = admin.firestore();
  const metaRef = adminDb.collection("ordenes_meta").doc("counter");
  const counterDoc = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(metaRef);
    const last = snap.exists ? (snap.data().lastNumber || 0) : 0;
    const next = last + 1;
    tx.set(metaRef, { lastNumber: next }, { merge: true });
    return next;
  });
  const orderId = `ID-${String(counterDoc).padStart(6, "0")}`;

  const productosOrigen = Array.isArray(orden.productos) ? orden.productos : [];
  const productosProcesados: any[] = [];
  let total = 0;

  // Validar cantidades
  const MAX_QUANTITY_PER_ITEM = 10;
  for (const item of productosOrigen) {
    const cantidad = Number(item.cantidad || 1);
    if (cantidad > MAX_QUANTITY_PER_ITEM) {
      throw new Error(`Cantidad máxima permitida por producto: ${MAX_QUANTITY_PER_ITEM}`);
    }
    if (cantidad < 1) {
      throw new Error("Cantidad debe ser al menos 1");
    }
  }

  // Obtener productos usando admin SDK
  const productRefs = productosOrigen
    .filter((item: any) => item?.id)
    .map((item: any) => adminDb.collection("productos").doc(item.id));

  const productDocs = await Promise.all(
    productRefs.map((ref) => ref.get().catch(() => null))
  );

  const productDataMap = new Map<string, any>();
  for (const snap of productDocs) {
    if (snap && snap.exists) {
      productDataMap.set(snap.id, snap.data());
    }
  }

  for (const item of productosOrigen) {
    if (!item?.id) continue;

    const data = productDataMap.get(item.id);
    if (!data) continue;

    const { basePrice, discount, hasDiscount, finalPrice } = getCatalogPricing(data);
    const cantidad = Number(item.cantidad || 1);
    const unitPrice = finalPrice;
    const lineTotal = unitPrice * cantidad;

    // Validar stock (considerar variaciones si existen)
    const stockVariants = data.stockVariants || [];
    let availableStock = Number(data.stock || 0);
    
    if (item.selectedVariations && item.variationAttributeIds && stockVariants.length > 0) {
      // Buscar variación específica
      const variantIndex = stockVariants.findIndex((v: any) => {
        return item.variationAttributeIds.every(
          (attrId: string) => v.attributes?.[attrId] === item.selectedVariations[attrId]
        );
      });
      
      if (variantIndex !== -1) {
        availableStock = Number(stockVariants[variantIndex].cantidad || 0);
      }
    }
    
    if (availableStock < cantidad) {
      throw new Error(
        `Stock insuficiente para "${data.nombre}". Disponibles: ${availableStock}, Solicitados: ${cantidad}`
      );
    }

    total += lineTotal;

    productosProcesados.push({
      id: item.id,
      nombre: data.nombre,
      cantidad,
      precioBase: basePrice,
      descuento: hasDiscount ? discount : 0,
      precioFinal: finalPrice,
      subtotal: lineTotal,
      imagen: data.imagenes?.[0] || "",
      bodegaId: data.bodegaId || null,
      selectedTalla: item.selectedTalla || null,
      selectedColor: item.selectedColor || null,
      selectedVariations: item.selectedVariations || null,
      variationAttributeIds: item.variationAttributeIds || null,
    });
  }

  // Crear orden usando admin SDK
  const ordenDoc = await adminDb.collection("ordenes").add({
    orderId,
    cliente: orden.cliente,
    direccion: orden.direccion,
    productos: productosProcesados,
    subtotal: orden.subtotal || total,
    costoEnvio: orden.costoEnvio || 0,
    total: orden.total || total,
    estado: orden.estado || "pendiente",
    paymentMethod: orden.paymentMethod || "whatsapp",
    checkoutId: orden.checkoutId || "",
    paymentStatus: orden.paymentStatus || "pending",
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  });

  return {
    id: ordenDoc.id,
    orderId,
    createdAt: admin.firestore.Timestamp.now(),
  };
}

// Reservar stock para una orden pendiente (transferencias)
export async function reservarStockOrdenAdmin(ordenId: string) {
  const adminDb = admin.firestore();
  const ordenDoc = await adminDb.collection("ordenes").doc(ordenId).get();
  
  if (!ordenDoc.exists) {
    throw new Error("Orden no encontrada");
  }

  const orden = ordenDoc.data();
  const productos = orden.productos || [];

  for (const producto of productos) {
    const productoId = producto.id;
    const cantidad = Number(producto.cantidad || 1);

    // Obtener el producto actual
    const productoRef = adminDb.collection("productos").doc(productoId);
    const productoSnap = await productoRef.get();

    if (!productoSnap.exists) continue;

    const productoData = productoSnap.data();
    const stockVariants = productoData.stockVariants || [];

    // Verificar si tiene variaciones
    if (producto.selectedVariations && producto.variationAttributeIds && stockVariants.length > 0) {
      // Manejo de stock por variación
      const variantIndex = stockVariants.findIndex((v: any) => {
        return producto.variationAttributeIds.every(
          (attrId: string) => v.attributes?.[attrId] === producto.selectedVariations[attrId]
        );
      });

      if (variantIndex !== -1) {
        const currentVariantStock = Number(stockVariants[variantIndex].cantidad || 0);
        
        if (currentVariantStock >= cantidad) {
          // Convertir stockVariants a array si es objeto
          const stockVariantsArray = Array.isArray(stockVariants) 
            ? stockVariants 
            : Object.values(stockVariants).filter((v: any) => v && typeof v === 'object');
          
          // Actualizar solo la variación específica
          stockVariantsArray[variantIndex].cantidad = currentVariantStock - cantidad;
          
          // Escribir el array completo de vuelta
          await productoRef.update({
            stockVariants: stockVariantsArray,
          });
        } else {
          throw new Error(`Stock insuficiente para "${producto.nombre}". Disponibles: ${currentVariantStock}, Solicitados: ${cantidad}`);
        }
      } else {
        throw new Error(`Variación no encontrada para "${producto.nombre}"`);
      }
    } else {
      const currentStock = Number(productoData.stock || 0);
      if (currentStock >= cantidad) {
        await productoRef.update({
          stock: currentStock - cantidad,
        });
      } else {
        throw new Error(`Stock insuficiente para "${producto.nombre}". Disponibles: ${currentStock}, Solicitados: ${cantidad}`);
      }
    }
  }
}

// Deducir stock definitivamente cuando se aprueba la orden
export async function deducirStockOrdenAdmin(ordenId: string) {
  // El stock ya fue reservado al crear la orden, aquí solo confirmamos
}

// Devolver stock cuando se rechaza la orden
export async function devolverStockOrdenAdmin(ordenId: string) {
  const adminDb = admin.firestore();
  const ordenDoc = await adminDb.collection("ordenes").doc(ordenId).get();
  
  if (!ordenDoc.exists) {
    throw new Error("Orden no encontrada");
  }

  const orden = ordenDoc.data();
  const productos = orden.productos || [];

  for (const producto of productos) {
    const productoId = producto.id;
    const cantidad = Number(producto.cantidad || 1);
    const selectedVariations = producto.selectedVariations;
    const variationAttributeIds = producto.variationAttributeIds;

    // Obtener el producto actual
    const productoRef = adminDb.collection("productos").doc(productoId);
    const productoSnap = await productoRef.get();

    if (!productoSnap.exists) continue;

    const productoData = productoSnap.data();
    const stockVariants = productoData.stockVariants || [];

    // Verificar si tiene variaciones
    if (selectedVariations && variationAttributeIds && stockVariants.length > 0) {
      // Manejo de stock por variación
      const variantIndex = stockVariants.findIndex((v: any) => {
        return variationAttributeIds.every(
          (attrId: string) => v.attributes?.[attrId] === selectedVariations[attrId]
        );
      });

      if (variantIndex !== -1) {
        const currentVariantStock = Number(stockVariants[variantIndex].cantidad || 0);
        
        // Convertir stockVariants a array si es objeto
        const stockVariantsArray = Array.isArray(stockVariants) 
          ? stockVariants 
          : Object.values(stockVariants).filter((v: any) => v && typeof v === 'object');
        
        // Actualizar solo la variación específica
        stockVariantsArray[variantIndex].cantidad = currentVariantStock + cantidad;
        
        // Escribir el array completo de vuelta
        await productoRef.update({
          stockVariants: stockVariantsArray,
        });
      }
    } else {
      // Manejo de stock general
      const currentStock = Number(productoData.stock || 0);
      await productoRef.update({
        stock: currentStock + cantidad,
      });
    }
  }
}
