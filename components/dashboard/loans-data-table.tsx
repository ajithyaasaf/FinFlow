'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { LoanWithRelations } from '@/lib/services/loanService'

interface LoansDataTableProps {
    loans: LoanWithRelations[]
    currentPage: number
    totalPages: number
    total: number
}

export function LoansDataTable({ loans, currentPage, totalPages, total }: LoansDataTableProps) {
    const router = useRouter()

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            'Application Submitted': 'secondary',
            'Document Verification': 'outline',
            'Credit Appraisal': 'outline',
            'Sanction': 'default',
            'Agreement Signed': 'default',
            'Disbursement Ready': 'default',
            'Disbursed': 'default'
        }

        return (
            <Badge variant={variants[status] || 'secondary'}>
                {status}
            </Badge>
        )
    }

    const navigateToPage = (page: number) => {
        const params = new URLSearchParams(window.location.search)
        params.set('page', page.toString())
        router.push(`/dashboard/loans?${params.toString()}`)
    }

    if (loans.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No loans found matching your criteria</p>
                <Button
                    variant="link"
                    onClick={() => router.push('/dashboard/loans')}
                    className="mt-2"
                >
                    Clear filters
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Loan ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Rate/Tenure</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loans.map((loan) => {
                            const client = loan.client
                            const agent = loan.onboarding_agent

                            return (
                                <TableRow key={loan.loan_id}>
                                    <TableCell className="font-mono text-xs">
                                        {loan.loan_id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{client?.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{client?.mobile_number}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {agent?.full_name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(loan.amount)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {loan.interest_rate}% / {loan.tenure}m
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(loan.process_stage)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatDate(loan.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => router.push(`/dashboard/loans/${loan.loan_id}`)}
                                            className="gap-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing page {currentPage} of {totalPages} ({total} total loans)
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => navigateToPage(page)}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
