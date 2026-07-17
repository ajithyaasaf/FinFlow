'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle,
    TrendingUp, Receipt, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { EMIScheduleList } from '@/components/dashboard/emi-schedule-list'
import { createClient } from '@/lib/supabase/client'
import type { EMISchedule, Payment } from '@/types'

export default function LoanPaymentsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [loan, setLoan] = useState<any>(null)
    const [schedule, setSchedule] = useState<EMISchedule[]>([])
    const [payments, setPayments] = useState<Payment[]>([])

    useEffect(() => {
        if (id) {
            router.replace(`/dashboard/loans/${id}`)
        }
    }, [id, router])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Loading payment schedule...</p>
            </div>
        )
    }

    if (!loan) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Loan Not Found</h2>
                <p className="text-sm text-gray-600">The loan ID does not exist or was deleted.</p>
                <Link href="/dashboard/loans">
                    <Button>Back to Loans</Button>
                </Link>
            </div>
        )
    }

    const client = Array.isArray(loan.client) ? loan.client[0] : loan.client

    // Calculate summary
    const totalEMIs = schedule.length
    const paidEMIs = schedule.filter(s => s.status === 'PAID').length
    const overdueEMIs = schedule.filter(s => s.status === 'OVERDUE').length

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const principalPaid = schedule
        .filter(s => s.status === 'PAID')
        .reduce((sum, s) => sum + s.principal_component, 0)

    const latestOutstanding = schedule.find(s => s.status !== 'PAID')?.outstanding_principal || 0

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/loans/${id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Payment Management</h1>
                        <p className="text-xs md:text-sm text-gray-500">{client?.full_name || 'Client'}</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Total EMIs</p>
                                <p className="text-2xl font-bold">{totalEMIs}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Paid</p>
                                <p className="text-2xl font-bold text-green-600">{paidEMIs}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{overdueEMIs}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Outstanding</p>
                                <p className="text-lg font-bold">{formatCurrency(latestOutstanding)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* EMI Schedule */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>EMI Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EMIScheduleList schedule={schedule} loanId={id} />
                        </CardContent>
                    </Card>
                </div>

                {/* Payment History */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Payment History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {payments.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        No payments recorded yet
                                    </p>
                                )}

                                {payments.map((payment) => (
                                    <div key={payment.payment_id} className="border-l-4 border-green-500 pl-3 py-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(payment.payment_date)}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{payment.payment_method}</Badge>
                                        </div>
                                        {payment.reference_number && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Ref: {payment.reference_number}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Paid</span>
                                <span className="font-semibold">{formatCurrency(totalPaid)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Principal Paid</span>
                                <span className="font-semibold">{formatCurrency(principalPaid)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Interest Paid</span>
                                <span className="font-semibold">{formatCurrency(totalPaid - principalPaid)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between">
                                <span className="font-medium">Outstanding</span>
                                <span className="font-bold text-lg">{formatCurrency(latestOutstanding)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
