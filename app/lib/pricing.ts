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
  const discount = Number(item?.descuento || 0);
  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
  const basePrice = Number(item?.precioBase ?? item?.precio ?? 0);
  const finalPrice = Number(item?.precioUnitario ?? item?.precioFinal ?? (hasDiscount ? basePrice * (1 - discount / 100) : basePrice));
  const fakeOldPrice = hasDiscount ? basePrice : null;

  return { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice };
}