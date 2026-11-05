import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import admin from './app/lib/firebase-admin';

// Rutas consideradas "públicas" (landing, blog, carrito, etc.)
const PUBLIC_EXACT: string[] = ["/", "/login"];
const PUBLIC_PREFIXES: string[] = [
  "/blogs",
  "/cart",
  "/product-detail",
  "/products-by-category",
  "/search-results",
  "/order-confirmation",
  "/settings",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("session");
  const roleCookie = req.cookies.get("role")?.value;

  const isAdminArea = pathname.startsWith("/admin");
  const publicPath = isPublicPath(pathname);

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, req.url));

  // Redirecciones SEO para productos antiguos
  if (pathname.startsWith('/product-detail')) {
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      try {
        const adminDb = admin.firestore();
        const doc = await adminDb.collection('productos').doc(id).get();
        if (doc.exists) {
          const product = doc.data();
          if (product.slug) {
            return NextResponse.redirect(new URL(`/${product.slug}`, req.url), 301);
          }
        }
      } catch (error) {
        console.error('Error redirecting product:', error);
      }
    }
  }

  // Redirecciones SEO para blogs antiguos
  if (pathname.startsWith('/blogs/')) {
    const id = pathname.split('/')[2];
    if (id) {
      try {
        const adminDb = admin.firestore();
        const doc = await adminDb.collection('blogs').doc(id).get();
        if (doc.exists) {
          const blog = doc.data();
          if (blog.slug) {
            return NextResponse.redirect(new URL(`/${blog.slug}`, req.url), 301);
          }
        }
      } catch (error) {
        console.error('Error redirecting blog:', error);
      }
    }
  }

  // Sin sesión: se bloquea zona protegida (/admin) y se redirige al landing
  if (!session) {
    if (isAdminArea) {
      return redirectTo("/");
    }
    return NextResponse.next();
  }

  const role = roleCookie as "admin" | undefined;

  // Usuario autenticado sin rol definido: no puede entrar a /admin
  if (!role) {
    if (isAdminArea) {
      return redirectTo("/login");
    }
    return NextResponse.next();
  }

  // Admin autenticado
  if (role === "admin") {
    // También redirigimos admin fuera de páginas públicas/login
    if (publicPath) {
      return redirectTo("/admin");
    }
    return NextResponse.next();
  }

  // Default allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/blogs/:path*",
    "/cart/:path*",
    "/product-detail/:path*",
    "/products-by-category/:path*",
    "/search-results/:path*",
    "/order-confirmation/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
