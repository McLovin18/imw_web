"use client";

import React, { useState } from "react";
import { getSnapshotPricing } from "../lib/pricing";

interface TransferenciaModalProps {
  carrito: any[];
  subtotal: number;
  total: number;
  onClose: () => void;
  cuentasBancarias: any[];
  atributos: any[];
  getVariationText: (p: any) => string;
  onOrdenCreada: () => void;
  clearCarrito: () => void;
}

const CIUDADES = [
  { id: "quito", nombre: "Quito", precio: 5 },
  { id: "guayaquil", nombre: "Guayaquil", precio: 5 },
  { id: "cuenca", nombre: "Cuenca", precio: 5 },
  { id: "ambato", nombre: "Ambato", precio: 5 },
  { id: "riobamba", nombre: "Riobamba", precio: 5 },
  { id: "manta", nombre: "Manta", precio: 5 },
  { id: "portoviejo", nombre: "Portoviejo", precio: 5 },
  { id: "loja", nombre: "Loja", precio: 5 },
  { id: "ibarra", nombre: "Ibarra", precio: 5 },
  { id: "esmeraldas", nombre: "Esmeraldas", precio: 5 },
];

export default function TransferenciaModal({
  carrito,
  subtotal,
  total,
  onClose,
  cuentasBancarias,
  atributos,
  getVariationText,
  onOrdenCreada,
  clearCarrito,
}: TransferenciaModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    cedulaRuc: "",
    telefono: "",
    email: "",
    ciudad: "",
    direccion: "",
    cuentaBancariaId: "",
  });
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [evidenciaPreview, setEvidenciaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const costoEnvio = formData.ciudad
    ? CIUDADES.find((c) => c.id === formData.ciudad)?.precio || 0
    : 0;
  const totalConEnvio = total + costoEnvio;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenciaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidenciaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!formData.cedulaRuc.trim()) {
      setError("La cédula/RUC es requerida");
      return;
    }
    const cedulaRucDigits = formData.cedulaRuc.replace(/\D/g, '');
    if (cedulaRucDigits.length !== 10 && cedulaRucDigits.length !== 13) {
      setError("La cédula debe tener 10 dígitos o el RUC 13 dígitos");
      return;
    }
    if (!formData.telefono.trim()) {
      setError("El teléfono es requerido");
      return;
    }
    if (!formData.email.trim()) {
      setError("El correo electrónico es requerido");
      return;
    }
    if (!formData.ciudad) {
      setError("Selecciona una ciudad de envío");
      return;
    }
    if (!formData.direccion.trim()) {
      setError("La dirección es requerida");
      return;
    }
    if (!formData.cuentaBancariaId) {
      setError("Selecciona una cuenta bancaria");
      return;
    }
    if (!evidenciaFile) {
      setError("Debes adjuntar la evidencia de la transferencia");
      return;
    }

    setLoading(true);

    try {
      // Subir evidencia
      const formDataUpload = new FormData();
      formDataUpload.append("file", evidenciaFile);

      const uploadRes = await fetch("/api/upload/transferencia-evidencia", {
        method: "POST",
        body: formDataUpload,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        console.error("Error al subir evidencia:", errorData);
        throw new Error(errorData.error || "Error al subir la evidencia");
      }

      const uploadData = await uploadRes.json();
      const evidenciaUrl = uploadData.url;

      // Crear orden
      const ordenPayload = {
        productos: carrito.map((p) => ({
          id: p.id,
          cantidad: p.cantidad || 1,
          selectedTalla: p.selectedTalla,
          selectedColor: p.selectedColor,
          selectedVariations: p.selectedVariations,
          variationAttributeIds: p.variationAttributeIds,
          selectedVariationsConNombres: p.selectedVariationsConNombres,
          personalizacionValues: p.personalizacionValues,
          personalizacionValuesConNombres: p.personalizacionValuesConNombres,
        })),
        metodoPago: "transferencia",
        datosCliente: {
          nombre: formData.nombre,
          cedulaRuc: formData.cedulaRuc,
          telefono: formData.telefono,
          email: formData.email,
        },
        datosEnvio: {
          ciudad: formData.ciudad,
          nombreCiudad: CIUDADES.find((c) => c.id === formData.ciudad)?.nombre,
          direccion: formData.direccion,
          costoEnvio,
        },
        cuentaBancariaId: formData.cuentaBancariaId,
        evidenciaTransferencia: evidenciaUrl,
        total: totalConEnvio,
        estado: "pendiente_pago",
      };

      const ordenRes = await fetch("/api/ordenes/transferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ordenPayload),
      });

      if (!ordenRes.ok) {
        const errorData = await ordenRes.json();
        throw new Error(errorData.error || "Error al crear la orden");
      }

      const ordenData = await ordenRes.json();

      alert(
        "✅ Orden creada exitosamente. Hemos enviado un correo con los detalles de tu compra."
      );
      clearCarrito();
      onOrdenCreada();
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error al procesar la orden");
    } finally {
      setLoading(false);
    }
  };

  const calcularPrecioData = (p: any) => {
    const { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice } =
      getSnapshotPricing(p);
    return { basePrice, discount, hasDiscount, fakeOldPrice, finalPrice };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Pagar por Transferencia
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-icons-round text-slate-400">close</span>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="material-icons-round text-base mt-0.5 shrink-0">
                error_outline
              </span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Información de productos */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                1. Productos seleccionados
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3">
                {carrito.map((p, idx) => {
                  const { finalPrice } = calcularPrecioData(p);
                  const lineTotal = finalPrice * (p.cantidad || 1);
                  return (
                    <div
                      key={idx}
                      className="flex gap-3 items-start bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <img
                          src={p.imagenes?.[0] || "/no-image.png"}
                          alt={p.nombre}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {getVariationText(p)}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500">
                            Cantidad: {p.cantidad || 1}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Subtotal
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Ciudad y dirección */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                2. Información de envío
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad de envío *
                  </label>
                  <select
                    required
                    value={formData.ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">Selecciona una ciudad</option>
                    {CIUDADES.map((ciudad) => (
                      <option key={ciudad.id} value={ciudad.id}>
                        {ciudad.nombre} - ${ciudad.precio}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dirección exacta *
                  </label>
                  <textarea
                    required
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                    rows={2}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Calle principal, número, referencias..."
                  />
                </div>
              </div>
            </div>

            {/* 3-6. Datos personales */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                3. Datos personales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cédula/RUC *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cedulaRuc}
                    onChange={(e) =>
                      setFormData({ ...formData, cedulaRuc: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Cédula o RUC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="09xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            </div>

            {/* 7. Cuentas bancarias */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                4. Cuenta bancaria para transferencia
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selecciona cuenta *
                  </label>
                  <select
                    required
                    value={formData.cuentaBancariaId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cuentaBancariaId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecciona una cuenta</option>
                    {cuentasBancarias.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.banco} - {cuenta.tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.cuentaBancariaId && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900/40">
                    {(() => {
                      const cuenta = cuentasBancarias.find(
                        (c) => c.id === formData.cuentaBancariaId
                      );
                      if (!cuenta) return null;
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="material-icons-round text-blue-600 dark:text-blue-400">
                              account_balance
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {cuenta.banco}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {cuenta.tipo}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            <span className="font-medium">Número:</span>{" "}
                            {cuenta.numeroCuenta}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            <span className="font-medium">Titular:</span>{" "}
                            {cuenta.titular}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            <span className="font-medium">Cédula/RUC:</span>{" "}
                            {cuenta.cedulaRuc}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* 8. Evidencia de transferencia */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                5. Evidencia de transferencia
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subir comprobante *
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {evidenciaPreview && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Vista previa:
                    </p>
                    <img
                      src={evidenciaPreview}
                      alt="Evidencia de transferencia"
                      className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Resumen total */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-900/40">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    Subtotal productos
                  </span>
                  <span className="text-slate-800 dark:text-slate-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    Costo de envío
                    {formData.ciudad && (
                      <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                        ({CIUDADES.find((c) => c.id === formData.ciudad)?.nombre})
                      </span>
                    )}
                  </span>
                  <span className="text-slate-800 dark:text-slate-100">
                    ${costoEnvio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-purple-200 dark:border-purple-900/40">
                  <span className="text-slate-800 dark:text-slate-100">
                    Total a pagar
                  </span>
                  <span className="text-purple-700 dark:text-purple-300">
                    ${totalConEnvio.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón enviar */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-icons-round text-sm animate-spin">
                      refresh
                    </span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round text-sm">send</span>
                    Enviar orden
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
