"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ProductoCard from "./ProductoCard";

export type RelatedProductsCarouselProps = {
  productos: any[];
  title?: string;
};

const CARD_MAX = 280; // ancho máximo de cada card (px)
const CARD_MIN = 240; // ancho mínimo antes de reducir la cantidad de cards (px)
const GAP = 20; // separación entre cards (px)
const AUTOPLAY_MS = 5000;
const ANIM_MS = 420;

/* Flechas */
const ARROW_SIZE = 44; // px
const ARROW_GAP = 10; // distancia entre la flecha y el borde de la card (px)
const ARROW_RESERVE = 2 * (ARROW_SIZE + ARROW_GAP) + 8; // espacio total que se reserva a los lados

const COMPACT_BELOW = 640; // debajo de este ancho las flechas van en el encabezado
const COMPACT_PAD = 16; // margen lateral en modo compacto

/* ── Iconos inline ── */
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d="M9.5 5.5L16 12l-6.5 6.5" />
  </svg>
);

/* ── Botón de flecha ── */
function ArrowButton({
  side,
  onClick,
  label,
  floating = true,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
  /** floating: pegada por fuera de la card (desktop). false: botón normal (móvil, en el encabezado) */
  floating?: boolean;
}) {
  const position = floating
    ? `absolute top-[42%] -translate-y-1/2 z-40 ${
        side === "left" ? "right-full" : "left-full"
      }`
    : "relative";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={
        floating
          ? {
              width: ARROW_SIZE,
              height: ARROW_SIZE,
              [side === "left" ? "marginRight" : "marginLeft"]: ARROW_GAP,
            }
          : undefined
      }
      className={`group ${position} flex items-center justify-center rounded-full
        ${floating ? "" : "h-10 w-10"}
        bg-white text-[#0a1f4d]
        ring-1 ring-[#0a1f4d]/15
        shadow-[0_10px_30px_-10px_rgba(10,31,77,0.45)]
        transition-all duration-300 ease-out
        hover:bg-[#0a1f4d] hover:text-[#e8cf94] hover:ring-[#c9a24d]/70 hover:shadow-[0_14px_34px_-10px_rgba(10,31,77,0.7)]
        active:scale-95
        dark:bg-[#0f1b36] dark:text-[#e8cf94] dark:ring-[#c9a24d]/30
        dark:hover:bg-[#e8cf94] dark:hover:text-[#0a1f4d] dark:hover:ring-[#e8cf94]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24d] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0b1224]`}
    >
      <span
        className={`transition-transform duration-300 ${
          side === "left"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
        }`}
      >
        {side === "left" ? <ChevronLeft /> : <ChevronRight />}
      </span>
    </button>
  );
}

