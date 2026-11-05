import admin from "./firebase-admin";

interface Product {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  precio?: number;
  precioPromocional?: number;
  categoria?: string;
  subcategoria?: string;
  imagenes?: string[];
  imagen?: string;
  [key: string]: any;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  imagenes?: string[];
  coverImage?: string;
  [key: string]: any;
}

/**
 * Server-side helper to get product by slug for metadata generation
 */
export async function getProductBySlugServer(slug: string): Promise<Product | null> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("productos")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Product;
  } catch (error) {
    console.error("Error getting product by slug (server):", error);
    return null;
  }
}

/**
 * Server-side helper to get blog by slug for metadata generation
 */
export async function getBlogBySlugServer(slug: string): Promise<Blog | null> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("blogs")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Blog;
  } catch (error) {
    console.error("Error getting blog by slug (server):", error);
    return null;
  }
}
