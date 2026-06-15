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

    // 2. Create the loan application
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

    // 3. Link quotation to loan
    const { error: quoteUpdateError } = await supabase
        .from('quotations')
        .update({ converted_to_loan_id: loan.loan_id })
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

    // 4. Log audit event
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

    // 5. Revalidate dashboards to reflect changes
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')

    return { success: true, loanId: loan.loan_id }
}
