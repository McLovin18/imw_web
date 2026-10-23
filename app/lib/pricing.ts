export type CatalogPricing = {
  basePrice: number;
  discount: number;
  hasDiscount: boolean;
  fakeOldPrice: number | null;
  finalPrice: number;
};

export type SnapshotPricing = {
  basePrice: number;
  discount: number;
  hasDiscount: boolean;
  fakeOldPrice: number | null;
  finalPrice: number;
};

export function getCatalogPricing(product: any): CatalogPricing {
  const basePrice = Number(product?.precioBase ?? product?.precio ?? 0);
  const promoPrice = Number(product?.precioPromocional ?? 0);
  
  // Validar si el precio promocional es válido (menor al precio base)
  const hasValidPromoPrice = promoPrice > 0 && promoPrice < basePrice;
  
  // Si hay precio promocional válido, usarlo directamente como precio final
  // Si no, usar el campo descuento del producto para calcular
  let discount = 0;
  let finalPrice = basePrice;
  
  if (hasValidPromoPrice) {
    // Usar el precio promocional exacto como precio final
    finalPrice = promoPrice;
    // Calcular el descuento como un entero redondeado
    discount = Math.round(((basePrice - promoPrice) / basePrice) * 100);
  } else {
    // Usar el campo descuento del producto
    discount = Number(product?.descuento || 0);
    if (discount > 0 && discount < 100) {
      finalPrice = Math.round(basePrice * (1 - discount / 100) * 100) / 100;
    }
  }
  
  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
  const fakeOldPrice = hasDiscount ? basePrice : null;

  return { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice };
}

export function getSnapshotPricing(item: any): SnapshotPricing {
  // Si hay variaciones seleccionadas, usar precioPromocional de la variación si está disponible
  const hasVariations = item?.selectedVariations && item?.variationAttributeIds && Array.isArray(item.variationAttributeIds) && item.variationAttributeIds.length > 0;
  const allVariationsSelected = hasVariations && item.variationAttributeIds.every((attrId: string) => item.selectedVariations[attrId]);
  
  const basePrice = Number(item?.precioBase ?? item?.precio ?? 0);
  const promoPrice = Number(item?.precioPromocional ?? 0);
  const unitPrice = Number(item?.precioUnitario ?? item?.precioFinal ?? basePrice);
  
  let discount = 0;
  let finalPrice = basePrice;
  
  if (hasVariations && allVariationsSelected) {
    // Para variaciones, usar precioPromocional si es válido
    const hasValidPromoPrice = promoPrice > 0 && promoPrice < basePrice;
    if (hasValidPromoPrice) {
      finalPrice = promoPrice;
      discount = Math.round(((basePrice - promoPrice) / basePrice) * 100);
    } else {
      // Si no hay precio promocional, calcular descuento basado en la diferencia entre precioBase y precioUnitario
      // Esto maneja items existentes en el carrito que no tienen precioPromocional guardado
      if (unitPrice > 0 && unitPrice < basePrice) {
        finalPrice = unitPrice;
        discount = Math.round(((basePrice - unitPrice) / basePrice) * 100);
      } else {
        finalPrice = unitPrice;
        discount = 0;
      }
    }
  } else {
    // Para productos sin variaciones, usar el campo descuento
    discount = Number(item?.descuento || 0);
    finalPrice = Number(item?.precioUnitario ?? item?.precioFinal ?? (discount > 0 && discount < 100 ? basePrice * (1 - discount / 100) : basePrice));
  }
  
  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
  const fakeOldPrice = hasDiscount ? basePrice : null;

  return { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice };
}