'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TopUpActionsProps {
    offerId: string
    clientName: string
    amount: number
    loanId: string
}

export function TopUpActions({ offerId, clientName, amount, loanId }: TopUpActionsProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    // Handle Approve Top-Up
    const handleApprove = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('topup_offers')
                .update({
                    status: 'ACCEPTED',
                    accepted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('offer_id', offerId)

            if (error) throw error

            // Create a new loan application for the top-up
            const { data: originalLoan } = await supabase
                .from('loan_applications')
                .select('client_id, interest_rate, tenure')
                .eq('loan_id', loanId)
                .single()

            if (originalLoan) {
                const { error: loanError } = await supabase
                    .from('loan_applications')
                    .insert({
                        client_id: originalLoan.client_id,
                        amount: amount,
                        interest_rate: originalLoan.interest_rate,
                        tenure: originalLoan.tenure,
                        process_stage: 'Application Submitted',
                        original_amount: amount,
                        original_rate: originalLoan.interest_rate,
                        original_tenure: originalLoan.tenure
                    })

                if (loanError) {
                    console.error('Error creating top-up loan:', loanError)
                }
            }

            toast.success('Top-up offer approved! New loan application created.')
            setShowApproveDialog(false)  // Close immediately
            router.refresh()             // Refresh in background
            router.push('/dashboard/loans')
        } catch (error) {
            console.error('Approve error:', error)
            toast.error('Failed to approve top-up offer')
        } finally {
            setLoading(false)
        }
    }

    // Handle Reject Top-Up
    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('topup_offers')
                .update({
                    status: 'REJECTED',
                    rejected_at: new Date().toISOString(),
                    rejection_reason: rejectionReason,
                    updated_at: new Date().toISOString()
                })
                .eq('offer_id', offerId)

            if (error) throw error

            toast.success('Top-up offer rejected')
            setShowRejectDialog(false)   // Close immediately
            router.refresh()             // Refresh in background
        } catch (error) {
            console.error('Reject error:', error)
            toast.error('Failed to reject top-up offer')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button
                        className="w-full"
                        variant="default"
                        onClick={() => setShowApproveDialog(true)}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Top-Up
                    </Button>
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setShowRejectDialog(true)}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Reject Offer
                    </Button>
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Top-Up Offer</DialogTitle>
                        <DialogDescription>
                            This will create a new loan application for {clientName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-green-800">
                                A new loan application of <strong>₹{amount.toLocaleString('en-IN')}</strong> will be created for this client.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowApproveDialog(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Top-Up Offer</DialogTitle>
                        <DialogDescription>
                            The client will be notified of this decision
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason *</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectDialog(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={loading || !rejectionReason.trim()}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
