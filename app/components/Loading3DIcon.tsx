"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { themeManager } from "./themeManager";

/* Logo según el tema (ajusta los nombres si tus archivos se llaman distinto) */
const LOGO_LIGHT = "/imw_light.png"; // se muestra con el tema claro
const LOGO_DARK = "/imw-dark.png"; // se muestra con el tema oscuro

/**
 * Loading de marca.
 * - Autocontenido: los keyframes viven en este archivo, ya no dependen de
 *   balde-spin / balde-shadow / animate-loadingSteps del CSS global.
 * - Se adapta al tema con --text, --textSecondary y --accent (con fallbacks).
 * - Respeta prefers-reduced-motion.
 */
export function Loading3DIcon() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const checkTheme = () => setTheme(themeManager.getTheme());
    checkTheme();
    window.addEventListener("theme-changed", checkTheme);
    return () => window.removeEventListener("theme-changed", checkTheme);
  }, []);

  const logoSrc = theme === "light" ? LOGO_LIGHT : LOGO_DARK;

  return (
    <div
      className="imwl-root"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="imwl-stage">
        {/* Resplandor de fondo */}
        <div className="imwl-glow" aria-hidden="true" />

        {/* Anillo base */}
        <div className="imwl-ring-base" aria-hidden="true" />

        {/* Anillo animado con degradado */}
        <div className="imwl-ring-spin" aria-hidden="true" />

        {/* Anillo interior que gira al revés */}
        <div className="imwl-ring-inner" aria-hidden="true" />

        {/* Logo flotando con giro 3D suave */}
        <div className="imwl-logo">
          <Image
            src={logoSrc}
            alt="IMW - In My Wardrobe"
            fill
            sizes="96px"
            className="imwl-logo-img"
            priority
          />
        </div>

        {/* Sombra de contacto que respira con la flotación */}
        <div className="imwl-shadow" aria-hidden="true" />
      </div>

      {/* Texto */}
      <div className="imwl-copy">
        <span className="imwl-brand">IMW</span>
        <span className="imwl-label">Cargando</span>
        <div className="imwl-bar" aria-hidden="true">
          <span className="imwl-bar-fill" />
        </div>
      </div>

      <style>{`
        .imwl-root {
          --imwl-text: var(--text, #111111);
          --imwl-muted: var(--textSecondary, #6b7280);
          --imwl-accent: var(--accent, #d9b97a);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          user-select: none;
        }

        .imwl-stage {
          position: relative;
          width: 176px;
          height: 176px;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 900px;
        }

        /* ---------- Glow ---------- */
        .imwl-glow {
          position: absolute;
          inset: 14px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--imwl-accent) 38%, transparent) 0%,
            transparent 70%
          );
          filter: blur(22px);
          animation: imwl-breathe 3s ease-in-out infinite;
        }

        /* ---------- Anillos ---------- */
        .imwl-ring-base {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--imwl-text) 14%, transparent);
        }

        .imwl-ring-spin,
        .imwl-ring-inner {
          position: absolute;
          border-radius: 50%;
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
        }

        .imwl-ring-spin {
          inset: 8px;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 150deg,
            var(--imwl-accent) 340deg,
            var(--imwl-text) 360deg
          );
          animation: imwl-spin 2.4s linear infinite;
        }

        .imwl-ring-inner {
          inset: 22px;
          opacity: 0.55;
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
                  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          background: conic-gradient(
            from 180deg,
            transparent 0deg,
            transparent 220deg,
            var(--imwl-accent) 360deg
          );
          animation: imwl-spin 4.2s linear infinite reverse;
        }

        /* ---------- Logo ---------- */
        .imwl-logo {
          position: relative;
          width: 96px;
          height: 96px;
          transform-style: preserve-3d;
          animation: imwl-float 3.2s ease-in-out infinite;
        }

        .imwl-logo-img {
          object-fit: contain;
          filter: drop-shadow(0 14px 16px rgba(0, 0, 0, 0.28));
        }

        .imwl-shadow {
          position: absolute;
          bottom: 4px;
          width: 72px;
          height: 10px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.28);
          filter: blur(8px);
          animation: imwl-shadow 3.2s ease-in-out infinite;
        }

        /* ---------- Texto ---------- */
        .imwl-copy {
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .imwl-brand {
          font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
          font-size: 1.6rem;
          font-weight: 600;
          letter-spacing: 0.32em;
          padding-left: 0.32em; /* compensa el letter-spacing para centrar */
          line-height: 1;
          color: var(--imwl-text);
        }

        .imwl-label {
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          color: var(--imwl-muted);
        }

        .imwl-bar {
          position: relative;
          width: 108px;
          height: 2px;
          margin-top: 8px;
          overflow: hidden;
          border-radius: 2px;
          background: color-mix(in srgb, var(--imwl-text) 12%, transparent);
        }

        .imwl-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 42%;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--imwl-accent), transparent);
          animation: imwl-slide 1.5s ease-in-out infinite;
        }

        /* ---------- Keyframes ---------- */
        @keyframes imwl-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes imwl-float {
          0%, 100% { transform: translateY(-4px) rotateY(-16deg) rotateX(3deg); }
          50%      { transform: translateY(5px)  rotateY(16deg)  rotateX(-3deg); }
        }

        @keyframes imwl-shadow {
          0%, 100% { transform: scaleX(0.82); opacity: 0.55; }
          50%      { transform: scaleX(1.05); opacity: 0.9; }
        }

        @keyframes imwl-breathe {
          0%, 100% { opacity: 0.55; transform: scale(0.95); }
          50%      { opacity: 1;    transform: scale(1.05); }
        }

        @keyframes imwl-slide {
          0%   { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .imwl-ring-spin,
          .imwl-ring-inner,
          .imwl-logo,
          .imwl-shadow,
          .imwl-glow,
          .imwl-bar-fill {
            animation-duration: 0.01ms;
            animation-iteration-count: 1;
          }
          .imwl-bar-fill { transform: translateX(80%); }
        }
      `}</style>
    </div>
  );
}