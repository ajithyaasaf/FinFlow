import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Clock, User, Edit, FileText } from 'lucide-react'

interface AuditLog {
    log_id: string
    action_type: string
    old_value: any
    new_value: any
    created_at: string
    user: {
        full_name: string
        email: string
    } | null
}

interface ActivityTimelineProps {
    logs: AuditLog[]
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    LOAN_CREATED: { label: 'Loan Created', color: 'bg-primary/10 text-primary', icon: FileText },
    LOAN_STATUS_CHANGE: { label: 'Status Updated', color: 'bg-purple-100 text-purple-800', icon: Edit },
    LOAN_TERMS_EDIT: { label: 'Terms Modified', color: 'bg-orange-100 text-orange-800', icon: Edit },
}

function formatChangeMessage(log: AuditLog): string {
    if (log.action_type === 'LOAN_STATUS_CHANGE' && log.new_value?.process_stage) {
        return `Changed status to: ${log.new_value.process_stage}`
    }

    if (log.action_type === 'LOAN_TERMS_EDIT') {
        const changes = []
        if (log.old_value?.amount !== log.new_value?.amount) {
            changes.push(`Amount: ₹${log.old_value?.amount} → ₹${log.new_value?.amount}`)
        }
        if (log.old_value?.interest_rate !== log.new_value?.interest_rate) {
            changes.push(`Rate: ${log.old_value?.interest_rate}% → ${log.new_value?.interest_rate}%`)
        }
        if (log.old_value?.tenure !== log.new_value?.tenure) {
            changes.push(`Tenure: ${log.old_value?.tenure} → ${log.new_value?.tenure} months`)
        }
        return changes.join(', ')
    }

    return 'No details available'
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
    if (!logs || logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Activity Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 text-center py-8">No activity recorded yet</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activity Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative space-y-4">
                    {/* Timeline vertical line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

                    {logs.map((log, index) => {
                        const actionConfig = ACTION_LABELS[log.action_type] || {
                            label: log.action_type,
                            color: 'bg-gray-100 text-gray-800',
                            icon: Edit,
                        }
                        const Icon = actionConfig.icon

                        return (
                            <div key={log.log_id} className="relative pl-10">
                                {/* Timeline dot */}
                                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-white border-2 border-primary" />

                                <div className="bg-gray-50 rounded-lg p-3 border">
                                    <div className="flex items-start justify-between mb-2">
                                        <Badge className={`text-xs ${actionConfig.color}`}>
                                            <Icon className="h-3 w-3 mr-1" />
                                            {actionConfig.label}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {formatDateTime(log.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-700 mb-2">
                                        {formatChangeMessage(log)}
                                    </p>

                                    {log.user && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <User className="h-3 w-3" />
                                            <span>{log.user.full_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
