"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Producto } from "../lib/productos-db";

type PromocionalPopupProps = {
  productos: Producto[];
  onClose: () => void;
};

const SLIDE_DURATION_MS = 8000;

export default function PromocionalPopup({ productos, onClose }: PromocionalPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const promos = useMemo(() => productos.filter((p) => p.promocionar), [productos]);
  const total = promos.length;
  const safeIndex = total > 0 ? currentIndex % total : 0;

  const goTo = (idx: number) => setCurrentIndex(idx);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % total);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + total) % total);

  // Cerrar con Escape y bloquear el scroll del fondo mientras el popup está abierto
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (total === 0) return null;

  const currentProduct = promos[safeIndex];
  const imagen = currentProduct.imagenes?.[0] || currentProduct.imagen || "/no-image.png";

  // Precio con descuento (base + promocional)
  const precioBase = Number(currentProduct.precio || 0);
  const descuentoBase = Number(currentProduct.descuento || 0);
  const descuentoPromocional = Number(currentProduct.promocionarDescuento || 0);
  const descuentoTotal = Math.min(descuentoBase + descuentoPromocional, 100);
  const precioFinal = descuentoTotal > 0 ? precioBase * (1 - descuentoTotal / 100) : precioBase;
  const ahorro = precioBase - precioFinal;

  const tituloPromocional = currentProduct.promocionarTitulo || "¡OFERTA ESPECIAL!";
  const descripcionPromocional =
    currentProduct.promocionarDescripcion || "Aprovecha este descuento exclusivo";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <style>{`
        @keyframes promo-pop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes promo-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes promo-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Producto en promoción"
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--cardForeground)] shadow-2xl"
        style={{ animation: "promo-pop 0.3s ease-out" }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          aria-label="Cerrar popup"
        >
          <span className="material-icons-round text-xl">close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* ===== Imagen ===== */}
          <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden bg-[var(--galleryImgBg)] p-6 md:min-h-[460px] md:p-8">
            {/* Resplandor dorado de fondo */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%)",
              }}
            />

            {/* Badge de descuento */}
            {descuentoTotal > 0 && (
              <div className="absolute left-3 top-3 z-10 rounded-full bg-[var(--primary)] px-3 py-1 text-sm font-bold tracking-wide text-[var(--primaryForeground)] shadow-lg">
                -{Math.round(descuentoTotal)}%
              </div>
            )}

            <img
              key={currentProduct.id}
              src={imagen}
              alt={currentProduct.nombre}
              className="relative z-[1] max-h-[220px] max-w-full rounded-xl object-contain drop-shadow-2xl md:max-h-[340px]"
              style={{ animation: "promo-fade 0.45s ease-out" }}
            />

            {/* Flechas */}
            {total > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-black/65"
                  aria-label="Anterior"
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-black/65"
                  aria-label="Siguiente"
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </>
            )}

            {/* Indicadores con barra de progreso */}
            {total > 1 && (
              <div className="absolute inset-x-6 bottom-4 z-10 flex gap-1.5">
                {promos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-black/25 dark:bg-white/25"
                    aria-label={`Ir al slide ${idx + 1}`}
                  >
                    {idx < safeIndex && (
                      <span className="block h-full w-full bg-[var(--primary)]" />
                    )}
                    {idx === safeIndex && (
                      <span
                        key={safeIndex}
                        className="block h-full w-full origin-left bg-[var(--primary)]"
                        style={{
                          animation: `promo-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                          animationPlayState: isPaused ? "paused" : "running",
                        }}
                        onAnimationEnd={nextSlide}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== Información ===== */}
          <div
            key={currentProduct.id}
            className="flex flex-col justify-center p-6 md:p-8"
            style={{ animation: "promo-fade 0.45s ease-out" }}
          >
            {/* Etiqueta promocional */}
            <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
              <span className="material-icons-round text-base">local_offer</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] sm:text-sm">
                {tituloPromocional}
              </span>
            </div>

            {/* Nombre */}
            <h2 className="mb-2 text-2xl font-bold uppercase leading-tight tracking-wide text-[var(--text)] md:text-3xl">
              {currentProduct.nombre}
            </h2>

            {/* Descripción promocional */}
            <p className="mb-5 text-sm text-[var(--textSecondary)] md:text-base">
              {descripcionPromocional}
            </p>

            {/* Precios */}
            <div className="mb-5 border-y border-[var(--border)] py-4">
              {descuentoTotal > 0 && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg text-[var(--textSecondary)] line-through">
                    ${precioBase.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--accent)]">
                    Ahorras ${ahorro.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="text-4xl font-bold text-[var(--text)] md:text-5xl">
                ${precioFinal.toFixed(2)}
              </div>
            </div>

            {/* Info adicional */}
            <div className="mb-6 space-y-2 text-sm text-[var(--textSecondary)]">
              {currentProduct.descripcion && (
                <p className="line-clamp-2">{currentProduct.descripcion}</p>
              )}
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-base text-[var(--accent)]">
                  inventory_2
                </span>
                <span>Stock disponible</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2">
              <a
                href={`/product-detail?id=${currentProduct.id}`}
                onClick={onClose}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3.5 text-base font-bold uppercase tracking-wide text-[var(--primaryForeground)] shadow-lg transition hover:-translate-y-0.5 hover:bg-[var(--primaryHover)] hover:shadow-xl"
              >
                <span>Ver detalle</span>
                <span className="material-icons-round text-lg transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </a>
              <button
                onClick={onClose}
                className="w-full rounded-xl px-6 py-2.5 text-sm font-medium text-[var(--textSecondary)] transition hover:text-[var(--text)]"
              >
                Seguir navegando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}