import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CheckCircle, MapPin, FileText, Phone } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { AppUser, AttendanceLog, Client } from '@/types'
import { AgentsPageHeader } from '@/components/dashboard/agents-page-header'
import { AgentActions } from '@/components/dashboard/agent-actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AgentWithStats extends AppUser {
    client_count: number
    quotation_count: number
    converted_count: number
    latest_attendance?: AttendanceLog
}

async function getAgents() {
    const supabase = await createClient()

    // Get all agents
    const { data: agents, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'AGENT')
        .order('created_at', { ascending: false })

    if (error || !agents) {
        console.error('Error fetching agents:', error)
        return []
    }

    // Get stats for each agent
    const agentsWithStats: AgentWithStats[] = await Promise.all(
        agents.map(async (agent) => {
            // Count clients
            const { count: clientCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('onboarding_agent_id', agent.id)

            // Count quotations
            const { count: quotationCount } = await supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', agent.id)

            // Count converted quotations (those that became loans)
            const { count: convertedCount } = await supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', agent.id)
                .not('converted_to_loan_id', 'is', null)

            // Get latest attendance
            const { data: attendance } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('agent_id', agent.id)
                .order('check_in_time', { ascending: false })
                .limit(1)
                .single()

            return {
                ...agent,
                client_count: clientCount || 0,
                quotation_count: quotationCount || 0,
                converted_count: convertedCount || 0,
                latest_attendance: attendance || undefined,
            }
        })
    )

    return agentsWithStats
}

async function getAgentStats() {
    const supabase = await createClient()

    const { count: totalAgents } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'AGENT')

    const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

    const { count: totalQuotations } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })

    // Get today's attendance count
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayAttendance } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', today.toISOString())

    return {
        totalAgents: totalAgents || 0,
        totalClients: totalClients || 0,
        totalQuotations: totalQuotations || 0,
        todayAttendance: todayAttendance || 0,
    }
}

export default async function AgentsPage() {
    const agents = await getAgents()
    const stats = await getAgentStats()

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <AgentsPageHeader />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Agents</CardTitle>
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
                        <p className="text-xs text-gray-500 mt-1">Across all agents</p>
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
                        <p className="text-xs text-gray-500 mt-1">Out of {stats.totalAgents} agents</p>
                    </CardContent>
                </Card>
            </div>

            {/* Agents List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Agents
                    </CardTitle>
                    <CardDescription>
                        {agents.length} field agents
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {agents.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">No agents yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Create agent users in Supabase Auth
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
                                                <Badge variant="outline" className="text-xs">Agent</Badge>
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
