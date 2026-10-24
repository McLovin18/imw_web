"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";

export type FeaturedCollectionItem = {
  bodegaId?: string;
  title?: string;
  image?: string | null;
  link?: string;
};

export type FeaturedCollectionsSectionProps = {
  title?: string;
  items?: FeaturedCollectionItem[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "desktop" | "mobile";
  loading?: boolean;
};

/**
 * Ancho de cada card (gap-4 = 1rem):
 *  - móvil  (<640px)   → 1 card
 *  - tablet (≥640px)   → 2 cards
 *  - laptop (≥1024px)  → 3 cards
 */
const CARD_BASIS =
  "basis-full sm:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]";

const HIDE_SCROLLBAR =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Cada cuántos ms avanza el carrusel solo */
const AUTOPLAY_MS = 5000;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="8 7 17 7 17 16" />
    </svg>
  );
}

export default function FeaturedCollectionsSection({
  title,
  items,
  styles,
  fieldStyles,
  loading = false,
}: FeaturedCollectionsSectionProps) {
  const bg = styles?.backgroundColor;
  const color = styles?.textColor;

  const collections = (items || []).filter(
    (c) => c && (c.title || c.image || c.link)
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateEdges)
        : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener("scroll", updateEdges);
      ro?.disconnect();
    };
  }, [updateEdges, collections.length, loading]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;

    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 16;
    const step = first ? first.offsetWidth + gap : el.clientWidth;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    el.scrollBy({
      left: direction * step,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, []);

  /* ───────────── Autoplay ─────────────
   * - Avanza una card cada AUTOPLAY_MS y vuelve al inicio al llegar al final.
   * - Se pausa con hover, foco (teclado) y mientras se toca el carrusel.
   * - Tras cualquier interacción manual espera un ciclo completo antes de seguir.
   * - No corre si la pestaña está oculta o si el usuario prefiere menos movimiento.
   */
  const pausedRef = useRef(false);
  const lastInteractionRef = useRef(0);

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const handleArrow = (direction: 1 | -1) => {
    markInteraction();
    scrollByCard(direction);
  };

  useEffect(() => {
    if (loading || collections.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el || pausedRef.current || document.hidden) return;
      if (Date.now() - lastInteractionRef.current < AUTOPLAY_MS) return;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [loading, collections.length, scrollByCard]);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: bg || "var(--bg)",
    ...(color ? { color } : {}),
    ...(styles?.paddingTop ? { paddingTop: styles.paddingTop } : {}),
    ...(styles?.paddingBottom ? { paddingBottom: styles.paddingBottom } : {}),
  };
  const sectionClass = "px-4 sm:px-6 lg:px-8 py-6 md:py-10 m-0";

  /* ───────────── Skeleton ───────────── */
  if (loading) {
    return (
      <section style={sectionStyle} className={sectionClass}>
        <div className="max-w-6xl mx-auto text-[var(--text)]">
          {title && (
            <div
              className="mx-auto mb-6 md:mb-8 h-9 w-52 animate-pulse rounded-lg"
              style={{ background: "var(--bgSecondary, var(--muted))" }}
            />
          )}
          <div className={`flex gap-4 overflow-hidden`}>
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`${CARD_BASIS} shrink-0 aspect-[4/5] animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--muted)] ${
                  idx > 1 ? "hidden sm:block" : ""
                } ${idx > 2 ? "sm:hidden lg:block" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!collections.length && !title) return null;

  const showArrows = canPrev || canNext;

  return (
    <section style={sectionStyle} className={sectionClass}>
      <div className="max-w-6xl mx-auto text-[var(--text)]">
        {title && (
          <h2
            className="section-title mb-6 md:mb-8 text-center dark:text-white"
            style={fieldStyles?.title?.color ? fieldStyles.title : undefined}
          >
            {title}
          </h2>
        )}

        {collections.length > 0 && (
          <div
            className="relative"
            onMouseEnter={() => {
              pausedRef.current = true;
            }}
            onMouseLeave={() => {
              pausedRef.current = false;
            }}
            onFocus={() => {
              pausedRef.current = true;
            }}
            onBlur={() => {
              pausedRef.current = false;
            }}
            onTouchStart={() => {
              pausedRef.current = true;
              markInteraction();
            }}
            onTouchEnd={() => {
              pausedRef.current = false;
              markInteraction();
            }}
            onWheel={markInteraction}
          >
            {/* Flecha anterior */}
            <button
              type="button"
              onClick={() => handleArrow(-1)}
              disabled={!canPrev}
              aria-label="Colecciones anteriores"
              className={`absolute left-2 sm:-left-3 lg:-left-5 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-lg transition-all duration-200 hover:border-[var(--primary)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                showArrows
                  ? canPrev
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                  : "hidden"
              }`}
            >
              <ChevronIcon direction="left" />
            </button>

            {/* Flecha siguiente */}
            <button
              type="button"
              onClick={() => handleArrow(1)}
              disabled={!canNext}
              aria-label="Colecciones siguientes"
              className={`absolute right-2 sm:-right-3 lg:-right-5 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-lg transition-all duration-200 hover:border-[var(--primary)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                showArrows
                  ? canNext
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                  : "hidden"
              }`}
            >
              <ChevronIcon direction="right" />
            </button>

            {/* Pista del carrusel: una sola fila */}
            <div
              ref={scrollerRef}
              role="region"
              aria-roledescription="carrusel"
              aria-label={title || "Colecciones destacadas"}
              className={`flex flex-nowrap gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory overscroll-x-contain ${HIDE_SCROLLBAR}`}
            >
              {collections.map((collection, idx) => (
                <a
                  key={collection.bodegaId || `${collection.title}-${idx}`}
                  href={collection.link || "#"}
                  className={`group relative ${CARD_BASIS} shrink-0 snap-start aspect-[4/5] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]`}
                >
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.title || "Colección"}
                      loading="lazy"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "var(--muted)" }}
                    />
                  )}

                  {/* Degradado para legibilidad del título */}
                  {collection.image && (
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))",
                      }}
                    />
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
                    {collection.title && (
                      <h3
                        className="section-subtitle page-lead text-left text-lg md:text-xl font-semibold leading-tight"
                        style={
                          fieldStyles?.itemTitle ||
                          (collection.image
                            ? { color: "#ffffff" }
                            : { color: "var(--text, #584738)" })
                        }
                      >
                        {collection.title}
                      </h3>
                    )}

                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-black transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:text-white group-hover:rotate-12"
                      aria-hidden="true"
                    >
                      <ArrowUpRightIcon />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}