import { updateSession } from './lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user } = await updateSession(request)

    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    if (pathname === '/login') {
        if (user) {
            // User is authenticated, redirect to /dashboard.
            // If they are a STAFF, dashboard's layout.tsx will intercept and redirect to /staff.
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return supabaseResponse
    }

    // Protected routes - require authentication
    if (!user) {
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (manifest, sw, icons)
         * - api routes (they handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/.*|.*\\.png$|api/.*).*)',
    ],
}
