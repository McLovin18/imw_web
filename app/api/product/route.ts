import { NextRequest, NextResponse } from 'next/server';
import admin from '../../lib/firebase-admin';

// Cache por 5 minutos, revalidado en el servidor
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutos

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const adminDb = admin.firestore();
    const snapshot = await adminDb.collection('productos').where('slug', '==', slug).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const product = { id: doc.id, ...doc.data() };

    // Set cache headers
    const response = NextResponse.json(product);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
