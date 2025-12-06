'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoanStatusUpdate } from '@/components/dashboard/loan-status-update'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Phone, Search, Filter } from 'lucide-react'
import type { LoanApplication, Client } from '@/types'

interface LoanWithDetails extends LoanApplication {
    client: Client | null
}

const STAGE_COLORS: Record<string, string> = {
    'Application Submitted': 'bg-blue-100 text-blue-800',
    'Document Verification': 'bg-yellow-100 text-yellow-800',
    'Credit Appraisal': 'bg-purple-100 text-purple-800',
    'Approval': 'bg-green-100 text-green-800',
    'Disbursement': 'bg-indigo-100 text-indigo-800',
    'Closed': 'bg-gray-100 text-gray-800',
}

interface LoansListProps {
    loans: LoanWithDetails[]
}

export function LoansList({ loans }: LoansListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStage, setFilterStage] = useState<string>('all')

    // Filter loans
    const filteredLoans = loans.filter((loan) => {
        const matchesSearch = loan.client?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.client?.mobile_number.includes(searchTerm)

        const matchesStage = filterStage === 'all' || loan.process_stage === filterStage

        return matchesSearch && matchesStage
    })

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by client name or mobile number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="Application Submitted">Application Submitted</SelectItem>
                        <SelectItem value="Document Verification">Document Verification</SelectItem>
                        <SelectItem value="Credit Appraisal">Credit Appraisal</SelectItem>
                        <SelectItem value="Approval">Approval</SelectItem>
                        <SelectItem value="Disbursement">Disbursement</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-600">
                Showing {filteredLoans.length} of {loans.length} loans
                {searchTerm && ` matching "${searchTerm}"`}
                {filterStage !== 'all' && ` in stage "${filterStage}"`}
            </p>

            {/* Loans List */}
            {filteredLoans.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-sm text-gray-600">No loans found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {searchTerm || filterStage !== 'all' ? 'Try adjusting your filters' : 'Loans will appear here when created'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredLoans.map((loan) => (
                        <div
                            key={loan.loan_id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-lg">
                                            {loan.client?.full_name || 'Unknown Client'}
                                        </h3>
                                        <Badge className={STAGE_COLORS[loan.process_stage] || 'bg-gray-100'}>
                                            {loan.process_stage}
                                        </Badge>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Amount: <strong>{formatCurrency(loan.amount)}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span>Rate: <strong>{loan.interest_rate}% p.a.</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span>Tenure: <strong>{loan.tenure} months</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="h-4 w-4" />
                                            <span>{loan.client?.mobile_number}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-2">
                                        Applied {formatDate(loan.created_at)} • Last updated {formatDate(loan.updated_at)}
                                    </p>
                                </div>

                                <div className="ml-4">
                                    <LoanStatusUpdate
                                        loanId={loan.loan_id}
                                        currentStage={loan.process_stage}
                                        clientName={loan.client?.full_name || 'Client'}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
