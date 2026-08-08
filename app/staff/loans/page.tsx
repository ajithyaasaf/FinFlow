'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search, Plus, CreditCard, Eye, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { STAGE_COLORS } from '@/lib/services/loginsConstants'
import { TableSkeleton } from '@/components/dashboard/table-skeleton'
import { LoanStatusUpdate } from '@/components/dashboard/loan-status-update'

interface StaffLoan {
    loan_id: string
    amount: number
    interest_rate: number
    tenure: number
    process_stage: string
    created_at: string
    client: {
        full_name: string
        mobile_number: string
        onboarding_agent_id?: string | null
    } | null
}

export default function StaffLoansPage() {
    const [loans, setLoans] = useState<StaffLoan[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchLoans()
    }, [])

    const fetchLoans = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch user role/profile
            const { data: profile } = await supabase
                .from('app_users')
                .select('role, is_tl')
                .eq('id', user.id)
                .single()

            // 2. Fetch loans with client details
            const { data: allLoans, error } = await supabase
                .from('loan_applications')
                .select(`
                    loan_id,
                    amount,
                    interest_rate,
                    tenure,
                    process_stage,
                    created_at,
                    assigned_tl_id,
                    client:clients (
                        client_id,
                        full_name,
                        mobile_number,
                        onboarding_agent_id
                    )
                `)
                .order('created_at', { ascending: false })

            if (!error && allLoans) {
                const accessibleLoans = (allLoans as any[]).filter((loan) => {
                    // Admin / MD can see all loans
                    if (profile?.role === 'ADMIN' || profile?.role === 'MD') return true
                    // Assigned Team Leader (e.g. Durga) sees loan
                    if (loan.assigned_tl_id === user.id) return true
                    // Onboarding Agent sees loan
                    if (loan.client?.onboarding_agent_id === user.id) return true
                    return false
                })
                setLoans(accessibleLoans)
            } else {
                setLoans([])
            }
        } catch (err) {
            console.error('Error fetching staff loans:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredLoans = loans.filter((loan) => {
        const q = search.toLowerCase()
        const clientName = loan.client?.full_name?.toLowerCase() || ''
        const clientPhone = loan.client?.mobile_number || ''
        const loanId = loan.loan_id.toLowerCase()
        return clientName.includes(q) || clientPhone.includes(q) || loanId.includes(q)
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Loan Applications</h1>
                    <p className="text-sm text-gray-500">Track and manage client loan applications</p>
                </div>
                <Link href="/staff/loans/new">
                    <Button className="gap-2 shadow-sm rounded-xl">
                        <Plus className="h-4 w-4" />
                        Create Loan Application
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by client name, phone, or loan ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-11 bg-white rounded-xl border-gray-200"
                />
            </div>

            {/* Content */}
            {loading ? (
                <TableSkeleton rows={5} />
            ) : filteredLoans.length === 0 ? (
                <Card className="rounded-2xl border-gray-100">
                    <CardContent className="p-8 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900">No Loan Applications Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            {search ? 'No loans match your search criteria.' : 'No loan applications have been assigned or created yet.'}
                        </p>
                        {!search && (
                            <Link href="/staff/loans/new">
                                <Button variant="outline" size="sm" className="mt-2 rounded-xl gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Application
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredLoans.map((loan) => {
                        const stageColor = STAGE_COLORS[loan.process_stage] || 'bg-gray-100 text-gray-700 border-gray-200'

                        return (
                            <Card key={loan.loan_id} className="hover:shadow-md transition-all duration-200 rounded-2xl border-gray-100">
                                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 text-base">
                                                {loan.client?.full_name || 'Unknown Client'}
                                            </p>
                                            <Badge className={`text-[11px] px-2.5 py-0.5 font-medium border ${stageColor}`}>
                                                {loan.process_stage}
                                            </Badge>
                                        </div>

                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <span>📱 {loan.client?.mobile_number || 'N/A'}</span>
                                            <span>•</span>
                                            <span className="font-mono">ID: {loan.loan_id.slice(0, 8)}</span>
                                            <span>•</span>
                                            <span>{formatDate(loan.created_at)}</span>
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        <div className="text-right mr-2">
                                            <p className="text-base font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                                            <p className="text-[11px] text-gray-500">{loan.interest_rate}% / {loan.tenure}m</p>
                                        </div>

                                        <LoanStatusUpdate
                                            loanId={loan.loan_id}
                                            currentStage={loan.process_stage}
                                            clientName={loan.client?.full_name || 'Client'}
                                            loanAmount={loan.amount}
                                            interestRate={loan.interest_rate}
                                            tenure={loan.tenure}
                                            agentId={loan.client?.onboarding_agent_id}
                                            onStatusChange={(stage) => setLoans(prev => prev.map(l => l.loan_id === loan.loan_id ? { ...l, process_stage: stage } : l))}
                                        />

                                        <Link href={`/staff/loans/${loan.loan_id}`}>
                                            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs">
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
