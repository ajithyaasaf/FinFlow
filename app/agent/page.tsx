'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/agent/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogOut, Users, Calculator, Camera, TrendingUp, FileText } from 'lucide-react'

export default function AgentDashboard() {
    const supabase = createClient()
    const [userData, setUserData] = useState<any>(null)
    const [stats, setStats] = useState({
        activeLoans: 0,
        quotations: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
        fetchStats()
    }, [])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            redirect('/auth/login')
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

            // First, get all client IDs for this agent
            const { data: clientsData } = await supabase
                .from('clients')
                .select('client_id')
                .eq('onboarding_agent_id', user.id)

            const clientIds = clientsData?.map(c => c.client_id) || []

            // Get active loans count for this agent's clients
            const { count: loansCount } = await supabase
                .from('loan_applications')
                .select('*', { count: 'exact', head: true })
                .in('client_id', clientIds)
                .in('process_stage', ['Application Submitted', 'Under Review', 'Approved', 'Disbursed'])

            // Get quotations count
            const { count: quotationsCount } = await supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', user.id)

            setStats({
                activeLoans: loansCount || 0,
                quotations: quotationsCount || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="p-4 text-center text-gray-600">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="FinFlow"
                subtitle={userData?.full_name || 'Agent Dashboard'}
                showNotifications={true}
                actions={
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                            await supabase.auth.signOut()
                            window.location.href = '/login'
                        }}
                        className="h-10 w-10 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                }
            />

            {/* Main Content */}
            <main className="p-4 pb-24">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white shadow-lg">
                    <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
                    <p className="text-blue-100 text-sm">Manage your loans and clients efficiently</p>
                </div>

                {/* Quick Action Cards */}
                <div className="space-y-3 mb-6">
                    <Link href="/agent/clients">
                        <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Manage Clients</h3>
                                        <p className="text-sm text-gray-600">View and manage your clients</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <span>→</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/agent/quotation">
                        <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Calculator className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Create Quotation</h3>
                                        <p className="text-sm text-gray-600">Generate instant loan quotes</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <span>→</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/agent/attendance">
                        <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Camera className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
                                        <p className="text-sm text-gray-600">Check-in with location & photo</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <span>→</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="border border-gray-200 bg-white">
                        <CardContent className="p-4">
                            <TrendingUp className="h-8 w-8 mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-gray-900">{stats.activeLoans}</p>
                            <p className="text-sm text-gray-600">Active Loans</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-white">
                        <CardContent className="p-4">
                            <FileText className="h-8 w-8 mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-gray-900">{stats.quotations}</p>
                            <p className="text-sm text-gray-600">Quotations</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
