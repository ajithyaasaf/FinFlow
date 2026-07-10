import { createClient } from '@/lib/supabase/server'
import type { BankPartner } from '@/types'

export async function getBankPartners(): Promise<BankPartner[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bank_partners')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bank partners:', error)
        return []
    }

    return data || []
}

export async function createBankPartner(partnerData: Partial<BankPartner>): Promise<BankPartner> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bank_partners')
        .insert([partnerData])
        .select()
        .single()

    if (error) {
        console.error('Error creating bank partner:', error)
        throw error
    }

    return data
}

export async function updateBankPartner(partnerId: string, partnerData: Partial<BankPartner>): Promise<BankPartner> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bank_partners')
        .update({ ...partnerData, updated_at: new Date().toISOString() })
        .eq('partner_id', partnerId)
        .select()
        .single()

    if (error) {
        console.error('Error updating bank partner:', error)
        throw error
    }

    return data
}

export async function deleteBankPartner(partnerId: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bank_partners')
        .delete()
        .eq('partner_id', partnerId)

    if (error) {
        console.error('Error deleting bank partner:', error)
        throw error
    }

    return true
}
