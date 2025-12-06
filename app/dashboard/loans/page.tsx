import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { LoansDataTable } from '@/components/dashboard/loans-data-table'
import { LoansFilters } from '@/components/dashboard/loans-filters'
import type { LoanApplication, Client, AppUser } from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{
        status?: string
        agent?: string
        search?: string
        from?: string
        to?: string
        page?: string
    }>
}

export interface LoanWithRelations extends LoanApplication {
    client: Client
    onboarding_agent: AppUser
}

async function getLoans(params: {
    status?: string
    agent?: string
    search?: string
    from?: string
    to?: string
    page?: string
}) {
    const supabase = await createClient()

    // Pagination
    const page = parseInt(params.page || '1')
    const pageSize = 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build and execute filtered query
    let query = supabase
        .from('loan_applications')
        .select(`
            *,
            client:clients(*),
            onboarding_agent:clients(onboarding_agent:app_users(*))
        `, { count: 'exact' })

    // Status filter
    if (params.status && params.status !== 'all') {
        query = query.eq('process_stage', params.status)
    }

    // Date range filter
    if (params.from) {
        query = query.gte('created_at', params.from)
    }
    if (params.to) {
        query = query.lte('created_at', params.to)
    }

    // Execute query with ordering and pagination
    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching loans:', error)
        return { loans: [], total: 0 }
    }

    // Process results
    let loans = (data as any[]).map(loan => ({
        ...loan,
        client: Array.isArray(loan.client) ? loan.client[0] : loan.client,
        onboarding_agent: Array.isArray(loan.onboarding_agent)
            ? loan.onboarding_agent[0]?.onboarding_agent || null
            : loan.onboarding_agent?.onboarding_agent || null
    })) as LoanWithRelations[]

    // Client-side filtering for agent and search (since nested filtering is limited in Supabase)
    if (params.agent && params.agent !== 'all') {
        loans = loans.filter(loan => {
            const agentId = loan.onboarding_agent?.id
            return agentId === params.agent
        })
    }

    if (params.search) {
        const searchLower = params.search.toLowerCase()
        loans = loans.filter(loan =>
            loan.client?.full_name?.toLowerCase().includes(searchLower)
        )
    }

    return {
        loans,
        total: count || 0
    }
}

async function getAgents() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('app_users')
        .select('id, full_name')
        .eq('role', 'AGENT')
        .order('full_name', { ascending: true })

    return data || []
}

export default async function AdminLoansPage({ searchParams }: PageProps) {
    const params = await searchParams
    const { loans, total } = await getLoans(params)
    const agents = await getAgents()

    const currentPage = parseInt(params.page || '1')
    const pageSize = 20
    const totalPages = Math.ceil(total / pageSize)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {total} total loan{total !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <FileDown className="h-4 w-4" />
                        Export
                    </Button>
                    <Link href="/dashboard/loans/new">
                        <Button className="gap-2">
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
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    }>
                        <LoansDataTable
                            loans={loans}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            total={total}
                        />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
