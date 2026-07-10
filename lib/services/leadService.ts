import { createClient } from '@/lib/supabase/server'
import type { Lead, LeadStatus, Client } from '@/types'

export async function getLeads() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch user role
    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    let query = supabase.from('leads').select(`
        *,
        assigned_agent:app_users(id, full_name, email)
    `)

    // Agents only see their assigned leads
    if (profile.role === 'AGENT') {
        query = query.eq('assigned_agent_id', user.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching leads:', error)
        return []
    }

    return data || []
}

export async function getLeadDetails(leadId: string) {
    const supabase = await createClient()

    // Query lead and activities in parallel
    const [leadRes, activitiesRes] = await Promise.all([
        supabase
            .from('leads')
            .select(`
                *,
                assigned_agent:app_users(id, full_name, email)
            `)
            .eq('lead_id', leadId)
            .single(),
        supabase
            .from('activities')
            .select(`
                *,
                assigned_agent:app_users(id, full_name, email)
            `)
            .eq('related_lead_id', leadId)
            .order('created_at', { ascending: false })
    ])

    if (leadRes.error || !leadRes.data) {
        return null
    }

    return {
        lead: leadRes.data,
        activities: activitiesRes.data || []
    }
}

export async function createLead(leadData: Partial<Lead>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch user profile to check role
    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    const finalLeadData = {
        ...leadData,
        assigned_agent_id: profile?.role === 'AGENT' ? user.id : (leadData.assigned_agent_id || user.id)
    }

    const { data, error } = await supabase
        .from('leads')
        .insert([finalLeadData])
        .select()
        .single()

    if (error) {
        console.error('Error creating lead:', error)
        throw error
    }

    return data
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('lead_id', leadId)
        .select()
        .single()

    if (error) {
        console.error('Error updating lead status:', error)
        throw error
    }

    return data
}

export async function promoteLeadToClient(leadId: string): Promise<Client | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // 1. Fetch Lead details
    const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single()

    if (fetchError || !lead) {
        throw new Error('Lead not found')
    }

    // 2. Insert Client record
    const clientData = {
        full_name: lead.full_name,
        mobile_number: lead.phone_number,
        onboarding_agent_id: lead.assigned_agent_id || user.id, // Fallback if no agent is assigned
        pan_number: null,
        kyc_document_url: null,
        status: 'PENDING_VERIFICATION'
    }

    const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

    if (clientError || !client) {
        console.error('Error promoting lead to client:', clientError)
        throw new Error(clientError?.message || 'Failed to create client')
    }

    // 3. Mark Lead as Converted
    const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'CONVERTED', updated_at: new Date().toISOString() })
        .eq('lead_id', leadId)

    if (updateError) {
        console.error('Failed to update lead status:', updateError)
        // Note: In case of non-transactional database failure, client is created but status update failed.
        // We log and continue as client is already safe.
    }

    // 4. Log conversion activity
    await supabase.from('activities').insert([{
        title: 'Lead Promoted to Client',
        description: `Lead converted to active client profile: ${lead.full_name}`,
        type: 'CALL_LOG',
        status: 'COMPLETED',
        related_lead_id: leadId,
        related_client_id: client.client_id,
        assigned_agent_id: lead.assigned_agent_id
    }])

    return client
}
