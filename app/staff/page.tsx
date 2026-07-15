'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/agent/page-header'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Users, Camera, TrendingUp, Flame, Calendar } from 'lucide-react'

export default function StaffDashboard() {
    const supabase = createClient()
    const router = useRouter()
    const [userData, setUserData] = useState<any>(null)
    const [stats, setStats] = useState({
        activeLoans: 0,
        leads: 0
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

            const { data: clientsData } = await supabase
                .from('clients')
                .select('client_id')
                .eq('onboarding_agent_id', user.id)

            const clientIds = clientsData?.map(c => c.client_id) || []

            const { count: loansCount } = await supabase
                .from('loan_applications')
                .select('*', { count: 'exact', head: true })
                .in('client_id', clientIds)
                .in('process_stage', ['Application Submitted', 'Under Review', 'Approved', 'Disbursed'])

            const { count: leadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_agent_id', user.id)

            setStats({
                activeLoans: loansCount || 0,
                leads: leadsCount || 0
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
        <>
            {/* Mobile-only page header (hidden on desktop — layout's StaffTopBar handles it) */}
            <PageHeader
                title="HealthyHome"
                subtitle={userData?.full_name || 'Staff Dashboard'}
                showNotifications={true}
            />

            {/* Desktop page heading (only shown on lg+) */}
            <div className="hidden lg:block mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back, {userData?.full_name}</p>
            </div>

            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 mb-6 text-white shadow-lg">
                <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
                <p className="text-red-100 text-sm">Manage your loans and clients efficiently</p>
            </div>

            {/* Quick Action Cards */}
            <div className="space-y-3 mb-6 p-4 lg:p-0">
                <Link href="/staff/leads">
                    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                                    <Flame className="h-6 w-6 text-rose-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Leads Hub</h3>
                                    <p className="text-sm text-gray-600">Track raw inquiries and convert to clients</p>
                                </div>
                                <div className="text-gray-400"><span>→</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/staff/clients">
                    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Manage Clients</h3>
                                    <p className="text-sm text-gray-600">View and manage your clients</p>
                                </div>
                                <div className="text-gray-400"><span>→</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/staff/attendance">
                    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                    <Camera className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
                                    <p className="text-sm text-gray-600">Check-in with location & photo</p>
                                </div>
                                <div className="text-gray-400"><span>→</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/staff/calendar">
                    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">My Calendar & Tasks</h3>
                                    <p className="text-sm text-gray-600">View and manage tasks assigned to you</p>
                                </div>
                                <div className="text-gray-400"><span>→</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 px-4 lg:px-0">
                <Link href="/staff/loans">
                    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer h-full">
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <p className="text-xl font-bold text-gray-900">{stats.activeLoans}</p>
                            <p className="text-xs text-gray-600">Active Loans</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/staff/leads">
                    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer h-full">
                        <CardContent className="p-4 text-center">
                            <Flame className="h-6 w-6 mx-auto mb-2 text-rose-600" />
                            <p className="text-xl font-bold text-gray-900">{stats.leads}</p>
                            <p className="text-xs text-gray-600">My Leads</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </>
    )
}

