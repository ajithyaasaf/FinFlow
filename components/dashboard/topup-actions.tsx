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
import { CheckCircle, X, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface TopUpActionsProps {
    offerId: string
    clientName: string
    amount: number
    clientId: string
    loanId: string
    userRole?: string
}

export function TopUpActions({ offerId, clientName, amount, clientId, loanId, userRole = 'STAFF' }: TopUpActionsProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [showConvertDialog, setShowConvertDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    /**
     * Gap 5 Fix: "Convert to Loan" handoff.
     * Instead of silently creating a loan in the background, we:
     * 1. Mark the offer as ACCEPTED (so it disappears from the pending list)
     * 2. Redirect the agent to the standard CreateLoan page with pre-filled URL params
     *    so they can review the amount, tenure, and rate before submitting.
     * Gap 6 Fix: The redirect URL includes disbursement_type=Repeat so the form
     *    is pre-locked to "Repeat (Top-Up)" and the Logins Hub analytics are correct.
     */
    const handleConvert = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('topup_offers')
                .update({
                    status: 'ACCEPTED',
                    accepted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('offer_id', offerId)

            if (error) throw error

            toast.success('Offer accepted! Redirecting to loan creation form...')
            setShowConvertDialog(false)

            // Redirect to CreateLoan page with pre-filled query params
            // The form will read these and lock/prefill the relevant fields
            const params = new URLSearchParams({
                client_id: clientId,
                topup_offer_id: offerId,
                max_amount: String(amount),
                disbursement_type: 'Repeat',
                original_loan_id: loanId,
            })
            
            const targetUrl = userRole === 'STAFF' 
                ? `/staff/loans/new?${params.toString()}`
                : `/dashboard/loans/new?${params.toString()}`
                
            router.push(targetUrl)
        } catch (error) {
            console.error('Convert error:', error)
            toast.error('Failed to accept top-up offer')
            setLoading(false)
        }
    }

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
                    rejection_reason: rejectionReason.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('offer_id', offerId)

            if (error) throw error

            toast.success('Offer marked as rejected.')
            setShowRejectDialog(false)
            router.refresh()
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
                        className="w-full gap-2"
                        onClick={() => setShowConvertDialog(true)}
                    >
                        <ArrowRight className="h-4 w-4" />
                        Convert to Loan
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

            {/* Convert Dialog */}
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convert to Loan Application</DialogTitle>
                        <DialogDescription>
                            This will accept the offer and take you to the loan creation form,
                            pre-filled for <strong>{clientName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                            <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                                <CheckCircle className="h-4 w-4" />
                                What happens next:
                            </div>
                            <ul className="text-sm text-green-700 space-y-1 ml-6 list-disc">
                                <li>This offer is marked as <strong>Accepted</strong></li>
                                <li>You are taken to the Loan Form — pre-filled with client details</li>
                                <li>You can enter the desired loan amount</li>
                                <li>The loan is tagged as <strong>Top-Up (Repeat)</strong> for analytics</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConvertDialog(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleConvert} disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Yes, Convert to Loan
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
                            Record why the client declined. This helps improve future outreach.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason *</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g. Not interested, Doesn't need funds, Wrong number..."
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
