'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileDown } from 'lucide-react'
import Link from 'next/link'
import { LoansDataTable } from '@/components/dashboard/loans-data-table'
import { LoansFilters } from '@/components/dashboard/loans-filters'
import { createClient } from '@/lib/supabase/client'
import type { LoanWithRelations } from '@/lib/services/loanService'
import Loading from './loading'

function AdminLoansPageContent() {
    const searchParams = useSearchParams()
    
    const [loading, setLoading] = useState(true)
    const [agents, setAgents] = useState<any[]>([])
    const [loans, setLoans] = useState<LoanWithRelations[]>([])
    const [total, setTotal] = useState(0)

    const status = searchParams.get('status') || 'all'
    const agent = searchParams.get('agent') || 'all'
    const search = searchParams.get('search') || ''
    const fromDate = searchParams.get('from') || ''
    const toDate = searchParams.get('to') || ''
    const page = searchParams.get('page') || '1'
    const currentPage = parseInt(page)

    useEffect(() => {
        async function fetchLoansData() {
            setLoading(true)
            try {
                const supabase = createClient()

                // Fetch agents list
                const agentsPromise = supabase
                    .from('app_users')
                    .select('*')
                    .eq('role', 'STAFF')
                    .order('full_name')

                // Build query for loans
                const pageSize = 20
                const rangeFrom = (currentPage - 1) * pageSize
                const rangeTo = rangeFrom + pageSize - 1

                let query = supabase
                    .from('loan_applications')
                    .select(`
                        *,
                        client:clients(*),
                        onboarding_agent:clients(onboarding_agent:app_users(*))
                    `, { count: 'exact' })

                if (status && status !== 'all') {
                    query = query.eq('process_stage', status)
                }
                if (fromDate) {
                    query = query.gte('created_at', fromDate)
                }
                if (toDate) {
                    query = query.lte('created_at', toDate)
                }

                const [agentsRes, loansRes] = await Promise.all([
                    agentsPromise,
                    query.order('created_at', { ascending: false }).range(rangeFrom, rangeTo)
                ])

                if (agentsRes.data) {
                    setAgents(agentsRes.data)
                }

                if (loansRes.data) {
                    // Process nested data
                    let processedLoans = (loansRes.data as any[]).map(loan => ({
                        ...loan,
                        client: Array.isArray(loan.client) ? loan.client[0] : loan.client,
                        onboarding_agent: Array.isArray(loan.onboarding_agent)
                            ? loan.onboarding_agent[0]?.onboarding_agent || null
                            : loan.onboarding_agent?.onboarding_agent || null
                    })) as LoanWithRelations[]

                    // Client-side filtering for agent and name search
                    if (agent && agent !== 'all') {
                        processedLoans = processedLoans.filter(loan => loan.onboarding_agent?.id === agent)
                    }
                    if (search) {
                        const searchLower = search.toLowerCase()
                        processedLoans = processedLoans.filter(loan =>
                            loan.client?.full_name?.toLowerCase().includes(searchLower)
                        )
                    }

                    setLoans(processedLoans)
                    setTotal(loansRes.count || 0)
                }
            } catch (error) {
                console.error('Error fetching loans data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLoansData()
    }, [status, agent, search, fromDate, toDate, page])

    if (loading) {
        return <Loading />
    }

    const pageSize = 20
    const totalPages = Math.ceil(total / pageSize)

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Loan Management</h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Track, verify, and approve customer loan applications
                    </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <Button variant="outline" className="gap-2 text-sm">
                        <FileDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Link href="/dashboard/loans/new">
                        <Button className="gap-2 text-sm">
                            <Plus className="h-4 w-4" />
                            New Loan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <LoansFilters agents={agents} />
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Loans</CardTitle>
                </CardHeader>
                <CardContent>
                    <LoansDataTable
                        loans={loans}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        total={total}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

import { Suspense } from 'react'

export default function AdminLoansPage() {
    return (
        <Suspense fallback={<Loading />}>
            <AdminLoansPageContent />
        </Suspense>
    )
}
