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

                // Fetch current period stats
                const [thisMonthClientsRes, lastMonthClientsRes, totalClientsRes, staffRes] = await Promise.all([
                    supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString()),
                    supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastPeriod.toISOString()).lte('created_at', endOfLastPeriod.toISOString()),
                    supabase.from('clients').select('*', { count: 'exact', head: true }),
                    supabase.from('app_users').select('id, full_name').eq('role', 'STAFF')
                ])

                const thisMonthClients = thisMonthClientsRes.count || 0
                const lastMonthClients = lastMonthClientsRes.count || 0
                const totalClients = totalClientsRes.count || 0
                const staffList = staffRes.data || []

                // Fetch staff stats in parallel
                const staffStats = await Promise.all(
                    staffList.map(async (member) => {
                        const { count } = await supabase
                            .from('clients')
                            .select('*', { count: 'exact', head: true })
                            .eq('onboarding_agent_id', member.id)
                            .gte('created_at', startOfMonth.toISOString())
                            .lte('created_at', endOfMonth.toISOString())
                        return {
                            ...member,
                            clients: count || 0,
                        }
                    })
                )

                setReportData({
                    thisMonth: {
                        clients: thisMonthClients,
                    },
                    lastMonth: {
                        clients: lastMonthClients,
                    },
                    totalClients,
                    staffStats: staffStats.sort((a, b) => b.clients - a.clients),
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

    const clientGrowth = calculateGrowth(reportData.thisMonth.clients, reportData.lastMonth.clients)

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Performance overview</p>
            </div>

            <ReportsFilter />

            {/* Month Overview */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Overview
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">New Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{reportData.thisMonth.clients}</p>
                            <div className={`text-xs mt-1 flex items-center gap-1 ${clientGrowth.positive ? 'text-green-600' : 'text-red-600'}`}>
                                <TrendingUp className={`h-3 w-3 ${!clientGrowth.positive && 'rotate-180'}`} />
                                {clientGrowth.value}% vs previous period
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Previous Period Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{reportData.lastMonth.clients}</p>
                            <p className="text-xs text-gray-500 mt-1">Clients added in last period</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{reportData.totalClients}</p>
                            <p className="text-xs text-gray-500 mt-1">All-time database count</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Active Staff</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{reportData.staffStats.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Registered staff users</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff Performance
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Performers - Client Onboarding</CardTitle>
                            <CardDescription>Staff ranked by clients onboarded</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportData.staffStats.length === 0 ? (
                                <p className="text-sm text-gray-550 text-center py-8">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {reportData.staffStats
                                        .slice(0, 10)
                                        .map((member: any, index: number) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-gray-200 text-gray-700' :
                                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-primary/5 text-primary'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium text-sm md:text-base truncate">{member.full_name}</span>
                                                </div>
                                                <Badge variant="outline" className="text-xs">{member.clients} clients</Badge>
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
