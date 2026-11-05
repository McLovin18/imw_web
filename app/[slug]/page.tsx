"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { obtenerProductoPorSlug, obtenerProductosPorCategoria, obtenerProductosPorSubcategoria, obtenerProductosPorSubsubcategoria } from "../lib/productos-db";
import { obtenerAtributos } from "../lib/atributos-db";
import { getBlogBySlug } from "../lib/blogs-db";
import type { Producto } from "../lib/productos-db";
import type { Blog } from "../lib/blog-types";
import { Loading3DIcon } from "../components/Loading3DIcon";
import ProductoCard from "../components/ProductoCard";
import RelatedProductsCarousel from "../components/RelatedProductsCarousel";
import VariationsManager from "../components/VariationsManager";
import BlogPreview from "../blogs/BlogPreview";
import BottomBarPublic from "../components/BottomBarPublic";
import dynamic from "next/dynamic";
import { getCartItemKey } from "../context/userLocalStorage";
import { getCatalogPricing } from "../lib/pricing";
import { ProductReview } from "../lib/reviews-types";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";

const Markdown = dynamic(() => import("../components/Markdown"), { ssr: false });

export default function SlugPage() {
  const params = useParams<{ slug: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contentType, setContentType] = useState<'product' | 'blog' | null>(null);

  // Product state
  const [relacionados, setRelacionados] = useState([]);
  const [imgIdx, setImgIdx] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [activeTab, setActiveTab] = useState<"caracteristicas" | "resenas" | null>("caracteristicas");
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [currentStock, setCurrentStock] = useState(0);
  const [atributos, setAtributos] = useState<Record<string, string>>({});
  const [personalizacionValues, setPersonalizacionValues] = useState<Record<string, string>>({});

  const {
    isLogged, user, isAdmin,
    favoritos, addFavorito, removeFavorito,
    carrito, addCarrito, removeCarrito,
  } = useUser();

  const { showToast } = useToast();

  useEffect(() => {
    async function loadContent() {
      if (!params?.slug) return;
      setLoading(true);

      try {
        // Try to find a product first
        const prod = await obtenerProductoPorSlug(params.slug);
        if (prod) {
          setProducto(prod);
          setContentType('product');
          setLoading(false);
          return;
        }

        // If no product, try to find a blog
        const blogData = await getBlogBySlug(params.slug);
        if (blogData) {
          setBlog(blogData);
          setContentType('blog');
          setLoading(false);
          return;
        }

        // If neither found, show 404
        setNotFound(true);
        setLoading(false);
      } catch (error) {
        console.error("Error loading content:", error);
        setNotFound(true);
        setLoading(false);
      }
    }

    loadContent();
  }, [params?.slug]);

  // Load related products when producto is loaded
  useEffect(() => {
    async function fetchRelacionados() {
      if (!producto) return;

      let rel = [];
      if (producto.subsubcategoria) {
        rel = await obtenerProductosPorSubsubcategoria(producto.subsubcategoria, producto.subcategoria, producto.categoria, producto.id, 10);
      }
      if ((!rel || rel.length === 0) && producto.subcategoria) {
        rel = await obtenerProductosPorSubcategoria(producto.subcategoria, producto.categoria, producto.id, 10);
      }
      if ((!rel || rel.length === 0) && producto.categoria) {
        rel = await obtenerProductosPorCategoria(producto.categoria, producto.id, 10);
      }
      setRelacionados(rel);
    }

    fetchRelacionados();
  }, [producto]);

  // Load attributes
  useEffect(() => {
    obtenerAtributos()
      .then((attrs) => {
        const mapping: Record<string, string> = {};
        attrs.forEach((attr: any) => {
          mapping[attr.id] = attr.nombre;
        });
        setAtributos(mapping);
      })
      .catch((err) => console.error("Error cargando atributos:", err));
  }, []);

  // Load reviews
  useEffect(() => {
    async function fetchReviews() {
      if (!producto) return;
      try {
        const res = await fetch(`/api/reviews?productId=${producto.id}`, { cache: 'no-store' });
        if (res.ok) setReviews(await res.json());
      } catch {}
    }
    fetchReviews();
  }, [producto]);

  // Auto-activate reviews tab if no characteristics
  useEffect(() => {
    if (producto && !producto.caracteristicas?.length) {
      setActiveTab("resenas");
    }
  }, [producto]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center mt-2">
        <Loading3DIcon />
        <span className="mt-4 text-sm" style={{ color: "var(--textSecondary)" }}>Cargando...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center mt-2 gap-3">
        <span className="material-icons-round text-5xl" style={{ color: "var(--textSecondary)", opacity: 0.3 }}>error_outline</span>
        <p className="font-medium" style={{ color: "var(--textSecondary)" }}>Página no encontrada</p>
      </div>
    );
  }

  // If it's a blog, render the blog preview
  if (contentType === 'blog' && blog) {
    return (
      <div
        style={{
          background: "var(--bg)",
          color: "var(--text)",
        }}
        className="min-h-screen flex flex-col"
      >
        <BottomBarPublic />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-6 flex-1 w-full">
          <BlogPreview blog={blog} device="desktop" />
        </main>
      </div>
    );
  }

  // If it's a product, render product detail
  if (contentType === 'product' && producto) {
    return <ProductDetailContent producto={producto} relacionados={relacionados} reviews={reviews} atributos={atributos} />;
  }

  return null;
}

