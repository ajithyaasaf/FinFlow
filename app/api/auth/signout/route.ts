import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // Get the origin from request headers or environment variables
    const origin = request.headers.get('origin')
        || process.env.NEXT_PUBLIC_SITE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000'

    try {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', origin))
    } catch (error) {
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
    }
}
