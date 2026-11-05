import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import admin from './app/lib/firebase-admin';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Redirigir /product-detail?id=XYZ a /slug
  if (pathname.startsWith('/product-detail')) {
    const id = url.searchParams.get('id');
    if (id) {
      try {
        const adminDb = admin.firestore();
        const doc = await adminDb.collection('productos').doc(id).get();
        if (doc.exists) {
          const product = doc.data();
          if (product.slug) {
            // Redirección 301 (permanente)
            return NextResponse.redirect(new URL(`/${product.slug}`, request.url), 301);
          }
        }
      } catch (error) {
        console.error('Error redirecting product:', error);
      }
    }
  }

  // Redirigir /blogs/XYZ a /slug
  if (pathname.startsWith('/blogs/')) {
    const id = pathname.split('/')[2];
    if (id) {
      try {
        const adminDb = admin.firestore();
        const doc = await adminDb.collection('blogs').doc(id).get();
        if (doc.exists) {
          const blog = doc.data();
          if (blog.slug) {
            // Redirección 301 (permanente)
            return NextResponse.redirect(new URL(`/${blog.slug}`, request.url), 301);
          }
        }
      } catch (error) {
        console.error('Error redirecting blog:', error);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/product-detail/:path*', '/blogs/:path*'],
};
