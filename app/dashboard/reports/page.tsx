'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Calendar, CheckCircle, XCircle, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReportsFilter } from '@/components/dashboard/reports-filter'
import { formatCurrency } from '@/lib/utils'
import Loading from './loading'

function calculateGrowth(current: number, previous: number): { value: number; positive: boolean } {
    if (previous === 0) return { value: current > 0 ? 100 : 0, positive: true }
    const growth = ((current - previous) / previous) * 100
    return { value: Math.abs(Math.round(growth)), positive: growth >= 0 }
}

function ReportsPageContent() {
    const searchParams = useSearchParams()
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState<any>(null)

    useEffect(() => {
        async function fetchReportData() {
            setLoading(true)
            try {
                const supabase = createClient()

                // Get date ranges
                const now = new Date()
                const startOfMonth = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = to ? new Date(to) : new Date()

                // For comparison (previous period)
                const duration = endOfMonth.getTime() - startOfMonth.getTime()
                const startOfLastPeriod = new Date(startOfMonth.getTime() - duration)
                const endOfLastPeriod = new Date(startOfMonth.getTime())

                // Fetch loan applications for period
                let loanQuery = supabase.from('loan_applications').select(`
                    loan_id,
                    amount,
                    sanctioned_amount,
                    process_stage,
                    created_at,
                    onboarding_agent_id
                `)

                if (from) loanQuery = loanQuery.gte('created_at', new Date(from).toISOString())
                if (to) loanQuery = loanQuery.lte('created_at', new Date(to).toISOString())

                const [loansRes, staffRes] = await Promise.all([
                    loanQuery,
                    supabase.from('app_users').select('id, full_name').eq('role', 'STAFF')
                ])

                const loans = loansRes.data || []
                const staffList = staffRes.data || []

                let totalDisbursedVolume = 0
                let totalSanctionedVolume = 0
                let totalAppliedVolume = 0
                let totalFilesCount = loans.length

                const staffMap: Record<string, { id: string; full_name: string; disbursed: number; sanctioned: number; applied: number; files: number }> = {}

                for (const staff of staffList) {
                    staffMap[staff.id] = { id: staff.id, full_name: staff.full_name, disbursed: 0, sanctioned: 0, applied: 0, files: 0 }
                }

                for (const loan of loans) {
                    const amt = Number(loan.amount) || 0
                    const sanctionedAmt = Number(loan.sanctioned_amount || loan.amount) || 0
                    const stage = loan.process_stage

                    totalAppliedVolume += amt

                    if (stage === 'Disbursed' || stage === 'Disbursement') {
                        totalDisbursedVolume += amt
                    }

                    if (stage === 'Sanctioned' || stage === 'Sanction' || stage === 'Disbursed' || stage === 'Disbursement') {
                        totalSanctionedVolume += sanctionedAmt
                    }

                    if (loan.onboarding_agent_id && staffMap[loan.onboarding_agent_id]) {
                        const s = staffMap[loan.onboarding_agent_id]
                        s.applied += amt
                        s.files += 1
                        if (stage === 'Disbursed' || stage === 'Disbursement') {
                            s.disbursed += amt
                        }
                        if (stage === 'Sanctioned' || stage === 'Sanction' || stage === 'Disbursed' || stage === 'Disbursement') {
                            s.sanctioned += sanctionedAmt
                        }
                    }
                }

                const staffStats = Object.values(staffMap).sort((a, b) => b.disbursed - a.disbursed || b.applied - a.applied)

                setReportData({
                    totalDisbursedVolume,
                    totalSanctionedVolume,
                    totalAppliedVolume,
                    totalFilesCount,
                    staffStats,
                })
            } catch (error) {
                console.error('Error fetching report data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchReportData()
    }, [from, to])

    if (loading || !reportData) {
        return <Loading />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Loan volume & business performance overview</p>
            </div>

            <ReportsFilter />

            {/* Month Overview */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Financial Overview
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Disbursed Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-extrabold text-emerald-900">{formatCurrency(reportData.totalDisbursedVolume)}</p>
                            <p className="text-xs text-gray-500 mt-1">Total cash paid out in selected period</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-violet-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-violet-700">Total Sanctioned Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-extrabold text-violet-900">{formatCurrency(reportData.totalSanctionedVolume)}</p>
                            <p className="text-xs text-gray-500 mt-1">Loans approved & awaiting disbursement</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">Total Applied Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(reportData.totalAppliedVolume)}</p>
                            <p className="text-xs text-gray-500 mt-1">Total loan volume logged in period</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">Total Files Processed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-extrabold text-amber-900">{reportData.totalFilesCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Total loan applications in period</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff Loan Performance
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Staff Volume Leaderboard</CardTitle>
                            <CardDescription>Staff ranked by loan volume disbursed & applied</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportData.staffStats.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No staff data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {reportData.staffStats
                                        .slice(0, 10)
                                        .map((member: any, index: number) => (
                                            <div
                                                key={member.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 rounded-xl gap-2 border border-gray-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                        index === 1 ? 'bg-slate-200 text-slate-800' :
                                                            index === 2 ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-200/70 text-gray-700'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900">{member.full_name}</p>
                                                        <p className="text-xs text-gray-500">{member.files} loan {member.files === 1 ? 'file' : 'files'} processed</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                                                    <div className="text-right">
                                                        <span className="text-gray-500 text-[11px] block">Applied</span>
                                                        <span className="font-semibold text-gray-800">{formatCurrency(member.applied)}</span>
                                                    </div>
                                                    <div className="text-right bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                        <span className="text-emerald-700 text-[11px] block font-medium">Disbursed</span>
                                                        <span className="font-bold text-emerald-900">{formatCurrency(member.disbursed)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Top-Up Conversion Analytics */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top-Up Loan Performance
                </h2>
                <TopUpConversionReportClient from={from} to={to} />
            </div>
        </div>
    )
}

import { Suspense } from 'react'

/**
 * Client-side Top-Up Conversion report widget for the Reports page.
 * Fetches topup_offers data directly from the browser to avoid making the
 * reports page a server component (it's already 'use client').
 */
function TopUpConversionReportClient({ from, to }: { from: string; to: string }) {
    const [data, setData] = useState<{
        total: number
        accepted: number
        rejected: number
        pending: number
        totalOfferedAmount: number
        acceptedAmount: number
    } | null>(null)

    useEffect(() => {
        async function fetch() {
            const supabase = createClient()
            const now = new Date()
            const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1)
            const toDate = to ? new Date(to) : now

            const { data: offers } = await supabase
                .from('topup_offers')
                .select('offer_id, offered_amount, status')
                .gte('offered_at', fromDate.toISOString())
                .lte('offered_at', toDate.toISOString())

            if (!offers) return

            const accepted = offers.filter(o => o.status === 'ACCEPTED')
            setData({
                total: offers.length,
                accepted: accepted.length,
                rejected: offers.filter(o => o.status === 'REJECTED').length,
                pending: offers.filter(o => o.status === 'PENDING').length,
                totalOfferedAmount: offers.reduce((s, o) => s + o.offered_amount, 0),
                acceptedAmount: accepted.reduce((s, o) => s + o.offered_amount, 0),
            })
        }
        fetch()
    }, [from, to])

    if (!data) return <Card><CardContent className="py-8 text-center text-sm text-gray-400">Loading top-up data...</CardContent></Card>

    const conversionRate = data.total > 0 ? (data.accepted / data.total) * 100 : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Top-Up Loan Conversion
                </CardTitle>
                <CardDescription>Offers generated and converted in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-primary/5 p-4 rounded-lg">
                        <p className="text-xs text-primary uppercase mb-1">Total Offers</p>
                        <p className="text-2xl font-bold text-gray-900">{data.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <p className="text-xs text-green-600 uppercase">Converted</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{data.accepted}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <p className="text-xs text-red-600 uppercase">Rejected</p>
                        </div>
                        <p className="text-2xl font-bold text-red-900">{data.rejected}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase mb-1">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{data.pending}</p>
                    </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <Badge variant={conversionRate >= 50 ? 'default' : conversionRate >= 30 ? 'secondary' : 'outline'}>
                            {conversionRate.toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(conversionRate, 100)}%` }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Total Offered</p>
                            <p className="text-lg font-semibold">{formatCurrency(data.totalOfferedAmount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Accepted Value</p>
                            <p className="text-lg font-semibold text-green-600">{formatCurrency(data.acceptedAmount)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ReportsPageContent />
        </Suspense>
    )
}
