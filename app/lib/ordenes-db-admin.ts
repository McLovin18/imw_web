import admin from "./firebase-admin";
import { getCatalogPricing } from "./pricing";

// ── Funciones que usan admin SDK (solo para API routes) ─────────────────────

export async function crearOrdenAdmin(orden: any) {
  console.log("[crearOrdenAdmin] Iniciando creación de orden");
  const adminDb = admin.firestore();

  // Generar orderId usando admin SDK
  console.log("[crearOrdenAdmin] Generando orderId...");
  const metaRef = adminDb.collection("ordenes_meta").doc("counter");
  const counterDoc = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(metaRef);
    const last = snap.exists ? (snap.data().lastNumber || 0) : 0;
    const next = last + 1;
    tx.set(metaRef, { lastNumber: next }, { merge: true });
    return next;
  });
  const orderId = `ID-${String(counterDoc).padStart(6, "0")}`;
  console.log("[crearOrdenAdmin] orderId generado:", orderId);

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
  console.log("[reservarStockOrdenAdmin] Iniciando para orden:", ordenId);
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
    console.log(`[reservarStockOrdenAdmin] Procesando producto: ${producto.nombre}, cantidad: ${cantidad}`);

    // Obtener el producto actual
    const productoRef = adminDb.collection("productos").doc(productoId);
    const productoSnap = await productoRef.get();

    if (!productoSnap.exists) continue;

    const productoData = productoSnap.data();
    const stockVariants = productoData.stockVariants || [];
    console.log(`[reservarStockOrdenAdmin] stockVariants length: ${stockVariants.length}`);
    console.log(`[reservarStockOrdenAdmin] selectedVariations:`, producto.selectedVariations);
    console.log(`[reservarStockOrdenAdmin] variationAttributeIds:`, producto.variationAttributeIds);

    // Verificar si tiene variaciones
    if (producto.selectedVariations && producto.variationAttributeIds && stockVariants.length > 0) {
      // Manejo de stock por variación
      const variantIndex = stockVariants.findIndex((v: any) => {
        return producto.variationAttributeIds.every(
          (attrId: string) => v.attributes?.[attrId] === producto.selectedVariations[attrId]
        );
      });
      console.log(`[reservarStockOrdenAdmin] variantIndex: ${variantIndex}`);

      if (variantIndex !== -1) {
        const currentVariantStock = Number(stockVariants[variantIndex].cantidad || 0);
        console.log(`[reservarStockOrdenAdmin] currentVariantStock: ${currentVariantStock}`);
        console.log(`[reservarStockOrdenAdmin] variantIndex: ${variantIndex}`);
        console.log(`[reservarStockOrdenAdmin] Nueva cantidad: ${currentVariantStock - cantidad}`);
        
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
          console.log(`[reservarStockOrdenAdmin] Stock reservado: ${currentVariantStock - cantidad}`);
          
          // Verificar la actualización
          const updatedSnap = await productoRef.get();
          const updatedData = updatedSnap.data();
          console.log(`[reservarStockOrdenAdmin] stockVariants después de update:`, updatedData?.stockVariants);
        } else {
          throw new Error(`Stock insuficiente para "${producto.nombre}". Disponibles: ${currentVariantStock}, Solicitados: ${cantidad}`);
        }
      } else {
        console.error("[reservarStockOrdenAdmin] Variación no encontrada en stockVariants");
        throw new Error(`Variación no encontrada para "${producto.nombre}"`);
      }
    } else {
      // Manejo de stock general
      const currentStock = Number(productoData.stock || 0);
      console.log(`[reservarStockOrdenAdmin] currentStock (general): ${currentStock}`);
      if (currentStock >= cantidad) {
        await productoRef.update({
          stock: currentStock - cantidad,
        });
        console.log(`[reservarStockOrdenAdmin] Stock reservado: ${currentStock - cantidad}`);
      } else {
        throw new Error(`Stock insuficiente para "${producto.nombre}". Disponibles: ${currentStock}, Solicitados: ${cantidad}`);
      }
    }
  }
}

// Deducir stock definitivamente cuando se aprueba la orden
export async function deducirStockOrdenAdmin(ordenId: string) {
  // El stock ya fue reservado al crear la orden, aquí solo confirmamos
  // Podríamos agregar lógica adicional si es necesario
  console.log(`[deducirStockOrdenAdmin] Stock ya fue reservado para orden ${ordenId}`);
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
