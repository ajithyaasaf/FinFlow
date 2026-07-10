'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConvertToLoan } from '@/components/dashboard/convert-to-loan'
import { RejectQuotationDialog } from '@/components/dashboard/reject-quotation-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Search, Filter, FileText, User, CreditCard, Calendar, Phone, AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Quotation, Client, AppUser } from '@/types'

interface QuotationWithDetails extends Quotation {
    client: Client | null
    created_by_user: AppUser | null
}

interface QuotationsListProps {
    quotations: QuotationWithDetails[]
}

export function QuotationsList({ quotations }: QuotationsListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterValueTier, setFilterValueTier] = useState<string>('all')

    // Filter quotations
    const filteredQuotations = quotations.filter((quote) => {
        const clientName = quote.client?.full_name || ''
        const clientMobile = quote.client?.mobile_number || ''
        const agentName = quote.created_by_user?.full_name || ''
        
        const matchesSearch = 
            clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientMobile.includes(searchTerm) ||
            agentName.toLowerCase().includes(searchTerm.toLowerCase())

        // Fallback status logic for older records
        const currentStatus = quote.status || (quote.converted_to_loan_id ? 'CONVERTED' : 'PENDING')
        const matchesStatus = 
            filterStatus === 'all' ||
            (filterStatus === 'converted' && currentStatus === 'CONVERTED') ||
            (filterStatus === 'rejected' && currentStatus === 'REJECTED') ||
            (filterStatus === 'pending' && currentStatus === 'PENDING')

        const matchesValueTier =
            filterValueTier === 'all' ||
            (filterValueTier === 'high_value' && quote.is_high_value) ||
            (filterValueTier === 'standard' && !quote.is_high_value)

        return matchesSearch && matchesStatus && matchesValueTier
    })

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by client, mobile, or staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[150px] h-10">
                            <Filter className="h-3.5 w-3.5 mr-2 text-gray-500" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterValueTier} onValueChange={setFilterValueTier}>
                        <SelectTrigger className="w-[150px] h-10">
                            <CreditCard className="h-3.5 w-3.5 mr-2 text-gray-500" />
                            <SelectValue placeholder="Value Tier" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tiers</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="high_value">High Value</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-600">
                Showing {filteredQuotations.length} of {quotations.length} quotations
                {searchTerm && ` matching "${searchTerm}"`}
            </p>

            {/* List */}
            {filteredQuotations.length === 0 ? (
                <Card className="border border-dashed border-gray-300">
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-600">No quotations found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Try adjusting your filters or search term
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredQuotations.map((quote) => {
                        const currentStatus = quote.status || (quote.converted_to_loan_id ? 'CONVERTED' : 'PENDING')
                        const isPending = currentStatus === 'PENDING'

                        return (
                            <div
                                key={quote.quote_id}
                                className={`border rounded-xl p-4 md:p-5 transition-all bg-white hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                    quote.is_high_value
                                        ? 'border-orange-200 hover:border-orange-300'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-base md:text-lg">
                                            {quote.client?.full_name || 'Unknown Client'}
                                        </h3>
                                        
                                        {quote.is_high_value ? (
                                            <Badge variant="destructive" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                                                High Value (Needs Approval)
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                Standard
                                            </Badge>
                                        )}

                                        {currentStatus === 'CONVERTED' ? (
                                            <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                                                Converted
                                            </Badge>
                                        ) : currentStatus === 'REJECTED' ? (
                                            <Badge variant="destructive" className="bg-red-50 text-red-700 border border-red-200">
                                                Rejected
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500 border-gray-200">
                                                Pending
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-4 text-sm">
                                        <div>
                                            <span className="text-gray-400 block text-xs">Loan Amount</span>
                                            <span className="font-semibold text-gray-800">{formatCurrency(quote.amount)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-xs">Interest Rate</span>
                                            <span className="font-semibold text-gray-800">{quote.interest_rate}% p.a.</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-xs">Tenure</span>
                                            <span className="font-semibold text-gray-800">{quote.tenure} months</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-xs">Repayment Amount</span>
                                            <span className="font-semibold text-gray-800">{formatCurrency(quote.final_amount)}</span>
                                        </div>
                                    </div>

                                    {currentStatus === 'REJECTED' && quote.rejection_reason && (
                                        <div className="flex items-start gap-2 bg-red-50/70 border border-red-100 rounded-lg p-3 text-xs md:text-sm text-red-800">
                                            <AlertOctagon className="h-4 w-4 text-red-650 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold">Rejection Feedback:</span> {quote.rejection_reason}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{quote.client?.mobile_number || 'No Mobile'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                            <span>Staff: {quote.created_by_user?.full_name || 'Staff'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            <span>Generated: {formatDate(quote.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-center">
                                    {quote.pdf_document_url && (
                                        <a
                                            href={quote.pdf_document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="sm" variant="outline" className="h-9">
                                                <Download className="h-4 w-4 mr-1.5" />
                                                PDF
                                            </Button>
                                        </a>
                                    )}

                                    {isPending && (
                                        <div className="flex items-center gap-2">
                                            <RejectQuotationDialog
                                                quotationId={quote.quote_id}
                                                clientName={quote.client?.full_name || 'Client'}
                                            />
                                            <ConvertToLoan
                                                quotationId={quote.quote_id}
                                                clientId={quote.client_id}
                                                amount={quote.amount}
                                                interestRate={quote.interest_rate}
                                                tenure={quote.tenure}
                                                clientName={quote.client?.full_name || 'Client'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
