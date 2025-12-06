'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { EMISchedule } from '@/types'
import { RecordPaymentModal } from './record-payment-modal'

interface EMIScheduleListProps {
    schedule: EMISchedule[]
    loanId: string
}

export function EMIScheduleList({ schedule, loanId }: EMIScheduleListProps) {
    if (schedule.length === 0) {
        return (
            <p className="text-sm text-gray-500 text-center py-8">
                No EMI schedule found. Please disburse the loan first.
            </p>
        )
    }

    return (
        <div className="space-y-2">
            {schedule.map((emi) => (
                <EMIScheduleRow key={emi.schedule_id} emi={emi} loanId={loanId} />
            ))}
        </div>
    )
}

function EMIScheduleRow({ emi, loanId }: { emi: EMISchedule; loanId: string }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; color: string }> = {
            PAID: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            PENDING: { variant: 'secondary' as const, icon: Clock, color: 'text-gray-600' },
            OVERDUE: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
            PARTIAL: { variant: 'outline' as const, icon: DollarSign, color: 'text-orange-600' }
        }

        const { variant, icon: Icon, color } = variants[status] || variants.PENDING

        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        )
    }

    return (
        <>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">#{emi.emi_number}</span>
                        {getStatusBadge(emi.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        Due: {formatDate(emi.due_date)}
                    </p>
                </div>

                <div className="text-right mr-4">
                    <p className="font-semibold">{formatCurrency(emi.emi_amount)}</p>
                    {emi.late_fee > 0 && (
                        <p className="text-xs text-red-600">+₹{emi.late_fee} late fee</p>
                    )}
                </div>

                {(emi.status === 'PENDING' || emi.status === 'OVERDUE' || emi.status === 'PARTIAL') && (
                    <Button size="sm" onClick={() => setShowPaymentModal(true)}>
                        Record Payment
                    </Button>
                )}

                {emi.status === 'PAID' && emi.paid_date && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {formatDate(emi.paid_date)}
                    </div>
                )}
            </div>

            <RecordPaymentModal
                schedule={emi}
                loanId={loanId}
                open={showPaymentModal}
                onOpenChange={setShowPaymentModal}
            />
        </>
    )
}
