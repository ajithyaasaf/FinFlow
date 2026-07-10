'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { rejectQuotationAction } from '@/app/actions/loan'

interface RejectQuotationDialogProps {
    quotationId: string
    clientName: string
}

export function RejectQuotationDialog({ quotationId, clientName }: RejectQuotationDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [reason, setReason] = useState('')

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) {
            toast.error('Please enter a reason for rejection')
            return
        }

        setLoading(true)
        try {
            const res = await rejectQuotationAction({
                quotationId,
                reason: reason.trim()
            })

            if (res.success) {
                toast.success('Quotation rejected successfully')
                setOpen(false)   // Close immediately
                setReason('')    // Reset immediately
                router.refresh() // Refresh list in background
            } else {
                toast.error(res.error || 'Failed to reject quotation')
            }
        } catch (error) {
            console.error('Error rejecting quotation:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                    <Ban className="h-4 w-4 mr-1.5" />
                    Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 font-bold">Reject Quotation</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Provide a clear reason for rejecting the quotation for <strong>{clientName}</strong>. This feedback will be shown directly to the staff.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReject} className="space-y-4 py-3">
                    <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-semibold text-gray-700">
                            Rejection Reason
                        </label>
                        <textarea
                            id="reason"
                            rows={4}
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none bg-white text-gray-900"
                            placeholder="Specify why this quotation is rejected (e.g., interest rate too low, high risk profile, incorrect documents, etc.)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
