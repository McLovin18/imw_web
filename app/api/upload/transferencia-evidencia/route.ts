import { NextRequest, NextResponse } from "next/server";
import { uploadImageAdmin } from "../../../lib/upload-image-admin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5MB" },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir la imagen usando admin SDK (servidor)
    const url = await uploadImageAdmin(buffer, file.name, "evidencias-transferencia");

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: any) {
    console.error("Error subiendo evidencia de transferencia:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir la evidencia" },
      { status: 500 }
    );
  }
}
