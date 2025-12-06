import { createClient } from '@/lib/supabase/server'
import { DocumentReupload } from '@/components/agent/document-reupload'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ChevronLeft, AlertCircle, CheckCircle, Clock,
    Calendar, CreditCard, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { EMISchedule } from '@/types'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

// Separate data fetching function for clean architecture
async function getLoanWithEMI(supabase: any, loanId: string) {
    // Fetch loan with documents
    const { data: loan, error: loanError } = await supabase
        .from('loan_applications')
        .select(`
            *,
            documents:loan_documents(*)
        `)
        .eq('loan_id', loanId)
        .single()

    if (loanError || !loan) return { loan: null, client: null, emiSchedule: [] }

    // Fetch client
    const { data: client } = await supabase
        .from('clients')
        .select('client_id, full_name, onboarding_agent_id')
        .eq('client_id', loan.client_id)
        .single()

    // Fetch EMI schedule if loan is disbursed
    let emiSchedule: EMISchedule[] = []
    if (loan.process_stage === 'Disbursed') {
        const { data: schedule } = await supabase
            .from('emi_schedule')
            .select('*')
            .eq('loan_id', loanId)
            .order('emi_number', { ascending: true })

        emiSchedule = schedule || []
    }

    return { loan, client, emiSchedule }
}

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
    const nextDue = schedule.find(e => e.status === 'PENDING' || e.status === 'OVERDUE')

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

export default async function AgentLoanDetailsPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { loan, client, emiSchedule } = await getLoanWithEMI(supabase, id)

    // Error: Loan not found
    if (!loan) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                    <Link href="/agent/clients">
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
                            <Link href="/agent/clients" className="text-sm text-red-700 underline mt-2 inline-block">
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
                    <Link href="/agent/clients">
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
                            <Link href="/agent/clients" className="text-sm text-yellow-700 underline mt-2 inline-block">
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
                <Link href="/agent/clients">
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
                                {emiSchedule.slice(0, 6).map((emi) => (
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

