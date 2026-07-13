import { createClient } from '@/lib/supabase/server'

export interface DashboardAnalytics {
    summary: {
        totalSourcedVolume: number
        totalDisbursedVolume: number
        totalSanctionedVolume: number
        activeLoansCount: number
    }
    monthlyTrends: {
        month: string
        sourced: number
        disbursed: number
    }[]
    productDistribution: {
        name: string
        value: number
    }[]
    regionBreakdown: {
        name: string
        value: number
        count: number
    }[]
    staffLeaderboard: {
        name: string
        sourcedValue: number
        filesCount: number
        conversionRate: number
    }[]
}

export async function getMDAnalytics(timeRange: string = 'last_12_months'): Promise<DashboardAnalytics> {
    const supabase = await createClient()

    // 1. Fetch loan applications with their client and agent details
    let query = supabase.from('loan_applications').select(`
        amount,
        sanctioned_amount,
        process_stage,
        product_name,
        region,
        created_at,
        client:clients(
            onboarding_agent_id,
            agent:app_users!clients_onboarding_agent_id_fkey(full_name)
        )
    `)

    // Time filter logic
    const now = new Date()
    if (timeRange === 'last_30_days') {
        const date = new Date(now.setDate(now.getDate() - 30))
        query = query.gte('created_at', date.toISOString())
    } else if (timeRange === 'last_6_months') {
        const date = new Date(now.setMonth(now.getMonth() - 6))
        query = query.gte('created_at', date.toISOString())
    } else if (timeRange === 'ytd') {
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        query = query.gte('created_at', startOfYear.toISOString())
    } else {
        // default: last 12 months
        const date = new Date(now.setMonth(now.getMonth() - 12))
        query = query.gte('created_at', date.toISOString())
    }

    const { data: loans, error } = await query

    if (error || !loans) {
        console.error('Error fetching analytics loans:', error)
        return {
            summary: { totalSourcedVolume: 0, totalDisbursedVolume: 0, totalSanctionedVolume: 0, activeLoansCount: 0 },
            monthlyTrends: [],
            productDistribution: [],
            regionBreakdown: [],
            staffLeaderboard: []
        }
    }

    // 2. Perform aggregates & calculations
    let totalSourcedVolume = 0
    let totalDisbursedVolume = 0
    let totalSanctionedVolume = 0
    let activeLoansCount = 0

    // Temporary groupings
    const monthlyMap: Record<string, { sourced: number; disbursed: number; orderKey: number }> = {}
    const productMap: Record<string, number> = {}
    const regionMap: Record<string, { value: number; count: number }> = {}
    const staffMap: Record<string, { sourcedValue: number; filesCount: number; successfulFiles: number }> = {}

    // Month name helper
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (const loan of loans || []) {
        const amount = Number(loan.amount) || 0
        const sanctionedAmount = Number(loan.sanctioned_amount || loan.amount) || 0
        const stage = loan.process_stage
        const product = loan.product_name || 'Other'
        const region = loan.region || 'Madurai'
        const createdAt = new Date(loan.created_at)

        // General Summary
        totalSourcedVolume += amount
        if (stage === 'Disbursed') {
            totalDisbursedVolume += amount
        }
        if (stage === 'Sanctioned' || stage === 'Disbursed') {
            totalSanctionedVolume += sanctionedAmount
        }
        if (stage !== 'Declined' && stage !== 'Closed' && stage !== 'Disbursed') {
            activeLoansCount++
        }

        // Monthly Trends Grouping
        const year = createdAt.getFullYear()
        const monthIdx = createdAt.getMonth()
        const monthLabel = `${monthNames[monthIdx]} ${year}`
        const orderKey = year * 100 + monthIdx

        if (!monthlyMap[monthLabel]) {
            monthlyMap[monthLabel] = { sourced: 0, disbursed: 0, orderKey }
        }
        monthlyMap[monthLabel].sourced += amount
        if (stage === 'Disbursed') {
            monthlyMap[monthLabel].disbursed += amount
        }

        // Product Distribution Grouping
        productMap[product] = (productMap[product] || 0) + amount

        // Region Breakdown Grouping
        if (!regionMap[region]) {
            regionMap[region] = { value: 0, count: 0 }
        }
        regionMap[region].value += amount
        regionMap[region].count++

        // Staff Leaderboard Grouping
        const clientData: any = Array.isArray(loan.client) ? loan.client[0] : loan.client
        const agentArray = clientData?.agent
        const agentName = (Array.isArray(agentArray) ? agentArray[0]?.full_name : agentArray?.full_name) || 'Direct / Walk-in'

        if (!staffMap[agentName]) {
            staffMap[agentName] = { sourcedValue: 0, filesCount: 0, successfulFiles: 0 }
        }
        staffMap[agentName].sourcedValue += amount
        staffMap[agentName].filesCount++
        if (stage === 'Disbursed' || stage === 'Sanctioned') {
            staffMap[agentName].successfulFiles++
        }
    }

    // Format Monthly Trends (Sorted Chronologically)
    const monthlyTrends = Object.entries(monthlyMap)
        .map(([month, data]) => ({
            month,
            sourced: data.sourced,
            disbursed: data.disbursed,
            orderKey: data.orderKey
        }))
        .sort((a, b) => a.orderKey - b.orderKey)
        .map(({ month, sourced, disbursed }) => ({ month, sourced, disbursed }))

    // Format Product Distribution
    const productDistribution = Object.entries(productMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    // Format Region Breakdown
    const regionBreakdown = Object.entries(regionMap)
        .map(([name, data]) => ({ name, value: data.value, count: data.count }))
        .sort((a, b) => b.value - a.value)

    // Format Staff Leaderboard
    const staffLeaderboard = Object.entries(staffMap)
        .map(([name, data]) => ({
            name,
            sourcedValue: data.sourcedValue,
            filesCount: data.filesCount,
            conversionRate: data.filesCount > 0 
                ? Math.round((data.successfulFiles / data.filesCount) * 100) 
                : 0
        }))
        .sort((a, b) => b.sourcedValue - a.sourcedValue)

    return {
        summary: {
            totalSourcedVolume,
            totalDisbursedVolume,
            totalSanctionedVolume,
            activeLoansCount
        },
        monthlyTrends,
        productDistribution,
        regionBreakdown,
        staffLeaderboard
    }
}
