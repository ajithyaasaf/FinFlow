'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Edit, AlertTriangle } from 'lucide-react'
import { calculateEMI, formatCurrency } from '@/lib/utils'
import { createAuditLogAction } from '@/app/actions/server-actions'

interface EditLoanTermsProps {
    loanId: string
    currentAmount: number
    currentRate: number
    currentTenure: number
    originalAmount?: number | null
    originalRate?: number | null
    originalTenure?: number | null
    clientName: string
    currentStage: string
}

export function EditLoanTerms({
    loanId,
    currentAmount,
    currentRate,
    currentTenure,
    originalAmount,
    originalRate,
    originalTenure,
    clientName,
    currentStage
}: EditLoanTermsProps) {
    const router = useRouter()
    const supabase = createClient()

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: currentAmount.toString(),
        rate: currentRate.toString(),
        tenure: currentTenure.toString(),
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    // Check if editing is allowed based on current stage
    const canEdit = ['Application Submitted', 'Document Verification', 'Credit Appraisal'].includes(currentStage)

    // Calculate new EMI
    const newEMI = calculateEMI(
        parseFloat(formData.amount) || 0,
        parseFloat(formData.rate) || 0,
        parseInt(formData.tenure) || 0
    )

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        const amount = parseFloat(formData.amount)
        const rate = parseFloat(formData.rate)
        const tenure = parseInt(formData.tenure)

        if (isNaN(amount) || amount < 10000) {
            newErrors.amount = 'Minimum amount is ₹10,000'
        }

        if (isNaN(rate) || rate < 1 || rate > 36) {
            newErrors.rate = 'Rate must be between 1% and 36%'
        }

        if (isNaN(tenure) || tenure < 1 || tenure > 360) {
            newErrors.tenure = 'Tenure must be between 1 and 360 months'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase
                .from('loan_applications')
                .update({
                    // Store original values if not already stored
                    original_amount: originalAmount || currentAmount,
                    original_rate: originalRate || currentRate,
                    original_tenure: originalTenure || currentTenure,
                    // Update with new values
                    amount: parseFloat(formData.amount),
                    interest_rate: parseFloat(formData.rate),
                    tenure: parseInt(formData.tenure),
                    updated_at: new Date().toISOString(),
                })
                .eq('loan_id', loanId)

            if (error) throw error

            // Create audit log
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await createAuditLogAction({
                    userId: user.id,
                    action: 'LOAN_TERMS_EDIT',
                    entityType: 'LOAN',
                    entityId: loanId,
                    oldValue: {
                        amount: currentAmount,
                        interest_rate: currentRate,
                        tenure: currentTenure,
                    },
                    newValue: {
                        amount: parseFloat(formData.amount),
                        interest_rate: parseFloat(formData.rate),
                        tenure: parseInt(formData.tenure),
                    },
                })
            }

            toast.success('Loan terms updated successfully!')
            setOpen(false)       // Close immediately
            router.refresh()     // Refresh loan details in background
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update loan terms')
        } finally {
            setLoading(false)
        }
    }

    if (!canEdit) {
        return null
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Terms
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit Loan Terms
                        </DialogTitle>
                        <DialogDescription>
                            Modify the loan terms for {clientName}'s application
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        {/* Warning about original values */}
                        {(originalAmount || originalRate || originalTenure) && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                                <div className="flex gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-amber-800">
                                        <p className="font-semibold">Original Request:</p>
                                        <p>
                                            {formatCurrency(originalAmount || 0)} at {originalRate}% for {originalTenure} months
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Sanctioned Amount (₹) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className={errors.amount ? 'border-red-500' : ''}
                                    step="1000"
                                />
                                {errors.amount && (
                                    <p className="text-sm text-red-500">{errors.amount}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate">Interest Rate (% p.a.) *</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    value={formData.rate}
                                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                    className={errors.rate ? 'border-red-500' : ''}
                                    step="0.1"
                                />
                                {errors.rate && (
                                    <p className="text-sm text-red-500">{errors.rate}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tenure">Tenure (months) *</Label>
                                <Input
                                    id="tenure"
                                    type="number"
                                    value={formData.tenure}
                                    onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                                    className={errors.tenure ? 'border-red-500' : ''}
                                />
                                {errors.tenure && (
                                    <p className="text-sm text-red-500">{errors.tenure}</p>
                                )}
                            </div>

                            {/* New EMI Preview */}
                            {newEMI > 0 && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm text-gray-600 mb-1">New Monthly EMI</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(newEMI)}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
