'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertTriangle } from 'lucide-react'
import { createAuditLogAction } from '@/app/actions/server-actions'
import { createNotificationAction } from '@/app/actions/server-actions'
import { generateEMISchedule } from '@/lib/emi-calculator'
import { format } from 'date-fns'

const PROCESS_STAGES = [
    'Application Submitted',
    'Document Verification',
    'Credit Appraisal',
    'Approval',
    'Disbursement',
    'Closed'
] as const

interface LoanStatusUpdateProps {
    loanId: string
    currentStage: string
    clientName: string
    // Loan terms for EMI generation
    loanAmount?: number
    interestRate?: number
    tenure?: number
    agentId?: string | null
}

export function LoanStatusUpdate({
    loanId,
    currentStage,
    clientName,
    loanAmount,
    interestRate,
    tenure,
    agentId
}: LoanStatusUpdateProps) {
    const router = useRouter()
    const supabase = createClient()

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newStage, setNewStage] = useState(currentStage)
    const [notes, setNotes] = useState('')

    // New fields for business logic
    const [rejectionReason, setRejectionReason] = useState('')
    const [disbursementRef, setDisbursementRef] = useState('')
    const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0])

    const handleUpdate = async () => {
        if (newStage === currentStage) {
            toast.error('Please select a different stage')
            return
        }

        // Validation
        if (newStage === 'Closed' && !rejectionReason && !notes) {
            toast.error('Please provide a reason for closing/rejecting the loan')
            return
        }

        if (newStage === 'Disbursement' && (!disbursementRef || !disbursementDate)) {
            toast.error('Please provide disbursement details')
            return
        }

        setLoading(true)

        try {
            const updateData: any = {
                process_stage: newStage,
                updated_at: new Date().toISOString(),
            }

            // Add conditional fields
            if (newStage === 'Closed') {
                updateData.rejection_reason = rejectionReason || notes
            }

            if (newStage === 'Disbursement') {
                updateData.disbursement_reference = disbursementRef
                updateData.disbursement_date = new Date(disbursementDate).toISOString()
            }

            const { error } = await supabase
                .from('loan_applications')
                .update(updateData)
                .eq('loan_id', loanId)

            if (error) throw error

            // Generate EMI schedule when disbursing
            if (newStage === 'Disbursement' && loanAmount && interestRate && tenure) {
                const disbursementDateObj = new Date(disbursementDate)
                const schedule = generateEMISchedule(
                    loanAmount,
                    interestRate,
                    tenure,
                    disbursementDateObj
                )

                // Insert EMI schedule into database
                const scheduleData = schedule.map(item => ({
                    loan_id: loanId,
                    emi_number: item.emiNumber,
                    due_date: format(item.dueDate, 'yyyy-MM-dd'),
                    emi_amount: item.emiAmount,
                    principal_component: item.principalComponent,
                    interest_component: item.interestComponent,
                    outstanding_principal: item.outstandingPrincipal,
                    status: 'PENDING'
                }))

                const { error: scheduleError } = await supabase
                    .from('emi_schedule')
                    .insert(scheduleData)

                if (scheduleError) {
                    console.error('EMI schedule creation error:', scheduleError)
                    // Don't throw - loan is already marked as disbursed
                    toast.error('Warning: EMI schedule generation failed. Please check manually.')
                } else {
                    toast.success(`EMI schedule created with ${tenure} installments`)
                }
            }

            // Create audit log
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await createAuditLogAction({
                    userId: user.id,
                    action: 'LOAN_STATUS_CHANGE',
                    entityType: 'LOAN',
                    entityId: loanId,
                    oldValue: { process_stage: currentStage },
                    newValue: updateData,
                })
            }

            // Send notification to agent
            const { data: loanData } = await supabase
                .from('loan_applications')
                .select(`
                    client_id,
                    clients!inner (
                        onboarding_agent_id,
                        full_name
                    )
                `)
                .eq('loan_id', loanId)
                .single()

            if (loanData?.clients) {
                const client = loanData.clients as any
                if (client.onboarding_agent_id) {
                    await createNotificationAction({
                        userId: client.onboarding_agent_id,
                        title: 'Loan Status Updated',
                        message: `Loan for ${client.full_name} moved to ${newStage}`,
                        type: 'INFO',
                        entityType: 'LOAN',
                        entityId: loanId,
                        linkUrl: `/agent/clients`,
                    })
                }
            }

            toast.success(`Loan status updated to: ${newStage}`)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update loan status')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} size="sm">
                Update Status
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Update Loan Status</DialogTitle>
                        <DialogDescription>
                            Change the processing stage for {clientName}'s loan application
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Stage</Label>
                            <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
                                {currentStage}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>New Stage *</Label>
                            <Select value={newStage} onValueChange={setNewStage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select new stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROCESS_STAGES.map((stage) => (
                                        <SelectItem key={stage} value={stage} disabled={stage === currentStage}>
                                            {stage}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditional Fields: Disbursement */}
                        {newStage === 'Disbursement' && (
                            <div className="p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-100">
                                <h4 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Disbursement Details Required
                                </h4>

                                <div className="space-y-2">
                                    <Label className="text-xs">Transaction Reference (UTR/Cheque No) *</Label>
                                    <Input
                                        placeholder="e.g. UTR123456789"
                                        value={disbursementRef}
                                        onChange={(e) => setDisbursementRef(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Disbursement Date *</Label>
                                    <Input
                                        type="date"
                                        value={disbursementDate}
                                        onChange={(e) => setDisbursementDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Conditional Fields: Rejection/Closing */}
                        {newStage === 'Closed' && (
                            <div className="p-4 bg-red-50 rounded-lg space-y-3 border border-red-100">
                                <h4 className="font-semibold text-sm text-red-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Closing / Rejection Reason
                                </h4>

                                <div className="space-y-2">
                                    <Label className="text-xs">Reason for Closing *</Label>
                                    <Select value={rejectionReason} onValueChange={setRejectionReason}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Loan Repaid">Loan Fully Repaid</SelectItem>
                                            <SelectItem value="Rejected - Low CIBIL">Rejected - Low CIBIL Score</SelectItem>
                                            <SelectItem value="Rejected - Income Insufficient">Rejected - Income Insufficient</SelectItem>
                                            <SelectItem value="Rejected - Documents Invalid">Rejected - Documents Invalid</SelectItem>
                                            <SelectItem value="Withdrawn by Client">Withdrawn by Client</SelectItem>
                                            <SelectItem value="Other">Other (Specify in notes)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notes / Comments</Label>
                            <Textarea
                                placeholder="Add any additional notes about this status change..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={loading || newStage === currentStage}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Update Status' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
