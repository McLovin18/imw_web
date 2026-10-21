import admin from "./firebase-admin";

/**
 * Sube una imagen a Firebase Storage usando admin SDK (para servidor) y retorna la URL pública.
 * @param buffer Buffer de la imagen a subir
 * @param fileName Nombre del archivo
 * @param folder Carpeta en Storage (ej: 'transferencias')
 * @returns URL pública de la imagen
 */
export async function uploadImageAdmin(buffer: Buffer, fileName: string, folder: string): Promise<string> {
  const adminStorage = admin.storage();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
  console.log("[uploadImageAdmin] Using bucket:", storageBucket);
  const bucket = adminStorage.bucket(storageBucket);
  const filePath = `${folder}/${Date.now()}-${fileName}`;
  const file = bucket.file(filePath);
  
  await file.save(buffer, {
    contentType: 'image/jpeg',
  });
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 año
  });
  
  return url;
}
