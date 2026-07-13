'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateEMISchedule } from '@/lib/emi-calculator'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createAuditLogAction, createNotificationAction } from '@/app/actions/server-actions'

interface DisburseLoanModalProps {
    loanId: string
    clientId: string
    clientName: string
    amount: number
    interestRate: number
    tenure: number
    agentId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DisburseLoanModal({
    loanId,
    clientId,
    clientName,
    amount,
    interestRate,
    tenure,
    agentId,
    open,
    onOpenChange
}: DisburseLoanModalProps) {
    const router = useRouter()
    const supabase = createClient()

    const [disbursementDate, setDisbursementDate] = useState<Date>(new Date())
    const [referenceNumber, setReferenceNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'confirm' | 'processing'>('confirm')

    const handleDisburse = async () => {
        if (!disbursementDate) {
            toast.error('Please select disbursement date')
            return
        }

        setLoading(true)
        setStep('processing')

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Update loan status to Disbursed
            const { error: loanError } = await supabase
                .from('loan_applications')
                .update({
                    process_stage: 'Disbursed',
                    disbursement_date: disbursementDate.toISOString(),
                    disbursement_reference: referenceNumber || null,
                    updated_at: new Date().toISOString()
                })
                .eq('loan_id', loanId)

            if (loanError) throw loanError

            // 2. Generate EMI schedule
            const schedule = generateEMISchedule(
                amount,
                interestRate,
                tenure,
                disbursementDate
            )

            // 3. Insert EMI schedule into database
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

            if (scheduleError) throw scheduleError

            // 4. Create audit log
            if (user) {
                await createAuditLogAction({
                    userId: user.id,
                    action: 'LOAN_DISBURSED',
                    entityType: 'LOAN',
                    entityId: loanId,
                    oldValue: { process_stage: 'Disbursement Ready' },
                    newValue: {
                        process_stage: 'Disbursed',
                        disbursement_date: disbursementDate.toISOString(),
                        emi_count: tenure
                    }
                })
            }

            // 5. Notify staff
            if (agentId) {
                await createNotificationAction({
                    userId: agentId,
                    title: 'Loan Disbursed',
                    message: `Loan of ₹${amount.toLocaleString()} for ${clientName} has been disbursed`,
                    type: 'SUCCESS',
                    entityType: 'LOAN',
                    entityId: loanId,
                    linkUrl: `/dashboard/loans/${loanId}`
                })
            }

            toast.success('Loan disbursed successfully!')
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            console.error('Disbursement error:', error)
            toast.error('Failed to disburse loan. Please try again.')
            setStep('confirm')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Disburse Loan</DialogTitle>
                    <DialogDescription>
                        This will mark the loan as disbursed and generate the EMI repayment schedule
                    </DialogDescription>
                </DialogHeader>

                {step === 'confirm' && (
                    <div className="space-y-4 py-4">
                        {/* Loan Summary */}
                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg space-y-2">
                            <h4 className="font-semibold text-sm text-primary">Loan Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-600">Client</p>
                                    <p className="font-semibold">{clientName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Amount</p>
                                    <p className="font-semibold">₹{amount.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Interest Rate</p>
                                    <p className="font-semibold">{interestRate}% p.a.</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Tenure</p>
                                    <p className="font-semibold">{tenure} months</p>
                                </div>
                            </div>
                        </div>

                        {/* Disbursement Date */}
                        <div className="space-y-2">
                            <Label htmlFor="disbursement-date">Disbursement Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !disbursementDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {disbursementDate ? format(disbursementDate, 'PPP') : 'Select date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={disbursementDate}
                                        onSelect={(date) => date && setDisbursementDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Reference Number */}
                        <div className="space-y-2">
                            <Label htmlFor="reference">Reference Number (Optional)</Label>
                            <Input
                                id="reference"
                                placeholder="e.g., TXN123456"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                            />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            <p className="text-xs text-amber-800">
                                <strong>Note:</strong> This action will:
                            </p>
                            <ul className="text-xs text-amber-700 mt-1 ml-4 list-disc">
                                <li>Mark loan as "Disbursed"</li>
                                <li>Generate {tenure} EMI payments</li>
                                <li>Start repayment tracking</li>
                                <li>Notify the staff member</li>
                            </ul>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-8 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="font-medium">Processing Disbursement...</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Generating EMI schedule and updating records
                            </p>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDisburse}
                            disabled={loading || !disbursementDate}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Disbursement
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
