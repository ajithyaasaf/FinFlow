'use server'

import { createLead, updateLeadStatus, promoteLeadToClient, getLeadDetails, bulkUpdateLeadStatus, bulkAssignAgent } from '@/lib/services/leadService'
import { createAuditLog } from '@/lib/audit-logger'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Lead, LeadStatus } from '@/types'

export async function createLeadAction(leadData: Partial<Lead>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const lead = await createLead(leadData)
        
        await createAuditLog({
            userId: user.id,
            action: 'LEAD_CREATED' as any,
            entityType: 'CLIENT' as any,
            entityId: lead.lead_id,
            newValue: lead
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/staff/leads')
        return { success: true, lead }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create lead' }
    }
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const lead = await updateLeadStatus(leadId, status)

        await createAuditLog({
            userId: user.id,
            action: 'LEAD_UPDATED' as any,
            entityType: 'CLIENT' as any,
            entityId: leadId,
            newValue: { status }
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/staff/leads')
        return { success: true, lead }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update lead status' }
    }
}

export async function promoteLeadToClientAction(leadId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const client = await promoteLeadToClient(leadId)
        if (!client) throw new Error('Conversion failed')

        await createAuditLog({
            userId: user.id,
            action: 'LEAD_CONVERTED' as any,
            entityType: 'CLIENT' as any,
            entityId: leadId,
            newValue: { client_id: client.client_id }
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/clients')
        revalidatePath('/staff/leads')
        return { success: true, clientId: client.client_id }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to convert lead to client' }
    }
}

export async function getLeadDetailsAction(leadId: string) {
    try {
        const details = await getLeadDetails(leadId)
        return { success: true, details }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch lead details' }
    }
}

export async function bulkUpdateLeadStatusAction(leadIds: string[], status: LeadStatus) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const updatedLeads = await bulkUpdateLeadStatus(leadIds, status)

        await createAuditLog({
            userId: user.id,
            action: 'LEAD_UPDATED' as any,
            entityType: 'CLIENT' as any,
            entityId: leadIds[0], // log primary reference
            newValue: { status, bulkCount: leadIds.length }
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/staff/leads')
        return { success: true, count: updatedLeads.length }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to bulk update status' }
    }
}

export async function bulkAssignAgentAction(leadIds: string[], agentId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const updatedLeads = await bulkAssignAgent(leadIds, agentId)

        await createAuditLog({
            userId: user.id,
            action: 'LEAD_UPDATED' as any,
            entityType: 'CLIENT' as any,
            entityId: leadIds[0], // log primary reference
            newValue: { assigned_agent_id: agentId, bulkCount: leadIds.length }
        })

        revalidatePath('/dashboard/leads')
        revalidatePath('/staff/leads')
        return { success: true, count: updatedLeads.length }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to bulk assign agent' }
    }
}
