import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    supabaseResponse.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    supabaseResponse.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Get session to check auth (very fast, uses local JWT decoding instead of network query)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    return { supabaseResponse, user, supabase }
}
