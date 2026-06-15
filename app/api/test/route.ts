import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('attendance_logs')
            .select('*')
            .order('check_in_time', { ascending: false })
            .limit(5)

        if (error) throw error

        return NextResponse.json({
            success: true,
            logs: data
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server test error'
        }, { status: 500 })
    }
}
