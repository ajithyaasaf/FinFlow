import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Cron job to automatically mark EMIs as overdue
 * Runs daily to check due dates
 * 
 * Security: Protected by Vercel Cron Secret
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Mark EMIs as overdue where due_date < today and status = PENDING
        const { data, error, count } = await supabase
            .from('emi_schedule')
            .update({
                status: 'OVERDUE',
                updated_at: new Date().toISOString()
            })
            .eq('status', 'PENDING')
            .lt('due_date', today.toISOString().split('T')[0])
            .select('schedule_id')

        if (error) {
            console.error('Error marking overdue EMIs:', error)
            return NextResponse.json(
                { error: 'Failed to mark overdue EMIs', details: error.message },
                { status: 500 }
            )
        }

        const marked = data?.length || 0

        console.log(`✅ EMI Overdue Check Complete: ${marked} EMIs marked as overdue`)

        return NextResponse.json({
            success: true,
            markedOverdue: marked,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
