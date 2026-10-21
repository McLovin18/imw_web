import admin from "./firebase-admin";

export interface CuentaBancaria {
  id?: string;
  banco: string;
  tipo: "ahorros" | "corriente";
  numeroCuenta: string;
  titular: string;
  cedulaRuc: string;
  createdAt?: any;
}

const COLECCION = "cuentas_bancarias";

// Operaciones de escritura usando admin SDK (bypass reglas de Firestore)
export async function crearCuentaBancariaAdmin(data: Omit<CuentaBancaria, "id" | "createdAt">): Promise<CuentaBancaria> {
  try {
    const adminDb = admin.firestore();
    const docRef = await adminDb.collection(COLECCION).add({
      ...data,
      createdAt: admin.firestore.Timestamp.now(),
    });
    return {
      id: docRef.id,
      ...data,
      createdAt: admin.firestore.Timestamp.now(),
    };
  } catch (error) {
    console.error("Error creando cuenta bancaria:", error);
    throw error;
  }
}

export async function actualizarCuentaBancariaAdmin(
  id: string,
  data: Partial<Omit<CuentaBancaria, "id" | "createdAt">>
): Promise<void> {
  try {
    const adminDb = admin.firestore();
    const docRef = adminDb.collection(COLECCION).doc(id);
    await docRef.update(data);
  } catch (error) {
    console.error("Error actualizando cuenta bancaria:", error);
    throw error;
  }
}

export async function eliminarCuentaBancariaAdmin(id: string): Promise<void> {
  try {
    console.log("[eliminarCuentaBancariaAdmin] Iniciando eliminación de ID:", id);
    const adminDb = admin.firestore();
    const docRef = adminDb.collection(COLECCION).doc(id);
    
    // Verificar si el documento existe antes de eliminar
    const docSnap = await docRef.get();
    console.log("[eliminarCuentaBancariaAdmin] Documento existe:", docSnap.exists);
    if (docSnap.exists) {
      console.log("[eliminarCuentaBancariaAdmin] Datos del documento:", docSnap.data());
    }
    
    await docRef.delete();
    console.log("[eliminarCuentaBancariaAdmin] Delete() ejecutado");
    
    // Verificar que se eliminó
    const docSnapAfter = await docRef.get();
    console.log("[eliminarCuentaBancariaAdmin] Documento existe después de delete:", docSnapAfter.exists);
  } catch (error) {
    console.error("Error eliminando cuenta bancaria:", error);
    throw error;
  }
}
