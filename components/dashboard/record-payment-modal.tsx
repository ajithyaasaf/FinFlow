'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { EMISchedule, PaymentMethod } from '@/types'
import { calculateLateFee } from '@/lib/emi-calculator'

interface RecordPaymentModalProps {
    schedule: EMISchedule
    loanId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RecordPaymentModal({
    schedule,
    loanId,
    open,
    onOpenChange
}: RecordPaymentModalProps) {
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        amount: schedule.emi_amount,
        paymentDate: new Date(),
        paymentMethod: 'CASH' as PaymentMethod,
        referenceNumber: '',
        notes: ''
    })
    const [loading, setLoading] = useState(false)

    // Calculate late fee if payment is after due date
    const lateFee = formData.paymentDate > new Date(schedule.due_date)
        ? calculateLateFee(
            new Date(schedule.due_date),
            formData.paymentDate,
            schedule.emi_amount,
            { days_grace: 3, fee_percentage: 2, min_fee: 100, max_fee: 1000 }
        )
        : 0

    const totalAmount = formData.amount + lateFee

    const handleSubmit = async () => {
        if (formData.amount <= 0) {
            toast.error('Payment amount must be greater than zero')
            return
        }

        if (formData.amount < schedule.emi_amount * 0.5) {
            toast.error('Payment amount too low. Minimum 50% of EMI required')
            return
        }

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Insert payment record
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    loan_id: loanId,
                    schedule_id: schedule.schedule_id,
                    amount: totalAmount,
                    payment_date: formData.paymentDate.toISOString(),
                    payment_method: formData.paymentMethod,
                    reference_number: formData.referenceNumber || null,
                    collected_by: user?.id,
                    notes: formData.notes || null
                })

            if (paymentError) throw paymentError

            // 2. Update EMI schedule status
            const isPaidFull = formData.amount >= schedule.emi_amount
            const newStatus = isPaidFull ? 'PAID' : 'PARTIAL'

            const { error: scheduleError } = await supabase
                .from('emi_schedule')
                .update({
                    status: newStatus,
                    paid_date: formData.paymentDate.toISOString(),
                    paid_amount: (schedule.paid_amount || 0) + formData.amount,
                    late_fee: lateFee,
                    updated_at: new Date().toISOString()
                })
                .eq('schedule_id', schedule.schedule_id)

            if (scheduleError) throw scheduleError

            toast.success(`Payment of ₹${totalAmount.toLocaleString()} recorded successfully`)
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            console.error('Payment recording error:', error)
            toast.error('Failed to record payment. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        EMI #{schedule.emi_number} - Due {format(new Date(schedule.due_date), 'PPP')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* EMI Details */}
                    <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">EMI Amount</span>
                            <span className="font-semibold">₹{schedule.emi_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Principal</span>
                            <span>₹{schedule.principal_component.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Interest</span>
                            <span>₹{schedule.interest_component.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            placeholder="Enter amount"
                        />
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.paymentDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.paymentDate ? format(formData.paymentDate, 'PPP') : 'Select date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.paymentDate}
                                    onSelect={(date) => date && setFormData(prev => ({ ...prev, paymentDate: date }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label>Payment Method *</Label>
                        <Select
                            value={formData.paymentMethod}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="NEFT">NEFT</SelectItem>
                                <SelectItem value="RTGS">RTGS</SelectItem>
                                <SelectItem value="IMPS">IMPS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reference Number */}
                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference Number</Label>
                        <Input
                            id="reference"
                            value={formData.referenceNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                            placeholder="Transaction ID, Cheque No., etc."
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes..."
                            rows={2}
                        />
                    </div>

                    {/* Late Fee Warning */}
                    {lateFee > 0 && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            <p className="text-xs text-amber-800 font-medium">Late Payment Fee</p>
                            <p className="text-xs text-amber-700 mt-1">
                                ₹{lateFee.toLocaleString()} will be added to the payment amount
                            </p>
                        </div>
                    )}

                    {/* Total */}
                    <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-green-900">Total Amount</span>
                            <span className="text-lg font-bold text-green-900">
                                ₹{totalAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || formData.amount <= 0}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
