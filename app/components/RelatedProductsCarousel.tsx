"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ProductoCard from "./ProductoCard";

export type RelatedProductsCarouselProps = {
  productos: any[];
  title?: string;
};

const CARD_WIDTH = 280; // px
const GAP = 16; // px
const AUTOPLAY_MS = 4000;
const ANIM_MS = 300;

/* ── Iconos inline (sin depender de material-icons) ── */
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

/* ── Botón de flecha: el centro del círculo cae justo en el borde de la card ── */
function ArrowButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const position =
    side === "left"
      ? "left-0 -translate-x-1/2"
      : "right-0 translate-x-1/2";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group absolute top-[42%] ${position} -translate-y-1/2 z-30
        h-9 w-9 sm:h-11 sm:w-11 rounded-full overflow-hidden
        flex items-center justify-center
        bg-white/90 dark:bg-slate-900/85 backdrop-blur-md
        text-[#0a1f4d] dark:text-blue-200
        ring-1 ring-slate-200/90 dark:ring-white/10
        shadow-[0_8px_22px_-6px_rgba(10,26,63,0.5)]
        transition-all duration-200 ease-out
        hover:scale-110 hover:ring-transparent hover:shadow-[0_10px_28px_-4px_rgba(30,58,138,0.7)]
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900`}
    >
      {/* Relleno degradado que aparece en hover */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#0a1f4d] via-[#12306e] to-[#1e3a8a] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <span className="relative z-10 transition-colors duration-200 group-hover:text-white">
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
  const [itemsPerView, setItemsPerView] = useState(4);
  const [animDir, setAnimDir] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limitar a máximo 10 productos
  const productosLimitados = productos.slice(0, 10);
  const total = productosLimitados.length;

  // ── Responsive items per view ──
  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 640) setItemsPerView(1);
      else if (width < 960) setItemsPerView(2);
      else if (width < 1280) setItemsPerView(3);
      else setItemsPerView(4);
    };
    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  // ── IntersectionObserver para detectar visibilidad ──
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.25 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Limpiar timeout de animación al desmontar
  useEffect(() => {
    return () => {
      if (animTimeout.current) clearTimeout(animTimeout.current);
    };
  }, []);

  const effectiveItemsPerView = Math.min(itemsPerView, total);
  const hasCarousel = total > effectiveItemsPerView;

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
    if (!hasCarousel || isHovered || !isVisible) return;
    const id = setInterval(() => {
      goTo(currentIndex + 1, "right");
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [hasCarousel, isHovered, isVisible, currentIndex, goTo]);

  if (!total) return null;

  // ── Productos visibles ──
  const count = hasCarousel ? effectiveItemsPerView : total;
  const visibleProducts: any[] = [];
  for (let i = 0; i < count; i++) {
    visibleProducts.push(productosLimitados[(currentIndex + i) % total]);
  }

  // Ancho exacto del grid: las flechas se anclan a ESTE ancho (bordes reales de las cards)
  const gridWidth = effectiveItemsPerView * CARD_WIDTH + (effectiveItemsPerView - 1) * GAP;

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

  return (
    <section className="w-full" aria-roledescription="carrusel" aria-label={title}>
      {/* Encabezado */}
      <div className="mx-auto mt-4 mb-2 flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-[#1e3a8a] to-[#0a1f4d] dark:from-blue-400 dark:to-blue-600" aria-hidden="true" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {title}
          </h2>
        </div>

        {hasCarousel && (
          <span className="rounded-full bg-blue-50 dark:bg-white/5 px-3 py-1 text-xs font-semibold tabular-nums text-[#0a1f4d] dark:text-blue-200 ring-1 ring-blue-100 dark:ring-white/10">
            {currentIndex + 1} / {total}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="mx-auto w-full max-w-7xl px-4 sm:px-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Wrapper con el ancho exacto de las cards → referencia para las flechas */}
        <div className="relative mx-auto" style={{ width: gridWidth, maxWidth: "100%" }}>
          {hasCarousel && (
            <ArrowButton side="left" onClick={handlePrev} label="Producto anterior" />
          )}
          {hasCarousel && (
            <ArrowButton side="right" onClick={handleNext} label="Producto siguiente" />
          )}

          {/* Grid de productos */}
          <div
            className="grid justify-center"
            style={{
              gridTemplateColumns: `repeat(${effectiveItemsPerView}, ${CARD_WIDTH}px)`,
              gap: `${GAP}px`,
              animation: isAnimating
                ? `rpc-slide-${animDir} ${ANIM_MS - 20}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : undefined,
            }}
          >
            {visibleProducts
              .filter((prod: any) => prod && prod.id)
              .map((prod: any, idx: number) => (
                <div
                  key={`${prod.id}-${currentIndex}-${idx}`}
                  className="flex flex-col items-stretch"
                  style={{ width: `${CARD_WIDTH}px`, minWidth: 0 }}
                >
                  <ProductoCard producto={prod} />
                </div>
              ))}
          </div>
        </div>

        {/* Indicadores */}
        {hasCarousel && total > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5" role="tablist" aria-label="Seleccionar producto">
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
                  className="group flex h-5 items-center justify-center px-0.5 focus-visible:outline-none"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-blue-700 group-focus-visible:ring-offset-2 ${
                      active
                        ? "w-7 bg-gradient-to-r from-[#0a1f4d] to-[#1e40af] dark:from-blue-400 dark:to-blue-600 shadow-[0_2px_8px_rgba(30,58,138,0.55)]"
                        : "w-2 bg-slate-300 dark:bg-white/20 group-hover:bg-blue-300 dark:group-hover:bg-blue-400/60"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyframes de animación */}
      <style>{`
        @keyframes rpc-slide-right {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes rpc-slide-left {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="rpc-slide"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}