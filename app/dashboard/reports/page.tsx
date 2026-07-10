'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, FileText, Calendar, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ReportsFilter } from '@/components/dashboard/reports-filter'
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
                const [thisMonthClientsRes, thisMonthQuotationsRes, thisMonthHighValueRes, lastMonthClientsRes, lastMonthQuotationsRes, quotationsRes, staffRes, recentQuotationsRes] = await Promise.all([
                    supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString()),
                    supabase.from('quotations').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString()),
                    supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('is_high_value', true).gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString()),
                    supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastPeriod.toISOString()).lte('created_at', endOfLastPeriod.toISOString()),
                    supabase.from('quotations').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastPeriod.toISOString()).lte('created_at', endOfLastPeriod.toISOString()),
                    supabase.from('quotations').select('amount').gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString()),
                    supabase.from('app_users').select('id, full_name').eq('role', 'STAFF'),
                    supabase.from('quotations').select(`*, client:clients(full_name)`).order('created_at', { ascending: false }).limit(10)
                ])

                const thisMonthClients = thisMonthClientsRes.count || 0
                const thisMonthQuotations = thisMonthQuotationsRes.count || 0
                const thisMonthHighValue = thisMonthHighValueRes.count || 0
                const lastMonthClients = lastMonthClientsRes.count || 0
                const lastMonthQuotations = lastMonthQuotationsRes.count || 0
                
                const totalQuotationValue = quotationsRes.data?.reduce((sum, q) => sum + Number(q.amount), 0) || 0
                const avgQuoteSize = thisMonthQuotations > 0 ? totalQuotationValue / thisMonthQuotations : 0

                // Fetch staff stats in parallel
                const staffList = staffRes.data || []
                const staffStats = await Promise.all(
                    staffList.map(async (member) => {
                        const [memberQuotesRes, memberClientsRes] = await Promise.all([
                            supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('created_by', member.id).gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString()),
                            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('onboarding_agent_id', member.id).gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString())
                        ])
                        return {
                            ...member,
                            quotations: memberQuotesRes.count || 0,
                            clients: memberClientsRes.count || 0,
                        }
                    })
                )

                setReportData({
                    thisMonth: {
                        clients: thisMonthClients,
                        quotations: thisMonthQuotations,
                        highValue: thisMonthHighValue,
                        totalValue: totalQuotationValue,
                        avgQuoteSize,
                    },
                    lastMonth: {
                        clients: lastMonthClients,
                        quotations: lastMonthQuotations,
                    },
                    staffStats: staffStats.sort((a, b) => b.quotations - a.quotations),
                    recentQuotations: recentQuotationsRes.data || [],
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
    const quotationGrowth = calculateGrowth(reportData.thisMonth.quotations, reportData.lastMonth.quotations)

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
                            <CardTitle className="text-sm font-medium text-gray-600">Quotations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{reportData.thisMonth.quotations}</p>
                            <div className={`text-xs mt-1 flex items-center gap-1 ${quotationGrowth.positive ? 'text-green-600' : 'text-red-600'}`}>
                                <TrendingUp className={`h-3 w-3 ${!quotationGrowth.positive && 'rotate-180'}`} />
                                {quotationGrowth.value}% vs previous period
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{formatCurrency(reportData.thisMonth.totalValue)}</p>
                            <p className="text-xs text-gray-500 mt-1">In quotations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Avg Quote Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{formatCurrency(reportData.thisMonth.avgQuoteSize)}</p>
                            <p className="text-xs text-gray-500 mt-1">Per quotation</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* High-Value Alert */}
            {reportData.thisMonth.highValue > 0 && (
                <Card className="mb-6 border-orange-200 bg-orange-50">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                            <div>
                                <p className="font-semibold text-orange-900">
                                    {reportData.thisMonth.highValue} High-Value Quotations This Month
                                </p>
                                <p className="text-sm text-orange-700">
                                    Quotations above ₹10L or below 12% interest rate require review
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Staff Performance */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff Performance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Performers - Quotations</CardTitle>
                            <CardDescription>Staff ranked by quotations created</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportData.staffStats.length === 0 ? (
                                <p className="text-sm text-gray-550 text-center py-8">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {reportData.staffStats.slice(0, 5).map((member: any, index: number) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-200 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-sm md:text-base truncate">{member.full_name}</span>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{member.quotations} quotes</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
                                        .slice()
                                        .sort((a: any, b: any) => b.clients - a.clients)
                                        .slice(0, 5)
                                        .map((member: any, index: number) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-gray-200 text-gray-700' :
                                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-50 text-blue-600'
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

            {/* Recent Activity */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Quotations
                </h2>

                <Card>
                    <CardContent className="pt-6">
                        {reportData.recentQuotations.length === 0 ? (
                            <p className="text-sm text-gray-550 text-center py-8">No quotations yet</p>
                        ) : (
                            <div className="space-y-3">
                                {reportData.recentQuotations.map((quote: any) => (
                                    <div
                                        key={quote.quote_id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg hover:bg-gray-55 gap-2"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{quote.client?.full_name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-600">
                                                {formatCurrency(quote.amount)} • {quote.interest_rate}% • {quote.tenure} months
                                            </p>
                                            <p className="text-xs text-gray-450 mt-1">
                                                {formatDate(quote.created_at)}
                                            </p>
                                        </div>
                                        {quote.is_high_value && (
                                            <Badge variant="destructive" className="ml-3">High Value</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

import { Suspense } from 'react'

export default function ReportsPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ReportsPageContent />
        </Suspense>
    )
}
