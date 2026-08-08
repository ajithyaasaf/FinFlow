'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit-logger'
import { createNotification } from '@/lib/notifications'
import { generateEMISchedule } from '@/lib/emi-calculator'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

interface UpdateLoanStatusParams {
    loanId: string
    newStage: string
    currentStage: string
    notes?: string
    rejectionReason?: string
    disbursementRef?: string
    disbursementDate?: string
    loanAmount?: number
    interestRate?: number
    tenure?: number
}

export async function updateLoanStatusAction(params: UpdateLoanStatusParams) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createAdminClient()

    const updateData: any = {
        process_stage: params.newStage,
        updated_at: new Date().toISOString(),
    }

    if (params.notes?.trim()) {
        updateData.notes = params.notes.trim()
    }

    const isClosedStage = params.newStage === 'Closed' || params.newStage === 'Declined'
    const isDisbursementStage = params.newStage === 'Disbursement' || params.newStage === 'Disbursed'

    if (isClosedStage) {
        updateData.rejection_reason = params.rejectionReason || params.notes?.trim()
    }

    if (isDisbursementStage) {
        if (params.disbursementRef?.trim()) {
            updateData.disbursement_reference = params.disbursementRef.trim()
        }
        if (params.disbursementDate) {
            updateData.disbursement_date = new Date(params.disbursementDate).toISOString()
        }
    }

    // 1. Update loan application using admin client (bypasses RLS mismatch securely)
    const { error: updateError } = await adminSupabase
        .from('loan_applications')
        .update(updateData)
        .eq('loan_id', params.loanId)

    if (updateError) {
        return { success: false, error: updateError.message }
    }

    // 2. Generate EMI schedule when disbursing
    if (isDisbursementStage && params.loanAmount && params.interestRate && params.tenure) {
        try {
            const disbursementDateObj = params.disbursementDate ? new Date(params.disbursementDate) : new Date()
            const schedule = generateEMISchedule(
                params.loanAmount,
                params.interestRate,
                params.tenure,
                disbursementDateObj
            )

            const scheduleData = schedule.map(item => ({
                loan_id: params.loanId,
                emi_number: item.emiNumber,
                due_date: format(item.dueDate, 'yyyy-MM-dd'),
                emi_amount: item.emiAmount,
                principal_component: item.principalComponent,
                interest_component: item.interestComponent,
                outstanding_principal: item.outstandingPrincipal,
                status: 'PENDING'
            }))

            await adminSupabase
                .from('emi_schedule')
                .upsert(scheduleData, { onConflict: 'loan_id,emi_number' })
        } catch (scheduleErr) {
            console.error('EMI schedule error:', scheduleErr)
        }
    }

    // 3. Create audit log
    try {
        await createAuditLog({
            userId: user.id,
            action: 'LOAN_STATUS_CHANGE',
            entityType: 'LOAN',
            entityId: params.loanId,
            oldValue: { process_stage: params.currentStage },
            newValue: updateData,
        })
    } catch (auditErr) {
        console.error('Audit log error:', auditErr)
    }

    // 4. Send notification to onboarding agent if exists
    try {
        const { data: loanInfo } = await adminSupabase
            .from('loan_applications')
            .select(`
                client_id,
                clients!inner (
                    onboarding_agent_id,
                    full_name
                )
            `)
            .eq('loan_id', params.loanId)
            .single()

        if (loanInfo && loanInfo.clients) {
            const client = loanInfo.clients as any
            if (client.onboarding_agent_id) {
                await createNotification({
                    userId: client.onboarding_agent_id,
                    title: 'Loan Status Updated',
                    message: `Loan application for ${client.full_name} has moved to ${params.newStage}.`,
                    type: isDisbursementStage ? 'SUCCESS' : isClosedStage ? 'WARNING' : 'INFO',
                    entityType: 'loan',
                    entityId: params.loanId,
                    linkUrl: `/staff/loans/${params.loanId}`
                })
            }
        }
    } catch (notifErr) {
        console.error('Notification dispatch error:', notifErr)
    }

    // 5. Revalidate all relevant cache paths
    revalidatePath('/dashboard/logins')
    revalidatePath('/dashboard/loans')
    revalidatePath('/dashboard/clients')
    revalidatePath('/staff')
    revalidatePath('/staff/loans')
    revalidatePath(`/staff/loans/${params.loanId}`)
    revalidatePath(`/dashboard/loans/${params.loanId}`)

    return { success: true }
}
