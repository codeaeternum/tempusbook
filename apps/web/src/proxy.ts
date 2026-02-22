import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ----------------------------------------------------------------------
// AeternaSuite Edge Middleware (Next.js)
// ----------------------------------------------------------------------
// Protege todas las rutas bajo `/dashboard` para asegurar que nadie sin 
// sesión pueda acceder al TPV, Citas o Configuración del negocio.
// ----------------------------------------------------------------------

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Extraer token de las cookies (o Authorization Header si es API Local Proxy)
    // Nota: Como estamos en un entorno JWT Mock (Phase 2), Next.js Middleware no tiene 
    // acceso directo al `localStorage`. Usaremos una Cookie 'aeterna-auth' para el Edge.
    const token = request.cookies.get('aeterna-auth')?.value;

    // 2. Proteger RUTAS PRIVADAS (Todo lo que empiece con /dashboard)
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            // Usuario sin sesión, redirigimos a login interceptando el intento
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirectUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // 3. Proteger RUTAS PÚBLICAS (Login/Signup) si ya hay sesión
    if (pathname === '/login' && token) {
        // Si ya inicio sesión, lo mandamos directo al dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Configuración del Middleware Matcher
export const config = {
    // Aplica a TODO excepto archivos estáticos (_next, imágenes, favicons, etc.)
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