export default function RelatedProductsCarousel({
  productos = [],
  title = "Productos relacionados",
}: RelatedProductsCarouselProps) {
  // ── State ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [boxWidth, setBoxWidth] = useState(0); // ancho REAL disponible del contenedor
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limitar a máximo 10 productos
  const productosLimitados = productos.slice(0, 10);
  const total = productosLimitados.length;
  const hasItems = total > 0;

  // ── Medir el ancho real del contenedor (no el de la ventana) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setBoxWidth(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver((entries) => {
      setBoxWidth(Math.round(entries[0].contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasItems]);

  // ── Preferencia de movimiento reducido ──
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── IntersectionObserver: pausa el autoplay fuera de pantalla ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasItems]);

  // Limpiar timeout de animación al desmontar
  useEffect(() => {
    return () => {
      if (animTimeout.current) clearTimeout(animTimeout.current);
    };
  }, []);

  // ── Layout calculado a partir del ancho real ──
  const measured = boxWidth > 0;
  const isCompact = measured && boxWidth < COMPACT_BELOW;

  // Espacio útil para las cards (reservando el de las flechas si van por fuera)
  const area = measured
    ? isCompact
      ? boxWidth - COMPACT_PAD * 2
      : boxWidth - ARROW_RESERVE
    : CARD_MAX;

  // Cuántas cards caben (entre 1 y 4) sin pasar de CARD_MIN
  const fit = Math.max(1, Math.min(4, Math.floor((area + GAP) / (CARD_MIN + GAP))));
  const effectiveItemsPerView = Math.max(1, Math.min(fit, total));

  // Ancho de cada card: fluido, nunca más de CARD_MAX ni más del espacio disponible
  const cardWidth = Math.max(
    160,
    Math.min(
      CARD_MAX,
      Math.floor((area - (effectiveItemsPerView - 1) * GAP) / effectiveItemsPerView)
    )
  );

  const gridWidth =
    effectiveItemsPerView * cardWidth + (effectiveItemsPerView - 1) * GAP;
  // Ancho del encabezado y de los indicadores
  const frameWidth = isCompact ? boxWidth - COMPACT_PAD * 2 : gridWidth;

  const hasCarousel = total > effectiveItemsPerView;
  const isPaused = isHovered || !isVisible;
  const autoplayOn = hasCarousel && !reducedMotion;

  // ── Navegación ──
  const goTo = useCallback(
    (nextIndex: number, dir: "left" | "right") => {
      setAnimDir(dir);
      setIsAnimating(true);
      setCurrentIndex(((nextIndex % total) + total) % total);
      if (animTimeout.current) clearTimeout(animTimeout.current);
      animTimeout.current = setTimeout(() => setIsAnimating(false), ANIM_MS);
    },
    [total]
  );

  const handlePrev = () => {
    if (!hasCarousel || isAnimating) return;
    goTo(currentIndex - 1, "left");
  };

  const handleNext = () => {
    if (!hasCarousel || isAnimating) return;
    goTo(currentIndex + 1, "right");
  };

  // ── Autoplay ──
  useEffect(() => {
    if (!autoplayOn || isPaused) return;
    const id = setTimeout(() => {
      goTo(currentIndex + 1, "right");
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [autoplayOn, isPaused, currentIndex, goTo]);

  if (!total) return null;

  // ── Productos visibles ──
  const count = hasCarousel ? effectiveItemsPerView : total;
  const visibleProducts: any[] = [];
  for (let i = 0; i < count; i++) {
    visibleProducts.push(productosLimitados[(currentIndex + i) % total]);
  }

  // ── Swipe táctil (móvil) ──
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasCarousel) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) < 50 || isAnimating) return;
    if (diff < 0) handleNext();
    else handlePrev();
  };

  // ── Teclado ──
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  const showFloatingArrows = hasCarousel && !isCompact;
  const showHeaderArrows = hasCarousel && isCompact;

  return (
    <section
      className="w-full py-10 sm:py-14"
      aria-roledescription="carrusel"
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      {/* Contenedor medido: todo (cards + flechas) vive DENTRO de este ancho, así nada se corta */}
      <div
        ref={containerRef}
        className="mx-auto w-full max-w-7xl transition-opacity duration-300"
        style={{ opacity: measured ? 1 : 0 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Encabezado alineado con los bordes de las cards */}
        <div
          className="mx-auto mb-8 flex items-end justify-between gap-4 sm:mb-10"
          style={{ width: measured ? frameWidth : "100%" }}
        >
          <div className="min-w-0">
            <h2 className="[font-family:var(--font-display,ui-serif,Georgia,'Times_New_Roman',serif)] text-[1.65rem] font-medium leading-tight tracking-[-0.01em] text-[#0a1f4d] sm:text-4xl dark:text-white">
              {title}
            </h2>
            {/* Filete dorado */}
            <span
              className="mt-3 block h-px w-24 bg-gradient-to-r from-[#c9a24d] via-[#e8cf94] to-transparent sm:w-32"
              aria-hidden="true"
            />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {hasCarousel && (
              <span
                className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400"
                aria-live="polite"
              >
                <span className="text-[#0a1f4d] dark:text-[#e8cf94]">
                  {currentIndex + 1}
                </span>
                <span className="mx-1 text-slate-300 dark:text-white/20">/</span>
                {total}
              </span>
            )}
            {showHeaderArrows && (
              <div className="flex items-center gap-2">
                <ArrowButton side="left" onClick={handlePrev} label="Producto anterior" floating={false} />
                <ArrowButton side="right" onClick={handleNext} label="Producto siguiente" floating={false} />
              </div>
            )}
          </div>
        </div>

        {/* Grid + flechas: el wrapper mide exactamente lo mismo que las cards */}
        <div className="relative mx-auto" style={{ width: gridWidth }}>
          {showFloatingArrows && (
            <ArrowButton side="left" onClick={handlePrev} label="Producto anterior" />
          )}
          {showFloatingArrows && (
            <ArrowButton side="right" onClick={handleNext} label="Producto siguiente" />
          )}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${effectiveItemsPerView}, ${cardWidth}px)`,
              gap: `${GAP}px`,
              animation: isAnimating
                ? `rpc-slide-${animDir} ${ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : undefined,
            }}
          >
            {visibleProducts
              .filter((prod: any) => prod && prod.id)
              .map((prod: any, idx: number) => (
                <div
                  key={`${prod.id}-${currentIndex}-${idx}`}
                  className="flex flex-col items-stretch"
                  style={{ width: `${cardWidth}px`, minWidth: 0 }}
                >
                  <ProductoCard producto={prod} />
                </div>
              ))}
          </div>
        </div>

        {/* Indicadores: la línea activa se llena con el tiempo del autoplay */}
        {hasCarousel && total > 1 && (
          <div
            className="mt-9 flex flex-wrap items-center justify-center gap-1.5"
            role="tablist"
            aria-label="Seleccionar producto"
          >
            {Array.from({ length: total }).map((_, i) => {
              const active = i === currentIndex;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Ir a producto ${i + 1}`}
                  onClick={() => {
                    if (isAnimating || i === currentIndex) return;
                    goTo(i, i > currentIndex ? "right" : "left");
                  }}
                  className="group flex h-6 items-center justify-center px-0.5 focus-visible:outline-none"
                >
                  <span
                    className={`relative block h-[3px] overflow-hidden rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-[#c9a24d] group-focus-visible:ring-offset-2 dark:group-focus-visible:ring-offset-[#0b1224] ${
                      active ? "w-12" : "w-5 group-hover:w-7"
                    } ${
                      active
                        ? "bg-[#0a1f4d]/15 dark:bg-white/15"
                        : "bg-[#0a1f4d]/15 group-hover:bg-[#c9a24d]/70 dark:bg-white/15 dark:group-hover:bg-[#e8cf94]/70"
                    }`}
                  >
                    {active && (
                      <span
                        key={`${currentIndex}-${isPaused}`}
                        className="absolute inset-0 origin-left scale-x-100 rounded-full bg-gradient-to-r from-[#a8832f] via-[#c9a24d] to-[#e8cf94]"
                        style={
                          autoplayOn && !isPaused
                            ? { animation: `rpc-fill ${AUTOPLAY_MS}ms linear forwards` }
                            : undefined
                        }
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyframes de animación */}
      <style>{`
        @keyframes rpc-slide-right {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes rpc-slide-left {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes rpc-fill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="rpc-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}