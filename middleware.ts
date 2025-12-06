import { updateSession } from './lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user, supabase } = await updateSession(request)

    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    if (pathname === '/login') {
        if (user) {
            // User is authenticated, redirect based on role
            const { data: userData } = await supabase
                .from('app_users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (userData) {
                const redirectUrl = userData.role === 'ADMIN' ? '/dashboard' : '/agent'
                return NextResponse.redirect(new URL(redirectUrl, request.url))
            }
        }
        return supabaseResponse
    }

    // Protected routes - require authentication
    if (!user) {
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    // Get user role for route protection
    const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData) {
        // User exists in auth but not in app_users table
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    // Role-based routing
    if (pathname.startsWith('/dashboard') && userData.role !== 'ADMIN') {
        // Agent trying to access admin dashboard
        return NextResponse.redirect(new URL('/agent', request.url))
    }

    if (pathname.startsWith('/agent') && userData.role !== 'AGENT') {
        // Admin trying to access agent portal
        return NextResponse.redirect(new URL('/dashboard', request.url))
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
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/.*|.*\\.png$).*)',
    ],
}
