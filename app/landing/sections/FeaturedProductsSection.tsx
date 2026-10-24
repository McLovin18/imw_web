"use client";

import React from "react";
import Link from "next/link";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";
import ProductoCard from "../../components/ProductoCard";
import { themeManager } from "../../components/themeManager";

export type FeaturedProductsSectionProps = {
  title?: string;
  products?: any[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "mobile" | "desktop";
  loading?: boolean;
};

const MAX_PRODUCTS = 10;

// Extrae la fecha de creación de un producto en milisegundos,
// soportando Firestore Timestamp, Date, string ISO o number.
function getCreatedAtMillis(prod: any): number {
  const raw = prod?.createdAt ?? prod?.fechaCreacion ?? prod?.created_at ?? prod?.creadoEn;

  if (!raw) return 0;

  // Firestore Timestamp (tiene .seconds) o { _seconds }
  if (typeof raw === "object") {
    if (typeof raw.toMillis === "function") return raw.toMillis();
    if (typeof raw.seconds === "number") return raw.seconds * 1000;
    if (typeof raw._seconds === "number") return raw._seconds * 1000;
  }

  // Date, string ISO o number (epoch)
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function FeaturedProductsSection({
  title = "Productos recientes",
  products = [],
  styles,
  fieldStyles,
  loading = false,
}: FeaturedProductsSectionProps) {
  const [theme, setTheme] = React.useState("dark");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(4);
  const [isTransitioning, setIsTransitioning] = React.useState(true);
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    const checkTheme = () => {
      const currentTheme = themeManager.getTheme();
      setTheme(currentTheme);
    };
    checkTheme();
    const handler = () => checkTheme();
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  // Detectar tamaño de pantalla para ajustar visibleCount
  React.useEffect(() => {
    const updateVisibleCount = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      if (width < 768) {
        setVisibleCount(1); // Móvil
      } else if (width < 1024) {
        setVisibleCount(2); // Tablet
      } else {
        setVisibleCount(4); // Laptop/Desktop
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  React.useEffect(() => {
    if (titleRef.current) {
      const titleEl = titleRef.current;
      titleEl.style.color = theme === "light" ? "#0f172a" : "var(--text)";
    }
  }, [theme]);

  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "0.5rem");

  // Filtra productos válidos, ordena por fecha de creación (más nuevo primero) y limita a MAX_PRODUCTS
  const recentProducts = React.useMemo(() => {
    return products
      .filter((prod: any) => prod && prod.id)
      .sort((a: any, b: any) => getCreatedAtMillis(b) - getCreatedAtMillis(a))
      .slice(0, MAX_PRODUCTS);
  }, [products]);

  // Crear array extendido para carousel infinito (copia al principio y al final)
  const extendedProducts = React.useMemo(() => {
    if (recentProducts.length === 0) return [];
    return [
      ...recentProducts.slice(-visibleCount),
      ...recentProducts,
      ...recentProducts.slice(0, visibleCount)
    ];
  }, [recentProducts, visibleCount]);

  const maxIndex = extendedProducts.length - visibleCount;

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < visibleCount) {
        // Llegó al inicio, saltar al final
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(maxIndex - visibleCount);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 500);
      }
      return newIndex;
    });
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex > maxIndex - visibleCount) {
        // Llegó al final, saltar al inicio
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(visibleCount);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 500);
      }
      return newIndex;
    });
  };

  // Auto-play cada 5 segundos
  React.useEffect(() => {
    if (recentProducts.length <= visibleCount) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex - visibleCount) {
          return visibleCount;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [recentProducts.length, maxIndex, visibleCount]);

  // Resetear currentIndex cuando cambia visibleCount
  React.useEffect(() => {
    setCurrentIndex(visibleCount);
    setIsTransitioning(true);
  }, [visibleCount]);

  // ── Return condicional DESPUÉS de todos los hooks ──
  if (loading) {
    // Mostrar skeleton mientras carga
    return (
      <section
        style={{
          paddingTop,
          paddingBottom,
          background: "var(--bg)"
        }}
        className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
      >
        {/* Título skeleton */}
        {title && (
          <div
            className="section-title text-center py-2"
            style={{ height: "40px", width: "200px", margin: "0 auto" }}
          >
            <div
              className="animate-pulse rounded"
              style={{
                height: "100%",
                width: "100%",
                background: "var(--bgSecondary)"
              }}
            />
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-12">
          {/* Skeleton grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bgSecondary)" }}
              >
                <div
                  className="animate-pulse"
                  style={{
                    aspectRatio: "1",
                    background: "var(--bg)",
                    margin: "8px",
                    borderRadius: "16px"
                  }}
                />
                <div className="p-4 space-y-3">
                  <div
                    className="animate-pulse rounded"
                    style={{
                      height: "20px",
                      width: "80%",
                      background: "var(--bg)"
                    }}
                  />
                  <div
                    className="animate-pulse rounded"
                    style={{
                      height: "16px",
                      width: "60%",
                      background: "var(--bg)"
                    }}
                  />
                  <div
                    className="animate-pulse rounded"
                    style={{
                      height: "24px",
                      width: "40%",
                      background: "var(--bg)",
                      marginTop: "12px"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recentProducts.length) return null;

  return (
    <section
      style={{
        paddingTop,
        paddingBottom,
        background: "var(--bg)"
      }}
      className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
    >
      {/* Título */}
      {title && (
        <h2
          ref={titleRef}
          className="section-title text-center py-2"
          style={fieldStyles?.title || { color: "var(--text)" }}
        >
          {title}
        </h2>
      )}

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-12">
        {/* ── Carousel con 2 productos visibles ── */}
        <div className="relative">
          {/* Contenedor del carousel */}
          <div className="overflow-hidden">
            <div
              className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              }}
            >
              {extendedProducts.map((prod: any, idx: number) => (
                <div
                  key={`${prod.id}-${idx}`}
                  className="flex-shrink-0 px-1"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <div className="transition-all duration-300 flex flex-col items-stretch justify-stretch h-full scale-90 origin-top">
                    <ProductoCard producto={prod} index={idx % recentProducts.length} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controles de navegación */}
          {recentProducts.length > visibleCount && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                <span className="material-icons-round text-xl">chevron_left</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                <span className="material-icons-round text-xl">chevron_right</span>
              </button>
            </>
          )}

          {/* Indicadores */}
          {recentProducts.length > visibleCount && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: currentIndex === idx ? "var(--primary)" : "var(--border)",
                    width: currentIndex === idx ? "24px" : "8px"
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}