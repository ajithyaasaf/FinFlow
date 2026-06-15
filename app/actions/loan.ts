'use server'

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit-logger'
import { revalidatePath } from 'next/cache'

interface ConvertQuoteToLoanParams {
    quotationId: string
    clientId: string
    amount: number
    interestRate: number
    tenure: number
}

export async function convertQuotationToLoanAction(params: ConvertQuoteToLoanParams) {
    const supabase = await createClient()

    // 1. Get current logged-in user for audit logging
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // 2. Validate quotation status before conversion
    const { data: quote, error: quoteFetchError } = await supabase
        .from('quotations')
        .select('status, converted_to_loan_id')
        .eq('quote_id', params.quotationId)
        .single()

    if (quoteFetchError || !quote) {
        return { success: false, error: 'Quotation not found' }
    }

    if (quote.status === 'REJECTED') {
        return { success: false, error: 'Cannot convert a rejected quotation to a loan.' }
    }

    if (quote.status === 'CONVERTED' || quote.converted_to_loan_id) {
        return { success: false, error: 'Quotation has already been converted to a loan.' }
    }

    // 3. Create the loan application
    const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .insert({
            client_id: params.clientId,
            amount: params.amount,
            interest_rate: params.interestRate,
            tenure: params.tenure,
            process_stage: 'Application Submitted',
        })
        .select()
        .single()

    if (loanError || !loan) {
        console.error('Failed to create loan application:', loanError)
        return { success: false, error: loanError?.message || 'Failed to create loan application' }
    }

    // 4. Link quotation to loan and update status
    const { error: quoteUpdateError } = await supabase
        .from('quotations')
        .update({ 
            converted_to_loan_id: loan.loan_id,
            status: 'CONVERTED'
        })
        .eq('quote_id', params.quotationId)

    if (quoteUpdateError) {
        console.error('Failed to link quotation to loan:', quoteUpdateError)
        
        // Manual rollback: delete the created loan to ensure mutational atomicity
        await supabase
            .from('loan_applications')
            .delete()
            .eq('loan_id', loan.loan_id)

        return { success: false, error: 'Failed to link quotation to loan. Operation rolled back.' }
    }

    // 5. Log audit event
    try {
        await createAuditLog({
            userId: user.id,
            action: 'LOAN_CREATED',
            entityType: 'LOAN',
            entityId: loan.loan_id,
            newValue: {
                quotation_id: params.quotationId,
                client_id: params.clientId,
                amount: params.amount,
                interest_rate: params.interestRate,
                tenure: params.tenure
            }
        })
    } catch (auditError) {
        console.error('Failed to write audit log:', auditError)
        // Don't fail the transaction if only audit logging failed
    }

    // 6. Revalidate dashboards to reflect changes
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    revalidatePath('/dashboard/quotations')

    return { success: true, loanId: loan.loan_id }
}

interface RejectQuotationParams {
    quotationId: string
    reason: string
}

export async function rejectQuotationAction(params: RejectQuotationParams) {
    const supabase = await createClient()

    // 1. Get current logged-in user for audit logging
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // 2. Update the quotation status and rejection reason
    const { error } = await supabase
        .from('quotations')
        .update({
            status: 'REJECTED',
            rejection_reason: params.reason
        })
        .eq('quote_id', params.quotationId)

    if (error) {
        console.error('Failed to reject quotation:', error)
        return { success: false, error: error.message || 'Failed to reject quotation' }
    }

    // 3. Log audit event
    try {
        await createAuditLog({
            userId: user.id,
            action: 'QUOTATION_REJECTED',
            entityType: 'QUOTATION',
            entityId: params.quotationId,
            newValue: {
                rejection_reason: params.reason
            }
        })
    } catch (auditError) {
        console.error('Failed to write audit log:', auditError)
    }

    // 4. Revalidate dashboards to reflect changes
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/quotations')

    return { success: true }
}
