import { createClient } from '@/lib/supabase/server'
import type { Quotation, Client, AppUser } from '@/types'

export interface QuotationWithDetails extends Quotation {
    client: Client | null
    created_by_user: AppUser | null
}

export async function getUnconvertedQuotations(): Promise<QuotationWithDetails[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            client:clients(*),
            created_by_user:app_users!quotations_created_by_fkey(*)
        `)
        .is('converted_to_loan_id', null)
        .neq('status', 'REJECTED')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching quotations:', error)
        return []
    }

    return (data || []) as QuotationWithDetails[]
}

export async function getRecentQuotations(limit: number = 10) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            client:clients(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching recent quotations:', error)
        return []
    }

    return data || []
}

export async function getAgentQuotations(agentId: string): Promise<QuotationWithDetails[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            client:clients(*),
            created_by_user:app_users!quotations_created_by_fkey(*)
        `)
        .eq('created_by', agentId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching agent quotations:', error)
        return []
    }

    return (data || []) as QuotationWithDetails[]
}

export async function getAllQuotationsWithDetails(): Promise<QuotationWithDetails[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            client:clients(*),
            created_by_user:app_users!quotations_created_by_fkey(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all quotations:', error)
        return []
    }

    return (data || []) as QuotationWithDetails[]
}
