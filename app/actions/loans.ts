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
    revalidatePath('/dashboard/leads')
    revalidatePath('/staff')
    revalidatePath('/staff/loans')
    revalidatePath('/staff/leads')
    revalidatePath(`/staff/loans/${params.loanId}`)
    revalidatePath(`/dashboard/loans/${params.loanId}`)

    return { success: true }
}

/**
 * Fetch chronological activity and audit history for a loan application
 */
export async function getLoanAuditLogsAction(loanId: string) {
    const adminSupabase = createAdminClient()

    try {
        const { data, error } = await adminSupabase
            .from('system_logs')
            .select(`
                log_id,
                action_type,
                old_value,
                new_value,
                created_at,
                user:app_users (
                    full_name,
                    email,
                    role,
                    is_tl
                )
            `)
            .eq('entity_type', 'LOAN')
            .eq('entity_id', loanId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching loan audit logs:', error)
            return { success: false, logs: [] }
        }

        return { success: true, logs: data || [] }
    } catch (err: any) {
        console.error('getLoanAuditLogsAction exception:', err)
        return { success: false, logs: [] }
    }
}

interface CreateLoanParams {
    clientId: string
    amount: number
    interestRate: number
    tenure: number
    region?: string
    disbursementType?: string
    assignedTlId?: string | null
    bankPartnerId?: string | null
    productName?: string | null
    loginReferenceNumber?: string | null
    originalRequestDate?: string | null
    panNumber?: string
    aadhaarNumber?: string
}

/**
 * Server action to create loan applications with instant audit logging and cache invalidation
 */
export async function createLoanAction(params: CreateLoanParams) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createAdminClient()

    // 1. Update client identity if provided
    if (params.panNumber || params.aadhaarNumber) {
        await adminSupabase
            .from('clients')
            .update({
                pan_number: params.panNumber?.toUpperCase().trim() || null,
                aadhaar_number: params.aadhaarNumber?.replace(/\D/g, '').trim() || null,
            })
            .eq('client_id', params.clientId)
    }

    // 2. Insert loan application
    const payload: any = {
        client_id: params.clientId,
        amount: params.amount,
        interest_rate: params.interestRate,
        tenure: params.tenure,
        process_stage: 'Application Submitted',
        region: params.region || 'Madurai',
        disbursement_type: params.disbursementType || 'New',
        assigned_tl_id: params.assignedTlId || null,
        bank_partner_id: params.bankPartnerId || null,
        product_name: params.productName || null,
        login_reference_number: params.loginReferenceNumber || null,
        original_request_date: params.originalRequestDate || null,
    }

    const { data: loan, error } = await adminSupabase
        .from('loan_applications')
        .insert(payload)
        .select()
        .single()

    if (error || !loan) {
        return { success: false, error: error?.message || 'Failed to create loan' }
    }

    // 3. Create initial audit log
    try {
        await createAuditLog({
            userId: user.id,
            action: 'LOAN_CREATED',
            entityType: 'LOAN',
            entityId: loan.loan_id,
            newValue: {
                amount: params.amount,
                interest_rate: params.interestRate,
                tenure: params.tenure,
                process_stage: 'Application Submitted',
                region: params.region || 'Madurai',
                disbursement_type: params.disbursementType || 'New',
                reference_number: params.loginReferenceNumber || null,
            }
        })
    } catch (auditErr) {
        console.error('Failed to create initial loan audit log:', auditErr)
    }

    // 4. Invalidate caches
    revalidatePath('/dashboard/loans')
    revalidatePath('/dashboard/logins')
    revalidatePath('/dashboard/reports')
    revalidatePath('/staff/loans')
    revalidatePath('/staff/leads')

    return { success: true, loanId: loan.loan_id }
}
