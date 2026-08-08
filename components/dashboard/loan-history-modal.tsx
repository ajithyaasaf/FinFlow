'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Clock, User, CheckCircle, ArrowRight, FileText, AlertCircle, Sparkles, RefreshCw } from 'lucide-react'
import { getLoanAuditLogsAction } from '@/app/actions/loans'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface LoanHistoryModalProps {
    loanId: string
    clientName?: string
    referenceNo?: string
    trigger?: React.ReactNode
}

interface AuditLogItem {
    log_id: string
    action_type: string
    old_value: any
    new_value: any
    created_at: string
    user: {
        full_name: string
        email: string
        role: string
        is_tl?: boolean
    } | null
}

const ACTION_CONFIG: Record<string, { label: string; badgeColor: string; icon: any }> = {
    LOAN_STATUS_CHANGE: {
        label: 'Status Updated',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: RefreshCw,
    },
    LOAN_CREATED: {
        label: 'Application Created',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: FileText,
    },
    LOAN_DISBURSED: {
        label: 'Loan Disbursed',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
    },
    LOAN_TERMS_EDIT: {
        label: 'Terms Modified',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: RefreshCw,
    },
}

function getRoleBadge(user: AuditLogItem['user']) {
    if (!user) return 'System'
    if (user.role === 'MD') return 'Managing Director (MD)'
    if (user.role === 'ADMIN') return 'Admin'
    if (user.role === 'STAFF') {
        return user.is_tl ? 'Team Leader (TL)' : 'Staff'
    }
    return user.role
}

function renderChangeDetails(log: AuditLogItem) {
    const { action_type, old_value, new_value } = log

    if (action_type === 'LOAN_STATUS_CHANGE') {
        const oldStage = old_value?.process_stage || 'Previous'
        const newStage = new_value?.process_stage || 'Updated'
        const notes = new_value?.notes
        const rejectionReason = new_value?.rejection_reason
        const disbursementRef = new_value?.disbursement_reference

        return (
            <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">{oldStage}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-semibold">{newStage}</span>
                </div>
                {notes && (
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-600 border border-gray-100 italic">
                        &quot;{notes}&quot;
                    </div>
                )}
                {rejectionReason && (
                    <div className="p-2 bg-red-50 text-red-700 rounded-lg border border-red-100 font-medium">
                        Reason: {rejectionReason}
                    </div>
                )}
                {disbursementRef && (
                    <div className="text-gray-500 font-mono">
                        Ref: {disbursementRef}
                    </div>
                )}
            </div>
        )
    }

    if (action_type === 'LOAN_TERMS_EDIT') {
        return (
            <div className="space-y-1 text-xs text-gray-700">
                {old_value?.amount !== new_value?.amount && (
                    <p>Amount: <span className="line-through text-gray-400">{formatCurrency(old_value?.amount)}</span> ➔ <strong className="text-gray-900">{formatCurrency(new_value?.amount)}</strong></p>
                )}
                {old_value?.interest_rate !== new_value?.interest_rate && (
                    <p>Rate: <span className="line-through text-gray-400">{old_value?.interest_rate}%</span> ➔ <strong className="text-gray-900">{new_value?.interest_rate}%</strong></p>
                )}
                {old_value?.tenure !== new_value?.tenure && (
                    <p>Tenure: <span className="line-through text-gray-400">{old_value?.tenure}m</span> ➔ <strong className="text-gray-900">{new_value?.tenure}m</strong></p>
                )}
            </div>
        )
    }

    if (action_type === 'LOAN_CREATED') {
        return (
            <p className="text-xs text-gray-600">
                Created application with amount {new_value?.amount ? formatCurrency(new_value.amount) : ''} ({new_value?.interest_rate || 12}% / {new_value?.tenure || 12}m)
            </p>
        )
    }

    return (
        <p className="text-xs text-gray-500">
            {JSON.stringify(new_value || {})}
        </p>
    )
}

export function LoanHistoryModal({ loanId, clientName, referenceNo, trigger }: LoanHistoryModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<AuditLogItem[]>([])

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            setLoading(true)
            try {
                const res = await getLoanAuditLogsAction(loanId)
                if (res.success) {
                    setLogs(res.logs as any || [])
                }
            } catch (err) {
                console.error('Failed to load history:', err)
            } finally {
                setLoading(false)
            }
        }
    }

    const displayRef = referenceNo || loanId.slice(0, 8).toUpperCase()

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2.5 text-xs text-gray-600 hover:text-primary hover:border-primary/50 transition-colors rounded-xl"
                    >
                        <History className="h-3.5 w-3.5" />
                        History
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl border-gray-200">
                <DialogHeader className="p-5 pb-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <History className="h-4.5 w-4.5 text-primary" />
                                Loan Activity & Audit Trail
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Immutable event timeline for <strong className="font-mono text-gray-800">#{displayRef}</strong> {clientName ? `• ${clientName}` : ''}
                            </DialogDescription>
                        </div>
                        <Badge variant="secondary" className="text-[11px] font-mono shrink-0">
                            {logs.length} {logs.length === 1 ? 'event' : 'events'}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] p-5">
                    {loading ? (
                        <div className="space-y-4 py-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800">No activity logged yet</p>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                Stage transitions and term adjustments will be automatically recorded here with timestamps and user details.
                            </p>
                        </div>
                    ) : (
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                            {logs.map((log) => {
                                const config = ACTION_CONFIG[log.action_type] || {
                                    label: log.action_type.replace(/_/g, ' '),
                                    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
                                    icon: Sparkles,
                                }
                                const Icon = config.icon
                                const roleName = getRoleBadge(log.user)

                                return (
                                    <div key={log.log_id} className="relative group">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[27px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center text-primary shadow-xs">
                                            <Icon className="h-3 w-3" />
                                        </div>

                                        {/* Event Card */}
                                        <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs space-y-2 hover:border-gray-300 transition-colors">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <Badge className={`text-[10px] font-semibold border ${config.badgeColor}`}>
                                                    {config.label}
                                                </Badge>
                                                <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(log.created_at)}
                                                </span>
                                            </div>

                                            {/* Actor Info */}
                                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                                <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span className="font-semibold text-gray-900">{log.user?.full_name || 'System'}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-[11px] text-gray-500 font-medium">{roleName}</span>
                                            </div>

                                            {/* Diff / Context */}
                                            <div className="pt-1 border-t border-gray-100">
                                                {renderChangeDetails(log)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
