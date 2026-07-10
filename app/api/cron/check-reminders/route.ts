import { generateCallbackAlerts } from '@/lib/notifications'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Cron job to detect callback reminders due in the next 24 hours
 * Security: Protected by Vercel Cron Secret
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const alertsCreated = await generateCallbackAlerts()

        return NextResponse.json({
            success: true,
            alertsCreated,
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('Callback reminder checker cron error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
