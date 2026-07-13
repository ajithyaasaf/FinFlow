'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConvertToLoan } from '@/components/dashboard/convert-to-loan'
import { RejectQuotationDialog } from '@/components/dashboard/reject-quotation-dialog'
import { AlertCircle, TrendingUp, Download, FileText, Phone, Calendar, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { QuotationWithDetails } from '@/lib/services/quotationService'
import Loading from './loading'

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [fullName, setFullName] = useState('')
    const [quotations, setQuotations] = useState<QuotationWithDetails[]>([])
    const [stats, setStats] = useState({
        totalLoans: 0,
        activeStaff: 0,
        pendingApprovals: 0,
        overdueEMIs: 0,
        upcomingPayments: 0,
        highValueQuotes: 0,
    })

    useEffect(() => {
        async function loadDashboard() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Fetch app user details
                const userPromise = supabase
                    .from('app_users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()

                // Fetch quotations
                const quotesPromise = supabase
                    .from('quotations')
                    .select(`
                        *,
                        client:clients(*),
                        created_by_user:app_users!quotations_created_by_fkey(*)
                    `)
                    .is('converted_to_loan_id', null)
                    .neq('status', 'REJECTED')
                    .order('created_at', { ascending: false })

                // Fetch stats (EMI and loan totals)
                const today = new Date()
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                const todayStr = today.toISOString().split('T')[0]
                const nextWeekStr = nextWeek.toISOString().split('T')[0]

                const [userRes, quotesRes, totalLoansRes, activeAgentsRes, pendingApprovalsRes, overdueEMIsRes, upcomingPaymentsRes] = await Promise.all([
                    userPromise,
                    quotesPromise,
                    supabase.from('loan_applications').select('*', { count: 'exact', head: true }),
                    supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('role', 'STAFF'),
                    supabase.from('loan_applications').select('*', { count: 'exact', head: true }).in('process_stage', ['Document Verification', 'Credit Appraisal']),
                    supabase.from('emi_schedule').select('*', { count: 'exact', head: true }).eq('status', 'OVERDUE'),
                    supabase.from('emi_schedule').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').gte('due_date', todayStr).lte('due_date', nextWeekStr)
                ])

                if (userRes.data) {
                    setFullName(userRes.data.full_name)
                }

                const fetchedQuotes = (quotesRes.data || []) as QuotationWithDetails[]
                const highValueQuotes = fetchedQuotes.filter(q => q.is_high_value)

                setQuotations(fetchedQuotes)
                setStats({
                    totalLoans: totalLoansRes.count || 0,
                    activeStaff: activeAgentsRes.count || 0,
                    pendingApprovals: pendingApprovalsRes.count || 0,
                    overdueEMIs: overdueEMIsRes.count || 0,
                    upcomingPayments: upcomingPaymentsRes.count || 0,
                    highValueQuotes: highValueQuotes.length,
                })
            } catch (error) {
                console.error('Error loading dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadDashboard()
    }, [])

    if (loading) {
        return <Loading />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Welcome back, {fullName}</p>
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

                <Link href="/dashboard/staff">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Active Staff
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.activeStaff}</p>
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
                        <CreditCard className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-primary">{stats.upcomingPayments}</p>
                        <p className="text-xs text-gray-500 mt-1">EMIs due this week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Quotations Widget */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-gray-900">
                                <FileText className="h-5 w-5 text-primary" />
                                Recent Quotations
                            </CardTitle>
                            <CardDescription className="mt-1 md:mt-2 text-xs md:text-sm">
                                All unconverted quotations generated by staff. Review details or convert them to active loans.
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
                    {quotations.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">No new quotations yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Generated client quotations will appear here for review
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quotations.slice(0, 10).map((quote) => {
                                const isHighValue = quote.is_high_value
                                return (
                                    <div
                                        key={quote.quote_id}
                                        className={`flex flex-col lg:flex-row lg:items-start lg:justify-between p-3 md:p-4 border rounded-lg transition-colors gap-3 ${
                                            isHighValue 
                                                ? 'border-orange-200 bg-orange-50/40 hover:bg-orange-50' 
                                                : 'border-gray-200 bg-white hover:bg-gray-50/50'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-gray-900">
                                                    {quote.client?.full_name || 'Unknown Client'}
                                                </h4>
                                                {isHighValue ? (
                                                    <Badge variant="destructive" className="text-xs bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-100">
                                                        High Value (Needs Approval)
                                                    </Badge>
                                                ) : (
                                                    <Badge className="text-xs bg-primary/5 text-primary border border-primary/10 hover:bg-primary/5">
                                                        Standard
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-600">Amount</p>
                                                    <p className="font-semibold text-sm md:text-base text-gray-900">{formatCurrency(quote.amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Rate</p>
                                                    <p className="font-semibold text-sm md:text-base text-gray-900">{quote.interest_rate}% p.a.</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Tenure</p>
                                                    <p className="font-semibold text-sm md:text-base text-gray-900">{quote.tenure} months</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">By Staff</p>
                                                    <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                                                        {quote.created_by_user?.full_name || 'Staff'}
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
                                                    <Button size="sm" variant="outline" className="w-full lg:w-auto">
                                                        <Download className="mr-2 h-3 w-3" />
                                                        PDF
                                                    </Button>
                                                </a>
                                            )}

                                            {quote.client && (
                                                <div className="flex lg:flex-col items-stretch gap-2 w-full lg:w-auto">
                                                    <RejectQuotationDialog
                                                        quotationId={quote.quote_id}
                                                        clientName={quote.client.full_name}
                                                    />
                                                    <ConvertToLoan
                                                        quotationId={quote.quote_id}
                                                        clientId={quote.client_id}
                                                        amount={quote.amount}
                                                        interestRate={quote.interest_rate}
                                                        tenure={quote.tenure}
                                                        clientName={quote.client.full_name}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
