'use server'

import { createBankPartner, updateBankPartner, deleteBankPartner } from '@/lib/services/bankService'
import { createAuditLog } from '@/lib/audit-logger'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BankPartner } from '@/types'

async function verifyAdmin(supabase: any, userId: string) {
    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single()
    if (!profile || !['ADMIN', 'MD'].includes(profile.role)) {
        throw new Error('Forbidden: Admin/MD access required')
    }
}

export async function createBankPartnerAction(partnerData: Partial<BankPartner>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        await verifyAdmin(supabase, user.id)
        const partner = await createBankPartner(partnerData)
        
        await createAuditLog({
            userId: user.id,
            action: 'PARTNER_CREATED' as any,
            entityType: 'LOAN' as any,
            entityId: partner.partner_id,
            newValue: partner
        })

        revalidatePath('/dashboard/partners')
        revalidatePath('/dashboard/loans')
        return { success: true, partner }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create partner' }
    }
}

export async function updateBankPartnerAction(partnerId: string, partnerData: Partial<BankPartner>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        await verifyAdmin(supabase, user.id)
        const partner = await updateBankPartner(partnerId, partnerData)

        await createAuditLog({
            userId: user.id,
            action: 'PARTNER_UPDATED' as any,
            entityType: 'LOAN' as any,
            entityId: partnerId,
            newValue: partnerData
        })

        revalidatePath('/dashboard/partners')
        return { success: true, partner }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update partner' }
    }
}

export async function deleteBankPartnerAction(partnerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        await verifyAdmin(supabase, user.id)
        await deleteBankPartner(partnerId)

        await createAuditLog({
            userId: user.id,
            action: 'PARTNER_DELETED' as any,
            entityType: 'LOAN' as any,
            entityId: partnerId
        })

        revalidatePath('/dashboard/partners')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete partner' }
    }
}
