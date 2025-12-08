import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function handleSignOut(request: NextRequest) {
    const supabase = await createClient()

    try {
        await supabase.auth.signOut()

        // Use request.url to get the current origin
        const url = new URL(request.url)
        const loginUrl = new URL('/login', url.origin)

        return NextResponse.redirect(loginUrl)
    } catch (error) {
        console.error('Sign out error:', error)
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    return handleSignOut(request)
}

export async function GET(request: NextRequest) {
    return handleSignOut(request)
}
