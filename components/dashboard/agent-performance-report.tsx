import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Users, Award } from 'lucide-react'

interface AgentPerformanceReportProps {
    from?: string
    to?: string
}

interface AgentStats {
    agent_id: string
    agent_name: string
    loans_disbursed: number
    total_amount: number
    payments_collected: number
    collection_rate: number
}

export async function AgentPerformanceReport({ from, to }: AgentPerformanceReportProps) {
    const supabase = await createClient()

    const fromDate = from || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
    const toDate = to || new Date().toISOString()

    // Get all staff
    const { data: agents } = await supabase
        .from('app_users')
        .select('id, full_name')
        .eq('role', 'STAFF')

    if (!agents) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Staff Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No data available</p>
                </CardContent>
            </Card>
        )
    }

    // Get performance stats for each agent
    const agentStats: AgentStats[] = []

    for (const agent of agents) {
        // Count loans disbursed by this agent's clients
        const { count: loansCount, data: loans } = await supabase
            .from('loan_applications')
            .select('amount, client_id, clients!inner(onboarding_agent_id)', { count: 'exact' })
            .eq('clients.onboarding_agent_id', agent.id)
            .eq('process_stage', 'Disbursed')
            .gte('disbursement_date', fromDate)
            .lte('disbursement_date', toDate)

        const totalAmount = loans?.reduce((sum, loan) => sum + loan.amount, 0) || 0

        // Get payments collected for this agent's clients
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, collected_by')
            .eq('collected_by', agent.id)
            .gte('payment_date', fromDate)
            .lte('payment_date', toDate)

        const paymentsCollected = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

        const collectionRate = totalAmount > 0 ? (paymentsCollected / totalAmount) * 100 : 0

        agentStats.push({
            agent_id: agent.id,
            agent_name: agent.full_name,
            loans_disbursed: loansCount || 0,
            total_amount: totalAmount,
            payments_collected: paymentsCollected,
            collection_rate: collectionRate
        })
    }

    // Sort by total amount descending
    agentStats.sort((a, b) => b.total_amount - a.total_amount)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Staff Performance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {agentStats.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No staff activity in this period</p>
                    ) : (
                        agentStats.slice(0, 5).map((agent, index) => (
                            <div key={agent.agent_id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                                    <div>
                                        <p className="font-semibold text-sm">{agent.agent_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {agent.loans_disbursed} loan{agent.loans_disbursed !== 1 ? 's' : ''} • {formatCurrency(agent.total_amount)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{formatCurrency(agent.payments_collected)}</p>
                                    <Badge variant={agent.collection_rate >= 80 ? 'default' : 'secondary'} className="text-xs">
                                        {agent.collection_rate.toFixed(0)}% collected
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
