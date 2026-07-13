import { createClient } from '@/lib/supabase/server'
import type { LoginWithRelations, LoginsStats } from './loginsConstants'

export async function getLoginsStats(params: {
    region?: string
    bank?: string
    from?: string
    to?: string
}): Promise<LoginsStats> {
    const supabase = await createClient()

    let query = supabase.from('loan_applications').select('process_stage, amount, sanctioned_amount, disbursement_type')

    if (params.region && params.region !== 'all') {
        query = query.eq('region', params.region)
    }
    if (params.bank && params.bank !== 'all') {
        query = query.eq('bank_partner_id', params.bank)
    }
    if (params.from) {
        query = query.gte('created_at', params.from)
    }
    if (params.to) {
        query = query.lte('created_at', params.to + 'T23:59:59')
    }

    const { data } = await query

    const stageCounts: Record<string, number> = {}
    let totalDisbursedAmount = 0
    let totalSanctionedAmount = 0
    let totalDisbursedNew = 0
    let totalDisbursedRepeat = 0
    let totalSpillOver = 0

    for (const row of data || []) {
        const stage = row.process_stage
        stageCounts[stage] = (stageCounts[stage] || 0) + 1

        if (stage === 'Disbursed') {
            totalDisbursedAmount += Number(row.amount) || 0
            if (row.disbursement_type === 'Repeat') totalDisbursedRepeat++
            else if (row.disbursement_type === 'Spill Over') totalSpillOver++
            else totalDisbursedNew++
        }
        if (stage === 'Sanctioned') {
            totalSanctionedAmount += Number(row.sanctioned_amount || row.amount) || 0
        }
    }

    return {
        stageCounts,
        totalDisbursedAmount,
        totalSanctionedAmount,
        totalDisbursedNew,
        totalDisbursedRepeat,
        totalSpillOver,
    }
}

export async function getLogins(params: {
    stage?: string
    region?: string
    bank?: string
    agent?: string
    search?: string
    from?: string
    to?: string
    page?: string
}) {
    const supabase = await createClient()

    const page = parseInt(params.page || '1')
    const pageSize = 25
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('loan_applications').select(`
        *,
        client:clients(client_id, full_name, mobile_number, onboarding_agent_id),
        onboarding_agent:clients(agent:app_users!clients_onboarding_agent_id_fkey(id, full_name, email)),
        bank_partner:bank_partners(partner_id, bank_name, branch_name),
        assigned_tl:app_users!loan_applications_assigned_tl_id_fkey(id, full_name)
    `, { count: 'exact' })

    if (params.stage && params.stage !== 'all') {
        query = query.eq('process_stage', params.stage)
    }
    if (params.region && params.region !== 'all') {
        query = query.eq('region', params.region)
    }
    if (params.bank && params.bank !== 'all') {
        query = query.eq('bank_partner_id', params.bank)
    }
    if (params.from) {
        query = query.gte('created_at', params.from)
    }
    if (params.to) {
        query = query.lte('created_at', params.to + 'T23:59:59')
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Logins fetch error:', error)
        return { logins: [], total: 0 }
    }

    let logins = (data as any[]).map((row) => ({
        ...row,
        client: Array.isArray(row.client) ? row.client[0] : row.client,
        onboarding_agent: Array.isArray(row.onboarding_agent)
            ? row.onboarding_agent[0]?.agent || null
            : row.onboarding_agent?.agent || null,
        bank_partner: Array.isArray(row.bank_partner) ? row.bank_partner[0] : row.bank_partner,
        assigned_tl: Array.isArray(row.assigned_tl) ? row.assigned_tl[0] : row.assigned_tl,
    })) as LoginWithRelations[]

    // Client-side agent & search filter
    if (params.agent && params.agent !== 'all') {
        logins = logins.filter((l) => l.onboarding_agent?.id === params.agent)
    }
    if (params.search) {
        const q = params.search.toLowerCase()
        logins = logins.filter(
            (l) =>
                l.client?.full_name?.toLowerCase().includes(q) ||
                l.login_reference_number?.toLowerCase().includes(q) ||
                l.product_name?.toLowerCase().includes(q)
        )
    }

    return { logins, total: count || 0 }
}
