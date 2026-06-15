import { createClient } from '@/lib/supabase/server'
import type { LoanApplication, Client, AppUser } from '@/types'

export interface LoanWithRelations extends LoanApplication {
    client: Client
    onboarding_agent: AppUser
}

export async function getLoans(params: {
    status?: string
    agent?: string
    search?: string
    from?: string
    to?: string
    page?: string
}) {
    const supabase = await createClient()

    // Pagination
    const page = parseInt(params.page || '1')
    const pageSize = 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query
    let query = supabase
        .from('loan_applications')
        .select(`
            *,
            client:clients(*),
            onboarding_agent:clients(onboarding_agent:app_users(*))
        `, { count: 'exact' })

    // Filters
    if (params.status && params.status !== 'all') {
        query = query.eq('process_stage', params.status)
    }
    if (params.from) {
        query = query.gte('created_at', params.from)
    }
    if (params.to) {
        query = query.lte('created_at', params.to)
    }

    // Execute
    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching loans:', error)
        return { loans: [], total: 0 }
    }

    // Process nested data
    let loans = (data as any[]).map(loan => ({
        ...loan,
        client: Array.isArray(loan.client) ? loan.client[0] : loan.client,
        onboarding_agent: Array.isArray(loan.onboarding_agent)
            ? loan.onboarding_agent[0]?.onboarding_agent || null
            : loan.onboarding_agent?.onboarding_agent || null
    })) as LoanWithRelations[]

    // Client-side filtering for agent and name search
    if (params.agent && params.agent !== 'all') {
        loans = loans.filter(loan => loan.onboarding_agent?.id === params.agent)
    }
    if (params.search) {
        const searchLower = params.search.toLowerCase()
        loans = loans.filter(loan =>
            loan.client?.full_name?.toLowerCase().includes(searchLower)
        )
    }

    return {
        loans,
        total: count || 0
    }
}

export async function getLoanDetails(id: string) {
    const supabase = await createClient()

    // Fetch loan details with client and agent
    const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select(`
            *,
            client:clients(*, onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name))
        `)
        .eq('loan_id', id)
        .single()

    if (loanError || !loan) {
        return null
    }

    // Fetch related quotation and documents in parallel
    const [quotationRes, documentsRes] = await Promise.all([
        supabase
            .from('quotations')
            .select('*')
            .eq('client_id', loan.client_id)
            .eq('amount', loan.amount)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
        supabase
            .from('loan_documents')
            .select('*')
            .eq('loan_id', id)
    ])

    return {
        ...loan,
        quotation: quotationRes.data || null,
        documents: documentsRes.data || []
    }
}

export async function getLoanDashboardStats() {
    const supabase = await createClient()

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Execute all queries in parallel to eliminate waterfalls
    const [
        totalLoansRes,
        activeAgentsRes,
        pendingApprovalsRes,
        overdueEMIsRes,
        upcomingPaymentsRes
    ] = await Promise.all([
        supabase.from('loan_applications').select('*', { count: 'exact', head: true }),
        supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('role', 'AGENT'),
        supabase.from('loan_applications').select('*', { count: 'exact', head: true }).in('process_stage', ['Document Verification', 'Credit Appraisal']),
        supabase.from('emi_schedule').select('*', { count: 'exact', head: true }).eq('status', 'OVERDUE'),
        supabase.from('emi_schedule').select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING')
            .gte('due_date', today.toISOString().split('T')[0])
            .lte('due_date', nextWeek.toISOString().split('T')[0])
    ])

    return {
        totalLoans: totalLoansRes.count || 0,
        activeAgents: activeAgentsRes.count || 0,
        pendingApprovals: pendingApprovalsRes.count || 0,
        overdueEMIs: overdueEMIsRes.count || 0,
        upcomingPayments: upcomingPaymentsRes.count || 0,
    }
}
