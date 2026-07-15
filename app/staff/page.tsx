'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/agent/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Users, CreditCard, Flame, AlertCircle, FileText } from 'lucide-react'

export default function StaffDashboard() {
    const supabase = createClient()
    const router = useRouter()
    const [userData, setUserData] = useState<any>(null)
    const [stats, setStats] = useState({
        totalClients: 0,
        activeLoans: 0,
        leads: 0,
        overdueEMIs: 0,
        upcomingPayments: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
        fetchStats()
    }, [])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.replace('/login')
            return
        }

        const { data: profile } = await supabase
            .from('app_users')
            .select('*')
            .eq('id', user.id)
            .single()

        setUserData(profile)
        setLoading(false)
    }

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = new Date()
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            const todayStr = today.toISOString().split('T')[0]
            const nextWeekStr = nextWeek.toISOString().split('T')[0]

            // 1. My Clients count
            const clientsPromise = supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('onboarding_agent_id', user.id)

            // 2. My Leads count
            const leadsPromise = supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_agent_id', user.id)

            // Get client IDs for active loans count
            const { data: clientsData } = await supabase
                .from('clients')
                .select('client_id')
                .eq('onboarding_agent_id', user.id)

            const clientIds = clientsData?.map(c => c.client_id) || []

            // 3. Active Loans count
            let activeLoansPromise;
            if (clientIds.length > 0) {
                activeLoansPromise = supabase
                    .from('loan_applications')
                    .select('*', { count: 'exact', head: true })
                    .in('client_id', clientIds)
                    .in('process_stage', ['Application Submitted', 'Under Review', 'Approved', 'Disbursed'])
            } else {
                activeLoansPromise = Promise.resolve({ count: 0 })
            }

            // 4. Overdue EMIs
            const overdueEMIsPromise = supabase
                .from('emi_schedule')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'OVERDUE')

            // 5. Upcoming Payments (7 days)
            const upcomingPaymentsPromise = supabase
                .from('emi_schedule')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING')
                .gte('due_date', todayStr)
                .lte('due_date', nextWeekStr)

            const [clientsRes, leadsRes, activeLoansRes, overdueEMIsRes, upcomingPaymentsRes] = await Promise.all([
                clientsPromise,
                leadsPromise,
                activeLoansPromise,
                overdueEMIsPromise,
                upcomingPaymentsPromise
            ])

            setStats({
                totalClients: clientsRes.count || 0,
                leads: leadsRes.count || 0,
                activeLoans: activeLoansRes?.count || 0,
                overdueEMIs: overdueEMIsRes.count || 0,
                upcomingPayments: upcomingPaymentsRes.count || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-gray-600">Loading...</div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Mobile-only page header (hidden on desktop — layout's StaffTopBar handles it) */}
            <PageHeader
                title="HealthyHome"
                subtitle={userData?.full_name || 'Staff Dashboard'}
                showNotifications={true}
            />

            {/* Desktop page heading (only shown on lg+) */}
            <div className="hidden lg:block mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Welcome back, {userData?.full_name}</p>
            </div>

            {/* KPI Cards Row - Matches Admin layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <Link href="/staff/leads">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                My Leads
                            </CardTitle>
                            <Flame className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.leads}</p>
                            <p className="text-xs text-gray-500 mt-1">Assigned enquiries</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/staff/clients">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                My Clients
                            </CardTitle>
                            <Users className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.totalClients}</p>
                            <p className="text-xs text-gray-500 mt-1">Onboarded customers</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/staff/loans">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Active Loans
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{stats.activeLoans}</p>
                            <p className="text-xs text-gray-500 mt-1">In progress & active</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* EMI Payment Stats Row - Matches Admin layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Link href="/staff/loans">
                    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${stats.overdueEMIs > 0 ? "border-red-300 bg-red-50" : ""}`}>
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
                </Link>

                <Link href="/staff/calendar">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Upcoming Payments (7 days)
                            </CardTitle>
                            <FileText className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">{stats.upcomingPayments}</p>
                            <p className="text-xs text-gray-500 mt-1">EMIs due this week</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
