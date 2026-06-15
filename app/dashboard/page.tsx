import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConvertToLoan } from '@/components/dashboard/convert-to-loan'
import { AlertCircle, TrendingUp, Download, FileText, Phone, Calendar, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { getUnconvertedQuotations } from '@/lib/services/quotationService'
import { getLoanDashboardStats } from '@/lib/services/loanService'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Run all database calls in parallel to resolve waterfalls
    const [userDataRes, statsRes, quotations] = await Promise.all([
        supabase
            .from('app_users')
            .select('full_name')
            .eq('id', user!.id)
            .single(),
        getLoanDashboardStats(),
        getUnconvertedQuotations()
    ])

    const userData = userDataRes.data
    const highValueQuotes = quotations.filter(q => q.is_high_value)
    
    const stats = {
        ...statsRes,
        highValueQuotes: highValueQuotes.length
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Welcome back, {userData?.full_name}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <Link href="/dashboard/loans">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Loans
                            </CardTitle>
                            <FileText className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.totalLoans}</p>
                            <p className="text-xs text-gray-500 mt-1">All time</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/agents">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Active Agents
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.activeAgents}</p>
                            <p className="text-xs text-gray-500 mt-1">Field workers</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/loans">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Pending Approvals
                            </CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                            <p className="text-xs text-gray-500 mt-1">Requires action</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card className={stats.highValueQuotes > 0 ? "border-orange-300" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            High-Value Quotes
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.highValueQuotes}</p>
                        <p className="text-xs text-gray-500 mt-1">Needs review</p>
                    </CardContent>
                </Card>
            </div>

            {/* EMI Payment Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                <Card className={stats.overdueEMIs > 0 ? "border-red-300 bg-red-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Overdue EMIs
                        </CardTitle>
                        <AlertCircle className={`h-4 w-4 ${stats.overdueEMIs > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                    </CardHeader>
                    <CardContent>
                        <p className={`text-3xl font-bold ${stats.overdueEMIs > 0 ? 'text-red-600' : ''}`}>
                            {stats.overdueEMIs}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Requires collection follow-up</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Upcoming Payments (7 days)
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-600">{stats.upcomingPayments}</p>
                        <p className="text-xs text-gray-500 mt-1">EMIs due this week</p>
                    </CardContent>
                </Card>
            </div>

            {/* High-Value Quotations Widget */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                High-Value Quotations
                            </CardTitle>
                            <CardDescription className="mt-1 md:mt-2 text-xs md:text-sm">
                                Quotations above ₹10L or Rate below 12% requiring review
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/dashboard/reports">
                                <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 text-xs">
                                    View All
                                </Badge>
                            </Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {highValueQuotes.length === 0 ? (
                        <div className="py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">No high-value quotations yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                All quotations will appear here for review
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {highValueQuotes.slice(0, 10).map((quote) => (
                                <div
                                    key={quote.quote_id}
                                    className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-3 md:p-4 border border-orange-200 rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors gap-3"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-900">
                                                {quote.client?.full_name || 'Unknown Client'}
                                            </h4>
                                            <Badge variant="destructive" className="text-xs">
                                                High Value
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-600">Amount</p>
                                                <p className="font-semibold text-sm md:text-base">{formatCurrency(quote.amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Rate</p>
                                                <p className="font-semibold text-sm md:text-base">{quote.interest_rate}% p.a.</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Tenure</p>
                                                <p className="font-semibold text-sm md:text-base">{quote.tenure} months</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">By Agent</p>
                                                <p className="font-semibold text-xs md:text-sm truncate">
                                                    {quote.created_by_user?.full_name || 'Agent'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Phone className="h-3 w-3 text-gray-500" />
                                                <span className="text-gray-600">{quote.client?.mobile_number}</span>
                                            </div>
                                            <span className="text-gray-400">• Created {formatDate(quote.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                                        {quote.pdf_document_url && (
                                            <a
                                                href={quote.pdf_document_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button size="sm" variant="outline">
                                                    <Download className="mr-2 h-3 w-3" />
                                                    PDF
                                                </Button>
                                            </a>
                                        )}

                                        {quote.client && (
                                            <ConvertToLoan
                                                quotationId={quote.quote_id}
                                                clientId={quote.client_id}
                                                amount={quote.amount}
                                                interestRate={quote.interest_rate}
                                                tenure={quote.tenure}
                                                clientName={quote.client.full_name}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
