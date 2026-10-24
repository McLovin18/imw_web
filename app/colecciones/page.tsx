"use client";

import { useState, useEffect } from "react";
import { obtenerBodegas, type Bodega } from "../lib/bodegas-db";
import BottomBarPublic from "../components/BottomBarPublic";
import { Loading3DIcon } from "../components/Loading3DIcon";
import { useRouter } from "next/navigation";

export default function ColeccionesPage() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchBodegas() {
      try {
        const data = await obtenerBodegas();
        // Filtrar la bodega default (MarcaEstilo) si no se quiere mostrar
        const filtered = data.filter(b => b.id !== "MarcaEstilo");
        setBodegas(filtered);
      } catch (error) {
        console.error("Error cargando bodegas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBodegas();
  }, []);

  const handleCollectionClick = (bodegaId: string) => {
    router.push(`/productos?bodega=${bodegaId}`);
  };

  // Imágenes por defecto para colecciones (pueden personalizarse después)
  const getCollectionImage = (bodega: Bodega) => {
    // Aquí se podría agregar lógica para obtener imágenes específicas por bodega
    // Por ahora, usamos imágenes placeholder basadas en el nombre
    const images = [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
    ];
    const index = bodegas.indexOf(bodega) % images.length;
    return images[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loading3DIcon />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Hero Section */}
        <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=1920&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center">
              Colecciones
            </h1>
            <p className="text-lg md:text-xl text-center max-w-2xl opacity-90">
              Descubre nuestras colecciones exclusivas de perfumes
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {bodegas.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl" style={{ color: "var(--textSecondary)" }}>
                No hay colecciones disponibles en este momento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {bodegas.map((bodega) => (
                <button
                  key={bodega.id}
                  onClick={() => handleCollectionClick(bodega.id)}
                  className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="aspect-[4/5] relative">
                    <img
                      src={getCollectionImage(bodega)}
                      alt={bodega.nombre}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {bodega.nombre}
                      </h3>
                      {bodega.tiempoEntrega && (
                        <p className="text-white/80 text-sm flex items-center gap-2">
                          <span className="material-icons-round text-base">schedule</span>
                          Entrega en {bodega.tiempoEntrega} horas
                        </p>
                      )}
                      {bodega.esNuevaColeccion && (
                        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                          <span className="material-icons-round text-sm text-yellow-300">star</span>
                          <span className="text-white text-xs font-semibold">Nueva</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomBarPublic />
    </>
  );
}
