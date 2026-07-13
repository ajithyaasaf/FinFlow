'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DocumentReupload } from '@/components/agent/document-reupload'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ChevronLeft, AlertCircle, CheckCircle, Clock,
    Calendar, CreditCard, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import type { EMISchedule } from '@/types'

// EMI Status Badge Component
function EMIStatusBadge({ status }: { status: string }) {
    const config: Record<string, { variant: any; icon: any }> = {
        PAID: { variant: 'default', icon: CheckCircle },
        PENDING: { variant: 'secondary', icon: Clock },
        OVERDUE: { variant: 'destructive', icon: AlertCircle },
        PARTIAL: { variant: 'outline', icon: CreditCard }
    }

    const { variant, icon: Icon } = config[status] || config.PENDING

    return (
        <Badge variant={variant} className="gap-1 text-xs">
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    )
}

// EMI Summary Card Component
function EMISummaryCard({ schedule }: { schedule: EMISchedule[] }) {
    const paid = schedule.filter(e => e.status === 'PAID').length
    const overdue = schedule.filter(e => e.status === 'OVERDUE').length
    const pending = schedule.filter(e => e.status === 'PENDING').length

    return (
        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 uppercase">Paid</p>
                <p className="text-xl font-bold text-green-700">{paid}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-600 uppercase">Pending</p>
                <p className="text-xl font-bold text-gray-700">{pending}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-xs text-red-600 uppercase">Overdue</p>
                <p className="text-xl font-bold text-red-700">{overdue}</p>
            </div>
        </div>
    )
}

export default function AgentLoanDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [loan, setLoan] = useState<any>(null)
    const [client, setClient] = useState<any>(null)
    const [emiSchedule, setEmiSchedule] = useState<EMISchedule[]>([])

    useEffect(() => {
        if (!id) return

        async function loadData() {
            setLoading(true)
            try {
                const supabase = createClient()

                // Check auth
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // Fetch loan with documents
                const { data: loanData, error: loanError } = await supabase
                    .from('loan_applications')
                    .select(`
                        *,
                        documents:loan_documents(*)
                    `)
                    .eq('loan_id', id)
                    .single()

                if (loanError || !loanData) {
                    setLoan(null)
                    setLoading(false)
                    return
                }

                // Fetch client and EMI schedule in parallel
                const [clientRes, emiRes] = await Promise.all([
                    supabase
                        .from('clients')
                        .select('client_id, full_name, onboarding_agent_id')
                        .eq('client_id', loanData.client_id)
                        .single(),
                    loanData.process_stage === 'Disbursed'
                        ? supabase
                            .from('emi_schedule')
                            .select('*')
                            .eq('loan_id', id)
                            .order('emi_number', { ascending: true })
                        : Promise.resolve({ data: [] })
                ])

                setLoan(loanData)
                setClient(clientRes.data || null)
                setEmiSchedule(emiRes.data || [])
            } catch (err) {
                console.error('Failed to load agent loan details:', err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [id, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div>
                        <Skeleton className="h-5 w-32 rounded-lg" />
                        <Skeleton className="h-3 w-20 rounded-lg mt-1" />
                    </div>
                </header>
                <main className="p-4 space-y-4">
                    {/* Status & Amount Card Skeleton */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-12 rounded-lg" />
                            <Skeleton className="h-5 w-20 rounded-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-16 rounded-lg" />
                                    <Skeleton className="h-5 w-24 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Documents Skeleton */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                        <Skeleton className="h-5 w-24 rounded-lg" />
                        <div className="space-y-2 pt-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <Skeleton className="h-4 w-32 rounded-lg" />
                                    <Skeleton className="h-8 w-20 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // Error: Loan not found
    if (!loan) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                    <Link href="/staff/clients">
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Loan Details</h1>
                </header>
                <main className="p-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                            <h2 className="font-semibold text-red-800">Loan Not Found</h2>
                            <p className="text-sm text-red-600 mt-1">
                                This loan may not exist or you may not have permission to view it.
                            </p>
                            <Link href="/staff/clients" className="text-sm text-red-700 underline mt-2 inline-block">
                                Back to Clients
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // Error: Access denied (RLS blocking)
    if (!client) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                    <Link href="/staff/clients">
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Loan Details</h1>
                </header>
                <main className="p-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                            <h2 className="font-semibold text-yellow-800">Access Denied</h2>
                            <p className="text-sm text-yellow-600 mt-1">
                                You can only view loans for clients you onboarded.
                            </p>
                            <Link href="/staff/clients" className="text-sm text-yellow-700 underline mt-2 inline-block">
                                Back to Clients
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    const isDisbursed = loan.process_stage === 'Disbursed'

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                <Link href="/staff/clients">
                    <ChevronLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Loan Details</h1>
                    <p className="text-xs text-gray-500">{client.full_name}</p>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {/* Status & Amount Card */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-gray-500">Status</span>
                            <Badge variant={isDisbursed ? 'default' : 'secondary'}>
                                {loan.process_stage}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Amount</p>
                                <p className="font-semibold text-lg">{formatCurrency(loan.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Tenure</p>
                                <p className="font-semibold text-lg">{loan.tenure} months</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Interest Rate</p>
                                <p className="font-semibold text-lg">{loan.interest_rate}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Loan ID</p>
                                <p className="font-mono text-xs text-gray-600">{loan.loan_id.slice(0, 8)}...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* EMI Schedule Section - Only for Disbursed Loans */}
                {isDisbursed && emiSchedule.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Payment Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EMISummaryCard schedule={emiSchedule} />

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {emiSchedule.slice(0, 6).map((emi: EMISchedule) => (
                                    <div
                                        key={emi.schedule_id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-sm">#{emi.emi_number}</span>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Due: {formatDate(emi.due_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm">{formatCurrency(emi.emi_amount)}</p>
                                            <EMIStatusBadge status={emi.status} />
                                        </div>
                                    </div>
                                ))}
                                {emiSchedule.length > 6 && (
                                    <p className="text-xs text-center text-gray-500 pt-2">
                                        +{emiSchedule.length - 6} more EMIs
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Documents Section */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DocumentReupload documents={loan.documents || []} loanId={loan.loan_id} />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
