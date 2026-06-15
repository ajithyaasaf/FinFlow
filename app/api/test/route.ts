import { NextResponse } from 'next/server'
import { getLoanDashboardStats, getLoans } from '@/lib/services/loanService'
import { getAgents, getAgentStats } from '@/lib/services/agentService'
import { getUnconvertedQuotations } from '@/lib/services/quotationService'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const start = performance.now()
        
        // Execute all optimized services concurrently
        const [stats, loansRes, agents, agentStats, quotations] = await Promise.all([
            getLoanDashboardStats(),
            getLoans({}),
            getAgents(),
            getAgentStats(),
            getUnconvertedQuotations()
        ])

        const duration = performance.now() - start

        return NextResponse.json({
            success: true,
            executionTime: `${Math.round(duration)}ms`,
            summary: {
                totalLoansCount: stats.totalLoans,
                loansLoaded: loansRes.loans.length,
                agentsLoaded: agents.length,
                totalAgentsCount: agentStats.totalAgents,
                unconvertedQuotationsLoaded: quotations.length
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server test error'
        }, { status: 500 })
    }
}
