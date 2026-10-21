"use client";

import { useEffect, useState } from "react";
import { CuentaBancaria } from "../../lib/cuentas-bancarias-db";

export default function CuentasBancariasAdminPage() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null);
  const [formData, setFormData] = useState({
    banco: "",
    tipo: "ahorros",
    numeroCuenta: "",
    titular: "",
    cedulaRuc: "",
  });

  const loadCuentas = async () => {
    console.log("[loadCuentas] Iniciando carga de cuentas...");
    setLoading(true);
    try {
      const res = await fetch("/api/cuentas-bancarias");
      console.log("[loadCuentas] Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[loadCuentas] Cuentas recibidas:", data.length);
        console.log("[loadCuentas] IDs:", data.map((c: any) => c.id));
        setCuentas(data);
      } else {
        console.error("Error fetching cuentas:", res.status);
        alert("Error al cargar cuentas bancarias");
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error);
      alert("Error al cargar cuentas bancarias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  const handleOpenModal = (cuenta?: CuentaBancaria) => {
    if (cuenta) {
      setEditingCuenta(cuenta);
      setFormData({
        banco: cuenta.banco,
        tipo: cuenta.tipo,
        numeroCuenta: cuenta.numeroCuenta,
        titular: cuenta.titular,
        cedulaRuc: cuenta.cedulaRuc,
      });
    } else {
      setEditingCuenta(null);
      setFormData({
        banco: "",
        tipo: "ahorros",
        numeroCuenta: "",
        titular: "",
        cedulaRuc: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCuenta(null);
    setFormData({
      banco: "",
      tipo: "ahorros",
      numeroCuenta: "",
      titular: "",
      cedulaRuc: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCuenta?.id) {
        const res = await fetch("/api/admin/cuentas-bancarias", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCuenta.id, ...formData }),
        });
        if (!res.ok) throw new Error("Error al actualizar cuenta");
        alert("Cuenta actualizada exitosamente");
      } else {
        const res = await fetch("/api/admin/cuentas-bancarias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Error al crear cuenta");
        alert("Cuenta creada exitosamente");
      }
      handleCloseModal();
      loadCuentas();
    } catch (error) {
      console.error("Error guardando cuenta:", error);
      alert("Error al guardar cuenta bancaria");
    }
  };

  const handleEliminar = async (id: string) => {
    console.log("[handleEliminar] Iniciando eliminación de cuenta:", id);
    if (!confirm("¿Estás seguro de eliminar esta cuenta bancaria?")) return;
    try {
      const res = await fetch(`/api/admin/cuentas-bancarias?id=${id}`, {
        method: "DELETE",
      });
      console.log("[handleEliminar] Response status:", res.status);
      if (!res.ok) throw new Error("Error al eliminar cuenta");
      alert("Cuenta eliminada exitosamente");
      console.log("[handleEliminar] Llamando a loadCuentas...");
      loadCuentas();
    } catch (error) {
      console.error("Error eliminando cuenta:", error);
      alert("Error al eliminar cuenta bancaria");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Cuentas Bancarias
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          <span className="material-icons-round text-sm">add</span>
          Nueva Cuenta
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Cargando...</div>
        </div>
      ) : cuentas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <span className="material-icons-round text-5xl text-slate-300 dark:text-slate-600">
            account_balance
          </span>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            No hay cuentas bancarias registradas
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cuentas.map((cuenta) => (
            <div
              key={cuenta.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-icons-round text-purple-600 dark:text-purple-400">
                      account_balance
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {cuenta.banco}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {cuenta.tipo}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-medium">Número:</span>{" "}
                      {cuenta.numeroCuenta}
                    </p>
                    <p>
                      <span className="font-medium">Titular:</span> {cuenta.titular}
                    </p>
                    <p>
                      <span className="font-medium">Cédula/RUC:</span>{" "}
                      {cuenta.cedulaRuc}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(cuenta)}
                    className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="Editar"
                  >
                    <span className="material-icons-round text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleEliminar(cuenta.id!)}
                    className="p-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Eliminar"
                  >
                    <span className="material-icons-round text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingCuenta ? "Editar Cuenta" : "Nueva Cuenta Bancaria"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-icons-round text-slate-400">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  required
                  value={formData.banco}
                  onChange={(e) =>
                    setFormData({ ...formData, banco: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Banco Pichincha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  required
                  value={formData.numeroCuenta}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroCuenta: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Titular
                </label>
                <input
                  type="text"
                  required
                  value={formData.titular}
                  onChange={(e) =>
                    setFormData({ ...formData, titular: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nombre del titular"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cédula/RUC
                </label>
                <input
                  type="text"
                  required
                  value={formData.cedulaRuc}
                  onChange={(e) =>
                    setFormData({ ...formData, cedulaRuc: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Cédula o RUC del titular"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
                >
                  {editingCuenta ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
