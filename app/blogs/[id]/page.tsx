"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogById } from "../../lib/blogs-db";
import { Loading3DIcon } from "../../components/Loading3DIcon";

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    async function redirect() {
      if (!params?.id) return;

      try {
        const blog = await getBlogById(params.id as string);
        if (blog?.slug) {
          // Redirección 301 (permanente) a la nueva URL con slug
          router.replace(`/${blog.slug}`);
        }
      } catch (error) {
        console.error("Error redirecting blog:", error);
      }
    }

    redirect();
  }, [params?.id, router]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center mt-2">
      <Loading3DIcon />
      <span className="mt-4 text-white/40 text-sm">Redirigiendo...</span>
    </div>
  );
}
