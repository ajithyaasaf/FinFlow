import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const supabase = await createClient()
        const adminSupabase = createAdminClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        
        let role = null
        if (user) {
            const { data: profile } = await adminSupabase
                .from('app_users')
                .select('role')
                .eq('id', user.id)
                .single()
            role = profile?.role
        }
        
        const { data: leads, error: leadsErr } = await adminSupabase
            .from('leads')
            .select('*')

        return NextResponse.json({
            authenticatedUser: user ? { id: user.id, email: user.email, role } : null,
            leads,
            leadsErr
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
