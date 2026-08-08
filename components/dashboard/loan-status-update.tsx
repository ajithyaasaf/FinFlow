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
import { updateLoanStatusAction } from '@/app/actions/loans'
import { LOGINS_STAGES } from '@/lib/services/loginsConstants'

const PROCESS_STAGES = LOGINS_STAGES

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
    const [newStage, setNewStage] = useState('')
    const [notes, setNotes] = useState('')

    // New fields for business logic
    const [rejectionReason, setRejectionReason] = useState('')
    const [disbursementRef, setDisbursementRef] = useState('')
    const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0])

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            // Reset form to clean default state on dialog open
            setNewStage('')
            setNotes('')
            setRejectionReason('')
            setDisbursementRef('')
            setDisbursementDate(new Date().toISOString().split('T')[0])
        }
    }

    const isDisbursementStage = newStage === 'Disbursement' || newStage === 'Disbursed'
    const isClosedStage = newStage === 'Closed' || newStage === 'Declined'

    const handleUpdate = async () => {
        if (!newStage || newStage === currentStage) {
            toast.error('Please select a new processing stage')
            return
        }

        // Validation for Closing / Rejection
        if (isClosedStage && !rejectionReason && !notes.trim()) {
            toast.error('Please provide a reason for closing/declining the loan')
            return
        }

        if (isClosedStage && rejectionReason === 'Other' && !notes.trim()) {
            toast.error('Please specify details in the notes field for "Other" reason')
            return
        }

        // Validation for Disbursement
        if (isDisbursementStage && (!disbursementRef.trim() || !disbursementDate)) {
            toast.error('Please provide transaction reference and disbursement date')
            return
        }

        setLoading(true)

        try {
            const res = await updateLoanStatusAction({
                loanId,
                newStage,
                currentStage,
                notes: notes.trim(),
                rejectionReason: rejectionReason || notes.trim(),
                disbursementRef: disbursementRef.trim(),
                disbursementDate,
                loanAmount,
                interestRate,
                tenure,
            })

            if (!res.success) {
                throw new Error(res.error || 'Failed to update loan status')
            }

            toast.success(`Loan status updated to: ${newStage}`)
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            console.error('Update error:', error)
            toast.error(error.message || 'Failed to update loan status')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => handleOpenChange(true)} size="sm">
                Update Status
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
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
                                    <SelectValue placeholder="Select new stage..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROCESS_STAGES.map((stage) => {
                                        const isCurrent = stage === currentStage
                                        return (
                                            <SelectItem key={stage} value={stage} disabled={isCurrent}>
                                                {stage} {isCurrent ? '(Current)' : ''}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditional Fields: Disbursement */}
                        {isDisbursementStage && (
                            <div className="p-4 bg-primary/5 rounded-lg space-y-3 border border-primary/10">
                                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
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
                        {isClosedStage && (
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
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={loading || !newStage || newStage === currentStage}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Updating...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
