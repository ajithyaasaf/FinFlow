import { createClient } from '@/lib/supabase/server'
import type { Client } from '@/types'

export async function getClients() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
        return []
    }

    return data || []
}

export async function getClientDetails(clientId: string) {
    const supabase = await createClient()

    // Query client, loans, and quotations in parallel
    const [clientRes, loansRes, quotationsRes] = await Promise.all([
        supabase
            .from('clients')
            .select(`
                *,
                onboarding_agent:app_users!clients_onboarding_agent_id_fkey(id, full_name, email)
            `)
            .eq('client_id', clientId)
            .single(),
        supabase
            .from('loan_applications')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false }),
        supabase
            .from('quotations')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
    ])

    if (clientRes.error || !clientRes.data) {
        return null
    }

    return {
        client: clientRes.data,
        loans: loansRes.data || [],
        quotations: quotationsRes.data || []
    }
}
