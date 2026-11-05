"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { obtenerProductoPorId } from "../lib/productos-db";
import { Loading3DIcon } from "../components/Loading3DIcon";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id || searchParams.get("id");

  useEffect(() => {
    async function redirect() {
      if (!id) return;

      try {
        const producto = await obtenerProductoPorId(id);
        if (producto?.slug) {
          // Redirección 301 (permanente) a la nueva URL con slug
          router.replace(`/${producto.slug}`);
        }
      } catch (error) {
        console.error("Error redirecting product:", error);
      }
    }

    redirect();
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center mt-2">
      <Loading3DIcon />
      <span className="mt-4 text-sm" style={{ color: "var(--textSecondary)" }}>Redirigiendo...</span>
    </div>
  );
}
