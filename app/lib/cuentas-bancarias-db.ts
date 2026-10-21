import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";

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

// Solo operaciones de lectura usando cliente SDK (permitido por reglas de Firestore)
export async function obtenerCuentasBancarias(): Promise<CuentaBancaria[]> {
  try {
    const q = query(collection(db, COLECCION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CuentaBancaria[];
  } catch (error) {
    console.error("Error obteniendo cuentas bancarias:", error);
    throw error;
  }
}

export async function obtenerCuentaBancariaPorId(id: string): Promise<CuentaBancaria | null> {
  try {
    const docRef = doc(db, COLECCION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as CuentaBancaria;
  } catch (error) {
    console.error("Error obteniendo cuenta bancaria:", error);
    throw error;
  }
}
