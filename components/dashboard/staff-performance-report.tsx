import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Users, Award } from 'lucide-react'

interface StaffPerformanceReportProps {
    from?: string
    to?: string
}

interface StaffStats {
    staff_id: string
    staff_name: string
    loans_disbursed: number
    total_amount: number
    payments_collected: number
    collection_rate: number
}

export async function StaffPerformanceReport({ from, to }: StaffPerformanceReportProps) {
    const supabase = await createClient()

    const fromDate = from || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
    const toDate = to || new Date().toISOString()

    // Get all staff
    const { data: staffMembers } = await supabase
        .from('app_users')
        .select('id, full_name')
        .eq('role', 'STAFF')

    if (!staffMembers) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Staff Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No data available</p>
                </CardContent>
            </Card>
        )
    }

    // Get performance stats for each staff member
    const staffStats: StaffStats[] = []

    for (const member of staffMembers) {
        // Count loans disbursed by this staff's clients
        const { count: loansCount, data: loans } = await supabase
            .from('loan_applications')
            .select('amount, client_id, clients!inner(onboarding_agent_id)', { count: 'exact' })
            .eq('clients.onboarding_agent_id', member.id)
            .eq('process_stage', 'Disbursed')
            .gte('disbursement_date', fromDate)
            .lte('disbursement_date', toDate)

        const totalAmount = loans?.reduce((sum, loan) => sum + loan.amount, 0) || 0

        staffStats.push({
            staff_id: member.id,
            staff_name: member.full_name,
            loans_disbursed: loansCount || 0,
            total_amount: totalAmount,
            payments_collected: 0,
            collection_rate: 0
        })
    }

    // Sort by total amount descending
    staffStats.sort((a, b) => b.total_amount - a.total_amount)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Staff Performance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {staffStats.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No staff activity in this period</p>
                    ) : (
                        staffStats.slice(0, 5).map((member, index) => (
                            <div key={member.staff_id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                                    <div>
                                        <p className="font-semibold text-sm">{member.staff_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {member.loans_disbursed} loan{member.loans_disbursed !== 1 ? 's' : ''} active
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{formatCurrency(member.total_amount)}</p>
                                    <Badge variant="outline" className="text-xs">
                                        Total disbursed
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
