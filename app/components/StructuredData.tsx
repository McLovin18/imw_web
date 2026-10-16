/**
 * Componente para agregar estructuras de datos JSON-LD (Schema.org)
 * Esto ayuda a Google a entender mejor tu sitio
 */

export function StructuredData() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imw_ec.com";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "IMW - In My Wardrobe",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Tienda online de perfumes originales importados desde USA",
    sameAs: [
      "https://www.instagram.com/imw_ec/",
      "https://www.facebook.com/imw_ec",
      "https://www.tiktok.com/@imw_ec",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "EC",
      addressLocality: "Guayaquil",
      postalCode: "090XXX",
      streetAddress: "Tu dirección aquí",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      telephone: "+593-968-514-889",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "IMW - In My Wardrobe",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products-by-category?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "IMW - In My Wardrobe",
    image: `${SITE_URL}/logo.png`,
    description:
      "Tienda online de perfumes originales importados desde USA con envíos a todo Ecuador",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tu dirección aquí",
      addressLocality: "Guayaquil",
      addressRegion: "Guayas",
      postalCode: "090XXX",
      addressCountry: "EC",
    },
    telephone: "+593-968-514-889",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    areaServed: "EC",
    priceRange: "$$",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
    </>
  );
}

