import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get('authToken')?.value;
    const { pathname } = request.nextUrl;

    // Define protected routes
    const protectedRoutes = ['/dashboard', '/records', '/appointments', '/settings'];

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If protected route and no token, redirect to login
    if (isProtectedRoute && !authToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is on login page and has token, redirect to dashboard
    if (pathname === '/login' && authToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
