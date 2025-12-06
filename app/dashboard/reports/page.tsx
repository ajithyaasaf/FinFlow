import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Users, FileText, Calendar, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getReportData(params?: { from?: string; to?: string }) {
    const supabase = await createClient()

    // Get date ranges
    const now = new Date()
    const startOfMonth = params?.from ? new Date(params.from) : new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = params?.to ? new Date(params.to) : new Date()

    // For comparison (previous period)
    const duration = endOfMonth.getTime() - startOfMonth.getTime()
    const startOfLastPeriod = new Date(startOfMonth.getTime() - duration)
    const endOfLastPeriod = new Date(startOfMonth.getTime())

    // This month stats
    const { count: thisMonthClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

    const { count: thisMonthQuotations } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

    const { count: thisMonthHighValue } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('is_high_value', true)
        .eq('is_high_value', true)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

    // Last month stats (for comparison)
    const { count: lastMonthClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastPeriod.toISOString())
        .lte('created_at', endOfLastPeriod.toISOString())

    const { count: lastMonthQuotations } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastPeriod.toISOString())
        .lte('created_at', endOfLastPeriod.toISOString())

    // Total amounts
    const { data: quotationsData } = await supabase
        .from('quotations')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())

    const totalQuotationValue = quotationsData?.reduce((sum, q) => sum + Number(q.amount), 0) || 0

    // Average quote size
    const avgQuoteSize = thisMonthQuotations && thisMonthQuotations > 0
        ? totalQuotationValue / thisMonthQuotations
        : 0

    // Get top agents
    const { data: agents } = await supabase
        .from('app_users')
        .select('id, full_name')
        .eq('role', 'AGENT')

    const agentStats = await Promise.all(
        (agents || []).map(async (agent) => {
            const { count: quotations } = await supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', agent.id)
                .eq('created_by', agent.id)
                .gte('created_at', startOfMonth.toISOString())
                .lte('created_at', endOfMonth.toISOString())

            const { count: clients } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('onboarding_agent_id', agent.id)
                .eq('onboarding_agent_id', agent.id)
                .gte('created_at', startOfMonth.toISOString())
                .lte('created_at', endOfMonth.toISOString())

            return {
                ...agent,
                quotations: quotations || 0,
                clients: clients || 0,
            }
        })
    )

    // Recent quotations
    const { data: recentQuotations } = await supabase
        .from('quotations')
        .select(`
      *,
      client:clients(full_name)
    `)
        .order('created_at', { ascending: false })
        .limit(10)

    return {
        thisMonth: {
            clients: thisMonthClients || 0,
            quotations: thisMonthQuotations || 0,
            highValue: thisMonthHighValue || 0,
            totalValue: totalQuotationValue,
            avgQuoteSize,
        },
        lastMonth: {
            clients: lastMonthClients || 0,
            quotations: lastMonthQuotations || 0,
        },
        agentStats: agentStats.sort((a, b) => b.quotations - a.quotations),
        recentQuotations: recentQuotations || [],
    }
}

function calculateGrowth(current: number, previous: number): { value: number; positive: boolean } {
    if (previous === 0) return { value: current > 0 ? 100 : 0, positive: true }
    const growth = ((current - previous) / previous) * 100
    return { value: Math.abs(Math.round(growth)), positive: growth >= 0 }
}

import { ReportsFilter } from '@/components/dashboard/reports-filter'

export default async function ReportsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
    const data = await getReportData(searchParams)

    const clientGrowth = calculateGrowth(data.thisMonth.clients, data.lastMonth.clients)
    const quotationGrowth = calculateGrowth(data.thisMonth.quotations, data.lastMonth.quotations)

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600 mt-2">Performance overview</p>
            </div>

            <ReportsFilter />

            {/* Month Overview */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Overview
                </h2>

                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">New Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{data.thisMonth.clients}</p>
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
                            <p className="text-2xl font-bold">{data.thisMonth.quotations}</p>
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
                            <p className="text-2xl font-bold">{formatCurrency(data.thisMonth.totalValue)}</p>
                            <p className="text-xs text-gray-500 mt-1">In quotations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Avg Quote Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{formatCurrency(data.thisMonth.avgQuoteSize)}</p>
                            <p className="text-xs text-gray-500 mt-1">Per quotation</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* High-Value Alert */}
            {data.thisMonth.highValue > 0 && (
                <Card className="mb-6 border-orange-200 bg-orange-50">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                            <div>
                                <p className="font-semibold text-orange-900">
                                    {data.thisMonth.highValue} High-Value Quotations This Month
                                </p>
                                <p className="text-sm text-orange-700">
                                    Quotations above ₹10L or below 12% interest rate require review
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Agent Performance */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Agent Performance
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Performers - Quotations</CardTitle>
                            <CardDescription>Agents ranked by quotations created</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.agentStats.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.agentStats.slice(0, 5).map((agent, index) => (
                                        <div
                                            key={agent.id}
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
                                                <span className="font-medium">{agent.full_name}</span>
                                            </div>
                                            <Badge variant="outline">{agent.quotations} quotes</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Performers - Client Onboarding</CardTitle>
                            <CardDescription>Agents ranked by clients onboarded</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.agentStats.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.agentStats
                                        .sort((a, b) => b.clients - a.clients)
                                        .slice(0, 5)
                                        .map((agent, index) => (
                                            <div
                                                key={agent.id}
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
                                                    <span className="font-medium">{agent.full_name}</span>
                                                </div>
                                                <Badge variant="outline">{agent.clients} clients</Badge>
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
                        {data.recentQuotations.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No quotations yet</p>
                        ) : (
                            <div className="space-y-3">
                                {data.recentQuotations.map((quote: any) => (
                                    <div
                                        key={quote.quote_id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{quote.client?.full_name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-600">
                                                {formatCurrency(quote.amount)} • {quote.interest_rate}% • {quote.tenure} months
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
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
