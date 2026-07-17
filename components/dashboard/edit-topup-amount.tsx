'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Edit, AlertCircle } from 'lucide-react'
import { createAuditLogAction } from '@/app/actions/server-actions'

interface EditTopUpAmountProps {
    offerId: string
    currentAmount: number
    clientName: string
    userRole: string
    status: string
}

export function EditTopUpAmount({
    offerId,
    currentAmount,
    clientName,
    userRole,
    status
}: EditTopUpAmountProps) {
    const router = useRouter()
    const supabase = createClient()

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState(currentAmount.toString())
    const [error, setError] = useState('')

    // Only MD or ADMIN can edit, and only when the offer is PENDING
    const isAuthorized = ['MD', 'ADMIN'].includes(userRole)
    const isPending = status === 'PENDING'

    if (!isAuthorized || !isPending) {
        return null
    }

    const validateForm = () => {
        const val = parseFloat(amount)
        if (isNaN(val) || val <= 0) {
            setError('Enter a valid amount greater than ₹0')
            return false
        }
        setError('')
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)
        try {
            const { error: updateError } = await supabase
                .from('topup_offers')
                .update({
                    offered_amount: parseFloat(amount),
                    updated_at: new Date().toISOString()
                })
                .eq('offer_id', offerId)

            if (updateError) throw updateError

            // Create audit log
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await createAuditLogAction({
                    userId: user.id,
                    action: 'LOAN_TERMS_EDIT', // Use standard action
                    entityType: 'LOAN',
                    entityId: offerId,
                    oldValue: { offered_amount: currentAmount },
                    newValue: { offered_amount: parseFloat(amount) }
                })
            }

            toast.success('Top-up offer amount updated successfully!')
            setOpen(false)
            router.refresh()
        } catch (err: any) {
            console.error('Error updating topup amount:', err)
            toast.error(err.message || 'Failed to update amount')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Override Limit
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-primary" />
                            Override Pre-Approved Limit
                        </DialogTitle>
                        <DialogDescription>
                            Manually override the offered top-up limit for {clientName}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">New Offered Limit (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={error ? 'border-red-500' : ''}
                                placeholder="Enter approved amount"
                            />
                            {error && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {error}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Save Override'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
