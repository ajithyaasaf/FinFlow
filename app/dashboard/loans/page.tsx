import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { LoansDataTable } from '@/components/dashboard/loans-data-table'
import { LoansFilters } from '@/components/dashboard/loans-filters'
import { getLoans } from '@/lib/services/loanService'
import { getAgents } from '@/lib/services/agentService'
import type { LoanWithRelations } from '@/lib/services/loanService'

export type { LoanWithRelations }

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

export default async function AdminLoansPage({ searchParams }: PageProps) {
    const params = await searchParams
    const currentPage = parseInt(params.page || '1')

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
                    <Suspense fallback={
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
                            ))}
                        </div>
                    }>
                        <FiltersLoader />
                    </Suspense>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Loans</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={
                        <div className="space-y-4 py-4">
                            <div className="h-8 bg-gray-100 rounded animate-pulse w-full"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-50 rounded animate-pulse w-full"></div>
                            ))}
                        </div>
                    }>
                        <LoansTableLoader params={params} currentPage={currentPage} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}

async function FiltersLoader() {
    const agents = await getAgents()
    return <LoansFilters agents={agents} />
}

async function LoansTableLoader({ params, currentPage }: { params: any; currentPage: number }) {
    const { loans, total } = await getLoans(params)
    const pageSize = 20
    const totalPages = Math.ceil(total / pageSize)

    return (
        <LoansDataTable
            loans={loans}
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
        />
    )
}
