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
    // Bypassed as payment/EMI tracking is disabled in application
    return NextResponse.json({
        success: true,
        message: 'Cron job bypassed (payment tracking disabled)',
        timestamp: new Date().toISOString()
    })
}
