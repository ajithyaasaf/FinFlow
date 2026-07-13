'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import {
    IndianRupee,
    Users,
    TrendingUp,
    MapPin,
    Briefcase,
    FileText,
    Percent,
    Calendar,
    ChevronRight,
} from 'lucide-react'
import type { DashboardAnalytics } from '@/lib/services/analyticsService'

// Premium color palettes
const THEME_COLORS = ['#b51c1c', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e']

// Helper to format currency in Indian numbering system
function formatIndianCurrency(num: number): string {
    if (num === 0) return '₹0'
    const absNum = Math.abs(num)
    if (absNum >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)} Cr`
    }
    if (absNum >= 100000) {
        return `₹${(num / 100000).toFixed(2)} L`
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num)
}

interface AnalyticsClientProps {
    data: DashboardAnalytics
    currentRange: string
}

export function AnalyticsClient({ data, currentRange }: AnalyticsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mounted, setMounted] = useState(false)

    // Handle hydration safely
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleRangeChange = (range: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('range', range)
        router.push(`/dashboard/analytics?${params.toString()}`)
    }

    if (!mounted) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-md"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[350px] bg-gray-100 animate-pulse rounded-xl"></div>
                    <div className="h-[350px] bg-gray-100 animate-pulse rounded-xl"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Range Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Executive Analytics</h1>
                    <p className="text-sm text-gray-500">Key metrics and business performance insights for the Managing Director.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { label: '30 Days', value: 'last_30_days' },
                        { label: '6 Months', value: 'last_6_months' },
                        { label: '12 Months', value: 'last_12_months' },
                        { label: 'YTD', value: 'ytd' }
                    ].map(btn => (
                        <Button
                            key={btn.value}
                            variant={currentRange === btn.value ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-lg transition-all"
                            onClick={() => handleRangeChange(btn.value)}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-primary overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-16 w-16 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-primary" />
                            Total Sourced Business
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-gray-900 mt-1">
                            {formatIndianCurrency(data.summary.totalSourcedVolume)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500">Total volume of all files logged in this period.</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <IndianRupee className="h-16 w-16 text-emerald-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            Total Disbursed Volume
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-emerald-900 mt-1">
                            {formatIndianCurrency(data.summary.totalDisbursedVolume)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500">
                            Conversion: {data.summary.totalSourcedVolume > 0 
                                ? Math.round((data.summary.totalDisbursedVolume / data.summary.totalSourcedVolume) * 100) 
                                : 0}% of sourced volume.
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-violet-500 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <FileText className="h-16 w-16 text-violet-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Percent className="h-3.5 w-3.5 text-violet-500" />
                            Total Sanctioned Volume
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-violet-900 mt-1">
                            {formatIndianCurrency(data.summary.totalSanctionedVolume)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500">Loans approved and awaiting final disbursement.</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="h-16 w-16 text-amber-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-amber-500" />
                            Active Loan Pipeline
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-amber-900 mt-1">
                            {data.summary.activeLoansCount} Files
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500">Total files currently being appraised and processed.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Row 1: Disbursement Trends & Product Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Trends */}
                <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Sourced vs. Disbursed Trends
                        </CardTitle>
                        <CardDescription>Compare monthly value of new files logged vs successfully paid out.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {data.monthlyTrends.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <TrendingUp className="h-12 w-12 stroke-1 mb-2" />
                                <p className="text-sm">No transaction trends found for this period.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthlyTrends} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs text-gray-500" />
                                    <YAxis tickLine={false} axisLine={false} className="text-xs text-gray-500" tickFormatter={v => formatIndianCurrency(v)} />
                                    <Tooltip
                                        formatter={(v: any) => [formatIndianCurrency(Number(v)), '']}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Bar name="Sourced Volume" dataKey="sourced" fill="#b51c1c" radius={[4, 4, 0, 0]} />
                                    <Bar name="Disbursed Volume" dataKey="disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Product Split */}
                <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-violet-600" />
                            Product Mix
                        </CardTitle>
                        <CardDescription>Breakdown by Loan Categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col justify-between">
                        {data.productDistribution.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Briefcase className="h-12 w-12 stroke-1 mb-2" />
                                <p className="text-sm">No product data found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.productDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {data.productDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => formatIndianCurrency(Number(v))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs max-h-[100px] overflow-y-auto pr-2">
                                    {data.productDistribution.map((entry, idx) => (
                                        <div key={entry.name} className="flex items-center gap-1.5 truncate">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }}
                                            />
                                            <span className="text-gray-600 truncate">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Region Performance & Staff Sourcing Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Region Analysis */}
                <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-amber-500" />
                            Region Sourcing Share
                        </CardTitle>
                        <CardDescription>Madurai vs. Tenkasi volumes.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[320px] flex flex-col justify-between">
                        {data.regionBreakdown.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <MapPin className="h-12 w-12 stroke-1 mb-2" />
                                <p className="text-sm">No regional metrics.</p>
                            </div>
                        ) : (
                            <>
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.regionBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                dataKey="value"
                                                label={({ name }) => name}
                                            >
                                                {data.regionBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#b51c1c' : '#f59e0b'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => formatIndianCurrency(Number(v))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4">
                                    {data.regionBreakdown.map((r, idx) => (
                                        <div key={r.name} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0 border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-amber-500'}`} />
                                                <span className="font-semibold text-gray-700">{r.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-gray-900">{formatIndianCurrency(r.value)}</span>
                                                <span className="text-gray-400 ml-1.5">({r.count} files)</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Staff Leaderboard */}
                <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-600" />
                            Staff Sourcing Leaderboard
                        </CardTitle>
                        <CardDescription>Total loan volume sourced by agents and their file conversion rate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.staffLeaderboard.length === 0 ? (
                            <div className="h-[240px] flex flex-col items-center justify-center text-gray-400">
                                <Users className="h-12 w-12 stroke-1 mb-2" />
                                <p className="text-sm">No agent sourcing logs found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                                {data.staffLeaderboard.map((staff, idx) => (
                                    <div key={staff.name} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                idx === 1 ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        'bg-primary/5 text-primary border border-primary/10'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800">{staff.name}</p>
                                                <p className="text-xs text-gray-500">{staff.filesCount} Files Sourced</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{formatIndianCurrency(staff.sourcedValue)}</p>
                                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                                    <span className="text-[10px] text-gray-400">Conversion</span>
                                                    <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-white text-emerald-600 border-emerald-200">
                                                        {staff.conversionRate}%
                                                    </Badge>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                        </div>
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
