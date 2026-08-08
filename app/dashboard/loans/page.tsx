import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileDown } from 'lucide-react'
import Link from 'next/link'
import { LoansDataTable } from '@/components/dashboard/loans-data-table'
import { LoansFilters } from '@/components/dashboard/loans-filters'
import { createClient } from '@/lib/supabase/server'
import type { LoanWithRelations } from '@/lib/services/loanService'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface PageProps {
    searchParams: Promise<{
        status?: string
        agent?: string
        search?: string
        from?: string
        to?: string
        page?: string
    }> | {
        status?: string
        agent?: string
        search?: string
        from?: string
        to?: string
        page?: string
    }
}

export default async function AdminLoansPage({ searchParams }: PageProps) {
    const supabase = await createClient()

    // Next.js 15: await searchParams
    const sp = await Promise.resolve(searchParams)

    const status = sp.status || 'all'
    const agent = sp.agent || 'all'
    const search = (sp.search || '').trim()
    const fromDate = sp.from || ''
    const toDate = sp.to || ''
    const page = sp.page || '1'
    const currentPage = parseInt(page)

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
        query = query.gte('created_at', `${fromDate}T00:00:00.000Z`)
    }
    if (toDate) {
        query = query.lte('created_at', `${toDate}T23:59:59.999Z`)
    }

    const [agentsRes, loansRes] = await Promise.all([
        agentsPromise,
        query.order('created_at', { ascending: false }).range(rangeFrom, rangeTo)
    ])

    const agents = agentsRes.data || []
    let loans: LoanWithRelations[] = []
    let total = loansRes.count || 0

    if (loansRes.data) {
        // Process nested data
        let processedLoans = (loansRes.data as any[]).map(loan => ({
            ...loan,
            client: Array.isArray(loan.client) ? loan.client[0] : loan.client,
            onboarding_agent: Array.isArray(loan.onboarding_agent)
                ? loan.onboarding_agent[0]?.onboarding_agent || null
                : loan.onboarding_agent?.onboarding_agent || null
        })) as LoanWithRelations[]

        // Filtering for agent and search query
        if (agent && agent !== 'all') {
            processedLoans = processedLoans.filter(loan =>
                loan.onboarding_agent?.id === agent ||
                loan.assigned_tl_id === agent ||
                loan.client?.onboarding_agent_id === agent
            )
        }
        if (search) {
            const q = search.toLowerCase()
            processedLoans = processedLoans.filter(loan => {
                const clientName = (loan.client?.full_name || '').toLowerCase()
                const clientPhone = (loan.client?.mobile_number || '').toLowerCase()
                const loanId = (loan.loan_id || '').toLowerCase()
                const refNo = (loan.login_reference_number || '').toLowerCase()
                const staffName = (loan.onboarding_agent?.full_name || '').toLowerCase()

                return clientName.includes(q) ||
                    clientPhone.includes(q) ||
                    loanId.includes(q) ||
                    refNo.includes(q) ||
                    staffName.includes(q)
            })
        }

        loans = processedLoans
    }

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
