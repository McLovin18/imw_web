"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTracking } from "../lib/useAnalytics";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";
import styles from "./Footer.module.css";
import { themeManager } from "./themeManager";

/* ---------------- Iconos ---------------- */

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const IconWhatsApp = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.908 7.593c-1.747 0-3.48-.53-4.942-1.49L7.793 24.41l1.132-3.337a8.955 8.955 0 0 1-1.72-5.272c0-4.955 4.04-8.995 8.997-8.995S25.2 10.845 25.2 15.8c0 4.958-4.04 8.998-8.998 8.998zm0-19.798c-5.96 0-10.8 4.842-10.8 10.8 0 1.964.53 3.898 1.546 5.574L5 27.176l5.974-1.92a10.807 10.807 0 0 0 16.03-9.455c0-5.958-4.842-10.8-10.802-10.8z" />
  </svg>
);

const IconTikTok = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48.04 2.96.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.23 1.61-.24 1.46.31 2.92 1.56 3.73 2.88.31.48.56 1.01.76 1.58.08.13.19.13.28.03 1.08-1.13 2.69-1.6 4.3-1.31.64.12 1.26.34 1.85.61.15.07.32.11.49.13z" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const IconStore = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </svg>
);

/* Iconos de la franja de confianza */

const IconShield = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconPlane = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.5 13.5L3 11l1.5-1.5 9 .5 4-4a1.8 1.8 0 0 1 2.5 2.5l-4 4 .5 9L19.5 19l-2.5-7.5" transform="translate(-1 -1) scale(1.05)" />
  </svg>
);

const IconTruck = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h11v10H3z" />
    <path d="M14 10h4l3 3v3h-7" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </svg>
);

/* ---------------- Datos del negocio ---------------- */

const WHATSAPP_NUMBER = "593968514889"; // solo números, con código de país, sin '+' ni espacios
const WHATSAPP_DISPLAY = "0968514889"; // como se muestra al usuario
const EMAIL = "imw_ec@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/imw_ec/";
const FACEBOOK_URL = "https://www.facebook.com/imwec/";
const TIKTOK_URL = "https://www.tiktok.com/@imw2026";
const DEV_INSTAGRAM_URL = "https://www.instagram.com/hector.cobena/";

const socialLinks = [
  { href: INSTAGRAM_URL, label: "Instagram", Icon: IconInstagram },
  { href: FACEBOOK_URL, label: "Facebook", Icon: IconFacebook },
  { href: TIKTOK_URL, label: "TikTok", Icon: IconTikTok },
];

const helpLinks = [
  { href: "/productos", label: "Catálogo de productos" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contactanos", label: "Contacto" },
];

const policyLinks = [
  { href: "/politicas/privacidad", label: "Política de privacidad" },
  { href: "/politicas/terminos-y-condiciones", label: "Términos y condiciones" },
  { href: "/politicas/politicasEnvio", label: "Política de envíos" },
];

const trustItems = [
  { Icon: IconShield, title: "Perfumes originales", text: "Autenticidad garantizada" },
  { Icon: IconPlane, title: "Importados desde USA", text: "Directo a Ecuador" },
  { Icon: IconTruck, title: "Envíos por Servientrega", text: "A todo el país" },
  { Icon: () => <IconWhatsApp size={22} />, title: "Atención por WhatsApp", text: "Te asesoramos al instante" },
];

/* ---------------- Componente ---------------- */

const Footer: React.FC = () => {
  const pathname = usePathname();
  const { trackLinkClick } = useTracking();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const checkTheme = () => setTheme(themeManager.getTheme());
    checkTheme();
    const handler = () => checkTheme();
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const showWhatsAppFloating = pathname && !pathname.startsWith("/admin");
  const track = () => trackLinkClick().catch(console.error);

  return (
    <>
      <footer className={styles.ftRoot} data-theme={theme === "light" ? "light" : "dark"}>
        <div className={styles.ftTopLine} aria-hidden="true" />
        <div className={styles.ftGlowLeft} aria-hidden="true" />
        <div className={styles.ftGlowRight} aria-hidden="true" />

        <div className={styles.ftContainer}>
          {/* Franja de confianza */}
          <ul className={styles.ftTrust}>
            {trustItems.map(({ Icon, title, text }) => (
              <li key={title} className={styles.ftTrustItem}>
                <span className={styles.ftTrustIcon}>
                  <Icon />
                </span>
                <span className={styles.ftTrustCopy}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Cuerpo principal */}
          <div className={styles.ftMain}>
            {/* Marca */}
            <div className={styles.ftIntro}>
              <h2 className={styles.ftBrand}>
                IMW
                <span className={styles.ftBrandSub}>In My Wardrobe</span>
              </h2>
              <p className={styles.ftIntroText}>
                Perfumes originales importados desde USA, con envío seguro a todo
                Ecuador. Encuentra tu fragancia ideal sin salir de casa.
              </p>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className={styles.ftCta}
                onClick={track}
              >
                <IconWhatsApp size={18} />
                Escríbenos por WhatsApp
              </a>

              <ul className={styles.ftSocials}>
                {socialLinks.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className={styles.ftSocialsLink}
                      target="_blank"
                      rel="noreferrer"
                      title={label}
                      aria-label={label}
                      onClick={track}
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explora */}
            <nav className={styles.ftCol} aria-label="Explora">
              <h3 className={styles.ftColTitle}>Explora</h3>
              <ul className={styles.ftList}>
                {helpLinks.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className={styles.ftLink} onClick={track}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Políticas */}
            <nav className={styles.ftCol} aria-label="Políticas">
              <h3 className={styles.ftColTitle}>Políticas</h3>
              <ul className={styles.ftList}>
                {policyLinks.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className={styles.ftLink} onClick={track}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contacto */}
            <div className={styles.ftCol}>
              <h3 className={styles.ftColTitle}>Contáctanos</h3>
              <ul className={styles.ftContactList}>
                <li>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.ftContactItem}
                    onClick={track}
                  >
                    <span className={styles.ftContactIcon}>
                      <IconWhatsApp size={16} />
                    </span>
                    <span>{WHATSAPP_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`} className={styles.ftContactItem} onClick={track}>
                    <span className={styles.ftContactIcon}>
                      <IconMail />
                    </span>
                    <span>{EMAIL}</span>
                  </a>
                </li>
                <li>
                  <span className={styles.ftContactItem}>
                    <span className={styles.ftContactIcon}>
                      <IconStore />
                    </span>
                    <span>Tienda 100% online, sin local físico</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.ftDivider} />

          {/* Copyright + créditos */}
          <div className={styles.ftCopyRow}>
            <p className={styles.ftCopyText}>
              © {new Date().getFullYear()} IMW - In My Wardrobe. Todos los derechos reservados.
            </p>
            <div className={styles.ftCopyRight}>
              <div className={styles.ftBadge}>
                <span className={styles.ftBadgeDot} />
                Envíos a todo el país
              </div>
              <a
                href={DEV_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className={styles.ftDevLink}
                onClick={track}
              >
                Desarrollado por Héctor Cobeña
              </a>
            </div>
          </div>
        </div>

      </footer>

      {showWhatsAppFloating && (
        <WhatsAppFloatingButton
          phoneNumber={WHATSAPP_NUMBER}
          message="Hola, quiero información sobre IMW - In My Wardrobe"
        />
      )}
    </>
  );
};

export default Footer;