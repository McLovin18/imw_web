import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

const COLLECTION = "marcas";

export async function obtenerMarcas() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("nombre", "asc"))
  );
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function guardarMarca(nombre: string) {
  await setDoc(doc(db, COLLECTION, nombre.toLowerCase().replace(/\s+/g, "_")), { nombre });
}

export async function eliminarMarca(id: string) {
  await deleteDoc(doc(db, COLLECTION, id));
}
