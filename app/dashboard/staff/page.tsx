'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CheckCircle, Phone } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { AgentsPageHeader } from '@/components/dashboard/agents-page-header'
import { AgentActions } from '@/components/dashboard/agent-actions'
import { createClient } from '@/lib/supabase/client'
import type { AgentWithStats } from '@/lib/services/agentService'
import Loading from './loading'

export default function AgentsPage() {
    const [loading, setLoading] = useState(true)
    const [agents, setAgents] = useState<AgentWithStats[]>([])
    const [stats, setStats] = useState({
        totalAgents: 0,
        totalClients: 0,
        totalQuotations: 0,
        todayAttendance: 0,
    })

    useEffect(() => {
        async function fetchAgentsData() {
            try {
                const supabase = createClient()

                // Fetch all agents
                const { data: agentsData, error: agentsError } = await supabase
                    .from('app_users')
                    .select('*')
                    .eq('role', 'STAFF')
                    .order('created_at', { ascending: false })

                if (agentsError || !agentsData) {
                    console.error('Error fetching agents:', agentsError)
                    return
                }

                // Fetch Stats
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const todayStr = today.toISOString()

                const [clientsRes, quotationsRes, attendanceRes, totalAgentsRes, totalClientsRes, totalQuotationsRes, todayAttendanceRes] = await Promise.all([
                    supabase.from('clients').select('onboarding_agent_id'),
                    supabase.from('quotations').select('created_by, converted_to_loan_id'),
                    supabase.from('attendance_logs').select('*').order('check_in_time', { ascending: false }),
                    supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('role', 'STAFF'),
                    supabase.from('clients').select('*', { count: 'exact', head: true }),
                    supabase.from('quotations').select('*', { count: 'exact', head: true }),
                    supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).gte('check_in_time', todayStr)
                ])

                const clientsList = clientsRes.data || []
                const quotationsList = quotationsRes.data || []
                const attendanceList = attendanceRes.data || []

                // Group client counts
                const clientCounts: Record<string, number> = {}
                clientsList.forEach(c => {
                    if (c.onboarding_agent_id) {
                        clientCounts[c.onboarding_agent_id] = (clientCounts[c.onboarding_agent_id] || 0) + 1
                    }
                })

                // Group quotation and converted counts
                const quotationCounts: Record<string, number> = {}
                const convertedCounts: Record<string, number> = {}
                quotationsList.forEach(q => {
                    if (q.created_by) {
                        quotationCounts[q.created_by] = (quotationCounts[q.created_by] || 0) + 1
                        if (q.converted_to_loan_id) {
                            convertedCounts[q.created_by] = (convertedCounts[q.created_by] || 0) + 1
                        }
                    }
                })

                // Group latest attendance per agent
                const latestAttendance: Record<string, any> = {}
                attendanceList.forEach(a => {
                    if (a.agent_id && !latestAttendance[a.agent_id]) {
                        latestAttendance[a.agent_id] = a
                    }
                })

                const processedAgents = agentsData.map(agent => ({
                    ...agent,
                    client_count: clientCounts[agent.id] || 0,
                    quotation_count: quotationCounts[agent.id] || 0,
                    converted_count: convertedCounts[agent.id] || 0,
                    latest_attendance: latestAttendance[agent.id]
                })) as AgentWithStats[]

                setAgents(processedAgents)
                setStats({
                    totalAgents: totalAgentsRes.count || 0,
                    totalClients: totalClientsRes.count || 0,
                    totalQuotations: totalQuotationsRes.count || 0,
                    todayAttendance: todayAttendanceRes.count || 0,
                })
            } catch (error) {
                console.error('Error fetching agents data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAgentsData()
    }, [])

    if (loading) {
        return <Loading />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <AgentsPageHeader />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.totalAgents}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.totalClients}</p>
                        <p className="text-xs text-gray-500 mt-1">Across all staff</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Quotations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{stats.totalQuotations}</p>
                        <p className="text-xs text-gray-500 mt-1">Total generated</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Today's Check-ins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">{stats.todayAttendance}</p>
                        <p className="text-xs text-gray-500 mt-1">Out of {stats.totalAgents} staff</p>
                    </CardContent>
                </Card>
            </div>

            {/* Agents List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Staff
                    </CardTitle>
                    <CardDescription>
                        {agents.length} staff members
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {agents.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">No staff yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Create staff users
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                <h3 className="font-semibold text-base md:text-lg">{agent.full_name}</h3>
                                                <Badge variant="outline" className="text-xs">Staff</Badge>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{agent.mobile_number}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span className="text-xs">{agent.email}</span>
                                                </div>
                                            </div>

                                            {/* Performance Metrics */}
                                            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-3 p-2 md:p-3 bg-gray-50 rounded-md">
                                                <div>
                                                    <p className="text-xs text-gray-600">Clients</p>
                                                    <p className="text-base md:text-lg font-bold">{agent.client_count}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Quotations</p>
                                                    <p className="text-base md:text-lg font-bold">{agent.quotation_count}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Conversion</p>
                                                    <p className="text-base md:text-lg font-bold">
                                                        {agent.quotation_count > 0
                                                            ? Math.round((agent.converted_count / agent.quotation_count) * 100)
                                                            : 0}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Latest Attendance */}
                                            {agent.latest_attendance ? (
                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs md:text-sm">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="text-gray-600">
                                                        Last check-in: <strong>{formatDateTime(agent.latest_attendance.check_in_time)}</strong>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="mt-3 flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-500">No attendance records</span>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-400 mt-2">
                                                Joined {formatDate(agent.created_at)}
                                            </p>
                                        </div>

                                        <div className="sm:ml-auto w-full sm:w-auto mt-3 sm:mt-0">
                                            <AgentActions
                                                agentId={agent.id}
                                                agentName={agent.full_name}
                                                currentName={agent.full_name}
                                                currentMobile={agent.mobile_number}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Performance Leaderboard */}
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Top Performers (by Quotations)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {agents
                                .sort((a, b) => b.quotation_count - a.quotation_count)
                                .slice(0, 5)
                                .map((agent, index) => (
                                    <div
                                        key={agent.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-50 text-blue-600'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{agent.full_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {agent.client_count} clients • {agent.quotation_count} quotations
                                                </p>
                                            </div>
                                        </div>
                                        {agent.quotation_count > 0 && (
                                            <Badge variant="outline">{agent.quotation_count} quotes</Badge>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