// Separate component for product detail to avoid complexity
function ProductDetailContent({ producto, relacionados, reviews, atributos }: { producto: Producto; relacionados: any[]; reviews: ProductReview[]; atributos: Record<string, string> }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [activeTab, setActiveTab] = useState<"caracteristicas" | "resenas" | null>(producto.caracteristicas?.length ? "caracteristicas" : "resenas");
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [currentStock, setCurrentStock] = useState(0);
  const [personalizacionValues, setPersonalizacionValues] = useState<Record<string, string>>({});
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");

  const {
    isLogged, user, isAdmin,
    favoritos, addFavorito, removeFavorito,
    carrito, addCarrito, removeCarrito,
  } = useUser();

  const { showToast } = useToast();

  const hasVariations = producto?.hasVariations || producto?.isCamiseta || false;
  const variationAttributeIds = producto?.variationAttributeIds || [];
  const stockVariantsRaw = producto?.stockVariants || [];
  const stockVariants = Array.isArray(stockVariantsRaw)
    ? stockVariantsRaw
    : Object.values(stockVariantsRaw || {}).filter((v: any) => v && typeof v === 'object');

  const maxCantidad = hasVariations ? currentStock : (producto?.stock || 0);
  const isFav = favoritos?.some((p) => p.id === producto?.id);

  const generateCartKey = () => {
    if (!hasVariations) return producto.id;
    if (variationAttributeIds.length === 0) return producto.id;

    const allSelected = variationAttributeIds.every(attrId => selectedVariations[attrId]);
    if (!allSelected) return null;

    const values = variationAttributeIds.map(attrId => selectedVariations[attrId]).join(":");
    return `${producto.id}:${values}`;
  };

  const currentCartKey = generateCartKey();
  const inCart = currentCartKey ? carrito?.some((p) => getCartItemKey(p) === currentCartKey) : false;

  const basePrice = (() => {
    if (!hasVariations) return Number(producto.precio || 0);

    if (variationAttributeIds.length === 0) return Number(producto.precio || 0);

    const allSelected = variationAttributeIds.every(attrId => selectedVariations[attrId]);
    if (!allSelected) return Number(producto.precio || 0);

    const variants = Array.isArray(stockVariants) ? stockVariants : [];
    const matchingVariant = variants.find((variant) => {
      const attrs = variant.attributes || {};
      return variationAttributeIds.every(
        (attrId) => attrs[attrId] === selectedVariations[attrId]
      );
    });

    return matchingVariant?.precio ?? Number(producto.precio || 0);
  })();

  const variantPromoPrice = (() => {
    const stockVariants = Array.isArray(producto.stockVariants) ? producto.stockVariants : [];
    const matchingVariant = stockVariants.find((variant: any) => {
      const attrs = variant.attributes || {};
      return variationAttributeIds.every(
        (attrId) => attrs[attrId] === selectedVariations[attrId]
      );
    });

    return matchingVariant?.precioPromocional ?? Number(producto.precioPromocional || 0);
  })();

  const { discount, hasDiscount, fakeOldPrice, finalPrice } = getCatalogPricing({
    precio: basePrice,
    precioPromocional: variantPromoPrice > 0 && variantPromoPrice < basePrice ? variantPromoPrice : undefined,
    descuento: hasVariations && variationAttributeIds.length > 0 && variationAttributeIds.every(attrId => selectedVariations[attrId]) ? undefined : producto.descuento,
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
    : 0;

  const handleAddCart = () => {
    if (hasVariations && variationAttributeIds.length > 0) {
      const allSelected = variationAttributeIds.every(attrId => selectedVariations[attrId]);
      if (!allSelected) {
        showToast("Por favor selecciona todas las opciones", "error");
        return;
      }
    }

    if ((producto as any)?.personalizado && (producto as any)?.camposPersonalizacion) {
      const camposRequeridos = (producto as any).camposPersonalizacion;
      const camposFaltantes = camposRequeridos.filter((campo: any) => !personalizacionValues[campo.id] || personalizacionValues[campo.id].trim() === "");

      if (camposFaltantes.length > 0) {
        showToast("Por favor completa todos los campos de personalización", "error");
        return;
      }
    }

    if (inCart && currentCartKey) {
      removeCarrito(currentCartKey);
      showToast("Eliminado del carrito", "info");
    } else if (currentCartKey) {
      const cartItem = {
        ...producto,
        cantidad,
        precioBase: basePrice,
        precioUnitario: finalPrice,
        stock: maxCantidad,
        ...(hasVariations && { selectedVariations, variationAttributeIds }),
        ...(producto as any)?.personalizado && { personalizacionValues },
        cartKey: currentCartKey,
        descuento: hasVariations && variationAttributeIds.length > 0 && variationAttributeIds.every(attrId => selectedVariations[attrId]) ? undefined : producto.descuento,
        precioPromocional: hasVariations && variationAttributeIds.length > 0 && variationAttributeIds.every(attrId => selectedVariations[attrId]) ? variantPromoPrice : undefined,
      };
      addCarrito(cartItem);
      showToast(`${producto.nombre} añadido al carrito`, "success");
    }
  };

  const handleFav = () => {
    isFav ? removeFavorito(producto.id) : addFavorito(producto);
  };

  const parseDesc = (text: string) => {
    if (!text) return [];
    const lines = text.split(/\r?\n/);
    const items: { text: string; sub: string[] }[] = [];
    let current: string | null = null;
    let sub: string[] = [];
    lines.forEach((line) => {
      const l = line.trim();
      if (!l) return;
      if (l.startsWith("»")) {
        if (current !== null) { items.push({ text: current, sub }); sub = []; }
        current = l.replace(/^»+/, "").trim();
      } else if (l.startsWith("–")) {
        sub.push(l.replace(/^–+/, "").trim());
      } else {
        if (sub.length > 0) sub[sub.length - 1] += " " + l;
        else if (current !== null) current += " " + l;
      }
    });
    if (current !== null) items.push({ text: current, sub });
    return items;
  };

  const descItems = parseDesc((producto as any).descripcion || "");
  const rawDescripcion = (producto as any).descripcion || "";

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border text-sm placeholder:text-[var(--textSecondary)] focus:outline-none focus:border-[var(--textSecondary)] transition-colors";
  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--bgSecondary)",
    color: "var(--text)"
  };

  const handleTabToggle = (tab: "caracteristicas" | "resenas") => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError("");
    if (!reviewRating || !reviewText) {
      setReviewError("Completa la calificación y el comentario");
      setReviewLoading(false);
      return;
    }
    if (!isLogged && (!reviewName || !reviewEmail)) {
      setReviewError("Completa nombre y correo para publicar la reseña");
      setReviewLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: producto.id,
          userId: user?.uid || "",
          userName: reviewName || user?.displayName || "Usuario",
          userEmail: reviewEmail,
          rating: reviewRating,
          comment: reviewText,
        }),
      });
      if (res.ok) {
        setReviewText("");
        setReviewRating(0);
        if (!isLogged) { setReviewName(""); setReviewEmail(""); }
        const res = await fetch(`/api/reviews?productId=${producto.id}`, { cache: 'no-store' });
        if (res.ok) setReviews(await res.json());
      } else {
        setReviewError("Error al enviar reseña");
      }
    } catch {
      setReviewError("Error de red");
    }
    setReviewLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col mt-2 bg-[var(--bg)] text-[var(--text)] transition-colors">
      <BottomBarPublic />

      <div className="max-w-5xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-14">
          {/* GALERÍA */}
          <div className="w-full md:w-[44%] flex flex-col gap-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
              {hasDiscount && (
                <span className="absolute top-3 left-3 z-10 bg-[var(--secondary)] text-[var(--secondaryForeground)] text-xs font-bold px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
              <img
                src={producto.imagenes?.[imgIdx] || producto.imagen}
                alt={producto.nombre}
                className="w-full h-full object-contain p-5"
              />
              {producto.imagenes && producto.imagenes.length > 1 && imgIdx > 0 && (
                <button
                  onClick={() => setImgIdx(imgIdx - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] shadow flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span className="material-icons-round text-lg" style={{ color: "var(--textSecondary)" }}>chevron_left</span>
                </button>
              )}
              {producto.imagenes && producto.imagenes.length > 1 && imgIdx < producto.imagenes.length - 1 && (
                <button
                  onClick={() => setImgIdx(imgIdx + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] shadow flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span className="material-icons-round text-lg" style={{ color: "var(--textSecondary)" }}>chevron_right</span>
                </button>
              )}
            </div>

            {producto.imagenes && producto.imagenes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {producto.imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImgIdx(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-[var(--bgSecondary)] ${
                      imgIdx === idx
                        ? "border-white/30 scale-105"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            <div>
              <h1
                style={{ color: "var(--text)" }}
                className="text-2xl sm:text-3xl font-bold leading-tight break-words max-w-full whitespace-pre-line"
              >
                {producto.nombre}
              </h1>
              <p style={{ color: "var(--textSecondary)" }} className="text-xs mt-1.5">
                SKU: {producto.sku || producto.id}
              </p>
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-base ${i < Math.round(avgRating) ? "text-yellow-400" : ""}`} style={{ color: i < Math.round(avgRating) ? undefined : "var(--textSecondary)", opacity: i < Math.round(avgRating) ? 1 : 0.3 }}>★</span>
                ))}
                <span style={{ color: "var(--textSecondary)" }} className="text-xs ml-1">
                  {avgRating.toFixed(1)} ({reviews.length})
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3 flex-wrap">
              {hasDiscount && (
                <span style={{ color: "var(--textSecondary)" }} className="text-sm line-through">
                  ${fakeOldPrice.toFixed(2)}
                </span>
              )}
              <span style={{ color: "var(--text)" }} className="text-2xl font-bold">
                ${finalPrice.toFixed(2)}
              </span>
            </div>

            {hasVariations && variationAttributeIds.length > 0 && (
              <VariationsManager
                stockVariants={stockVariants}
                variationAttributeIds={variationAttributeIds}
                attributeNames={atributos}
                selectedVariations={selectedVariations}
                onVariationChange={(attrId, value) => {
                  setSelectedVariations(prev => ({ ...prev, [attrId]: value }));
                }}
                onStockChange={setCurrentStock}
              />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bgSecondary)] transition-colors"
              >
                <span className="material-icons-round text-lg">remove</span>
              </button>
              <span className="text-lg font-semibold min-w-[3rem] text-center">{cantidad}</span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                disabled={cantidad >= maxCantidad}
                className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bgSecondary)] transition-colors disabled:opacity-30"
              >
                <span className="material-icons-round text-lg">add</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddCart}
                className="flex-1 bg-[var(--primary)] text-[var(--primaryForeground)] py-3 px-6 rounded-xl font-semibold hover:bg-[var(--primaryHover)] transition-colors"
              >
                {inCart ? "Eliminar del carrito" : "Añadir al carrito"}
              </button>
              <button
                onClick={handleFav}
                className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bgSecondary)] transition-colors"
              >
                <span className={`material-icons-round ${isFav ? "text-red-500" : ""}`}>
                  {isFav ? "favorite" : "favorite_border"}
                </span>
              </button>
            </div>

            {descItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Descripción</h3>
                <ul className="space-y-2 text-sm" style={{ color: "var(--textSecondary)" }}>
                  {descItems.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium" style={{ color: "var(--text)" }}>{item.text}</span>
                      {item.sub.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {item.sub.map((sub, subIdx) => (
                            <li key={subIdx} style={{ opacity: 0.7 }}>• {sub}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TABS: Características / Reseñas */}
            <div className="flex flex-col gap-0">
              <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
                {producto.caracteristicas && producto.caracteristicas.length > 0 && (
                  <button
                    onClick={() => handleTabToggle("caracteristicas")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                      activeTab === "caracteristicas"
                            ? "bg-[var(--primary)] text-[var(--primaryForeground)]"
                            : "bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bgSecondary)]"
                    }`}
                  >
                    <span className="material-icons-round text-[16px]">list_alt</span>
                    Características
                  </button>
                )}
                <button
                  onClick={() => handleTabToggle("resenas")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                    producto.caracteristicas && producto.caracteristicas.length > 0 ? "border-l border-[var(--border)]" : ""
                  } ${
                    activeTab === "resenas"
                            ? "bg-[var(--primary)] text-[var(--primaryForeground)]"
                            : "bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bgSecondary)]"
                  }`}
                >
                  <span className="material-icons-round text-[16px]">star_outline</span>
                  Reseñas
                  {reviews.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === "resenas"
                        ? "bg-[var(--primary)]/20 text-[var(--primaryForeground)]"
                        : "bg-[var(--card)] text-[var(--textSecondary)]"
                    }`}>
                      {reviews.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab && (
                <div className="border border-t-0 border-[var(--border)] rounded-b-xl px-4 py-4 bg-[var(--bgSecondary)]">
                  {activeTab === "caracteristicas" && producto.caracteristicas && producto.caracteristicas.length > 0 && (
                    <ul className="space-y-2">
                      {producto.caracteristicas.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--textSecondary)" }}>
                          <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "var(--textSecondary)" }} />
                          <Markdown>{c}</Markdown>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === "resenas" && (
                    <div className="space-y-4">
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Calificación</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="text-2xl"
                                style={{ color: star <= reviewRating ? "#facc15" : "var(--textSecondary)", opacity: star <= reviewRating ? 1 : 0.3 }}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Comentario</label>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className={inputCls}
                            style={inputStyle}
                            rows={3}
                            placeholder="Comparte tu experiencia..."
                          />
                        </div>
                        {!isLogged && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-1">Nombre</label>
                              <input
                                type="text"
                                value={reviewName}
                                onChange={(e) => setReviewName(e.target.value)}
                                className={inputCls}
                                style={inputStyle}
                                placeholder="Tu nombre"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Email</label>
                              <input
                                type="email"
                                value={reviewEmail}
                                onChange={(e) => setReviewEmail(e.target.value)}
                                className={inputCls}
                                style={inputStyle}
                                placeholder="tu@email.com"
                              />
                            </div>
                          </>
                        )}
                        {reviewError && (
                          <p className="text-sm" style={{ color: "#ef4444" }}>{reviewError}</p>
                        )}
                        <button
                          type="submit"
                          disabled={reviewLoading}
                          className="bg-[var(--primary)] text-[var(--primaryForeground)] py-2 px-4 rounded-lg font-semibold hover:bg-[var(--primaryHover)] transition-colors disabled:opacity-50"
                        >
                          {reviewLoading ? "Enviando..." : "Publicar reseña"}
                        </button>
                      </form>

                      {reviews.length > 0 && (
                        <div className="space-y-3 mt-6">
                          {reviews.map((review) => (
                            <div key={review.id} className="p-3 bg-[var(--card)] rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium" style={{ color: "var(--text)" }}>{review.userName}</span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className="text-sm" style={{ color: i < review.rating ? "#facc15" : "var(--textSecondary)", opacity: i < review.rating ? 1 : 0.3 }}>★</span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm" style={{ color: "var(--textSecondary)" }}>{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relacionados.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Productos relacionados</h2>
            <RelatedProductsCarousel productos={relacionados} />
          </div>
        )}
      </div>
    </div>
  );
}
