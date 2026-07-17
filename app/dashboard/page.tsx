'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp, FileText, Calendar, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Loading from './loading'
import { TopUpOpportunitiesWidget } from '@/components/dashboard/topup-opportunities-widget'

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [fullName, setFullName] = useState('')
    const [stats, setStats] = useState({
        totalLoans: 0,
        activeStaff: 0,
        pendingApprovals: 0,
        overdueEMIs: 0,
        upcomingPayments: 0,
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

                // Fetch stats (EMI and loan totals)
                const today = new Date()
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                const todayStr = today.toISOString().split('T')[0]
                const nextWeekStr = nextWeek.toISOString().split('T')[0]

                const [userRes, totalLoansRes, activeAgentsRes, pendingApprovalsRes, overdueEMIsRes, upcomingPaymentsRes] = await Promise.all([
                    userPromise,
                    supabase.from('loan_applications').select('*', { count: 'exact', head: true }),
                    supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('role', 'STAFF'),
                    supabase.from('loan_applications').select('*', { count: 'exact', head: true }).in('process_stage', ['Document Verification', 'Credit Appraisal']),
                    supabase.from('emi_schedule').select('*', { count: 'exact', head: true }).eq('status', 'OVERDUE'),
                    supabase.from('emi_schedule').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').gte('due_date', todayStr).lte('due_date', nextWeekStr)
                ])

                if (userRes.data) {
                    setFullName(userRes.data.full_name)
                }

                setStats({
                    totalLoans: totalLoansRes.count || 0,
                    activeStaff: activeAgentsRes.count || 0,
                    pendingApprovals: pendingApprovalsRes.count || 0,
                    overdueEMIs: overdueEMIsRes.count || 0,
                    upcomingPayments: upcomingPaymentsRes.count || 0,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
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
            </div>


            {/* Top-Up Opportunities */}
            <TopUpOpportunitiesWidget />

        </div>
    )
}
