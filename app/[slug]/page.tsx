import { getProductBySlugServer, getBlogBySlugServer } from "../lib/metadata-helpers";
import type { Metadata } from "next";
import SlugPageClient from "./SlugPageClient";

// Metadata generation for SEO (server-side)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imwec.com";
  const { slug } = await params;

  try {
    // Try to find a product first
    const product = await getProductBySlugServer(slug);
    if (product) {
      const firstImage = product.imagenes?.[0] || product.imagen;
      const description = product.descripcion || product.nombre;

      // Calculate price for SEO description
      const price = Number(product.precio || 0);
      const promoPrice = Number(product.precioPromocional || 0);
      const hasPromo = promoPrice > 0 && promoPrice < price;

      let priceText = `Precio: $${price.toFixed(2)}`;
      if (hasPromo) {
        priceText = `Precio: $${price.toFixed(2)} - Oferta: $${promoPrice.toFixed(2)}`;
      }

      const seoDescription = `${description.substring(0, 100)}. ${priceText}. Perfumes originales importados desde USA con envíos a Ecuador.`;

      return {
        title: `${product.nombre} | IMW - Perfumes originales`,
        description: seoDescription.substring(0, 160),
        keywords: [
          product.nombre,
          "Perfumes originales",
          "Perfumes importados",
          "Perfumes USA",
          "IMW",
          product.categoria || "",
          product.subcategoria || "",
          `Perfumes $${price.toFixed(2)}`,
        ].filter(Boolean),
        openGraph: {
          title: product.nombre,
          description: seoDescription.substring(0, 160),
          type: "website",
          locale: "es_EC",
          url: `${SITE_URL}/${product.slug}`,
          siteName: "IMW - In My Wardrobe",
          images: [
            {
              url: firstImage,
              width: 1200,
              height: 1200,
              alt: product.nombre,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: product.nombre,
          description: seoDescription.substring(0, 160),
          images: [firstImage],
        },
      };
    }

    // If no product, try to find a blog
    const blog = await getBlogBySlugServer(slug);
    if (blog) {
      const firstImage = blog.imagenes?.[0] || blog.coverImage;
      const description = blog.excerpt || blog.content?.substring(0, 160) || blog.title;

      return {
        title: `${blog.title} | IMW Blog`,
        description: description.substring(0, 160),
        keywords: [
          blog.title,
          "Blog IMW",
          "Perfumes",
          "Tips de perfumes",
          "Decants",
        ],
        openGraph: {
          title: blog.title,
          description: description.substring(0, 160),
          type: "article",
          locale: "es_EC",
          url: `${SITE_URL}/${blog.slug}`,
          siteName: "IMW - In My Wardrobe",
          images: firstImage ? [
            {
              url: firstImage,
              width: 1200,
              height: 630,
              alt: blog.title,
            },
          ] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: blog.title,
          description: description.substring(0, 160),
          images: firstImage ? [firstImage] : [],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  // Fallback metadata
  return {
    title: "IMW - In My Wardrobe",
    description: "Tienda online de perfumes originales importados desde USA",
  };
}

export default function SlugPage() {
  return <SlugPageClient />;
}
