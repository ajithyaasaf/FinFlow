import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle,
    DollarSign, TrendingUp, Receipt
} from 'lucide-react'
import Link from 'next/link'
import type { EMISchedule, Payment, LoanApplication, Client } from '@/types'
import { EMIScheduleList } from '@/components/dashboard/emi-schedule-list'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

async function getLoanPaymentData(loanId: string) {
    const supabase = await createClient()

    // Get loan details
    const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select(`
      *,
      client:clients(*)
    `)
        .eq('loan_id', loanId)
        .single()

    if (loanError || !loan) return null

    // Get EMI schedule
    const { data: schedule } = await supabase
        .from('emi_schedule')
        .select('*')
        .eq('loan_id', loanId)
        .order('emi_number', { ascending: true })

    // Get payment history
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false })

    return {
        loan: loan as LoanApplication & { client: Client },
        schedule: (schedule as EMISchedule[]) || [],
        payments: (payments as Payment[]) || []
    }
}

export default async function LoanPaymentsPage({ params }: PageProps) {
    const { id } = await params
    const data = await getLoanPaymentData(id)

    if (!data) {
        notFound()
    }

    const { loan, schedule, payments } = data
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
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/loans/${id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                        <p className="text-sm text-gray-500">{client?.full_name || 'Client'}</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Total EMIs</p>
                                <p className="text-2xl font-bold">{totalEMIs}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-blue-500" />
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
