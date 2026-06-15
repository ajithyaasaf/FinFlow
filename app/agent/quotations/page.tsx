'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search, Plus, FileText, Download, Calendar, ArrowUpRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Quotation {
    quote_id: string
    client_id: string
    amount: number
    interest_rate: number
    tenure: number
    final_amount: number
    is_high_value: boolean
    pdf_document_url: string | null
    converted_to_loan_id: string | null
    status?: 'PENDING' | 'CONVERTED' | 'REJECTED'
    rejection_reason?: string | null
    created_at: string
    client: {
        full_name: string
        mobile_number: string
    } | null
}

export default function AgentQuotationsPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchQuotations()
    }, [])

    const fetchQuotations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('quotations')
                .select(`
                    *,
                    client:clients(full_name, mobile_number)
                `)
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setQuotations((data || []) as any)
        } catch (error) {
            console.error('Error fetching quotations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredQuotations = quotations.filter(q => {
        const clientName = q.client?.full_name?.toLowerCase() || ''
        const clientMobile = q.client?.mobile_number || ''
        const searchLower = search.toLowerCase()
        return clientName.includes(searchLower) || clientMobile.includes(searchLower)
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Quotations"
                subtitle="View and manage generated quotations"
                backHref="/agent"
            />

            <main className="p-4 pb-24 space-y-4">
                {/* Search and Add Action */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by client name or mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-11 bg-white border-gray-200 rounded-xl"
                        />
                    </div>
                    <Link href="/agent/quotation">
                        <Button className="h-11 px-4 rounded-xl flex items-center gap-1.5">
                            <Plus className="h-5 w-5" />
                            <span>Create</span>
                        </Button>
                    </Link>
                </div>

                {/* Listing Content */}
                {loading ? (
                    <div className="space-y-3 pt-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : filteredQuotations.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-gray-150 rounded-xl px-4">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 text-lg">No quotations found</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-6">
                            {search ? 'Try adjusting your search criteria.' : 'Start by creating your first client quotation.'}
                        </p>
                        {!search && (
                            <Link href="/agent/quotation">
                                <Button className="rounded-xl">
                                    Create Quotation
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredQuotations.map((quote) => {
                            const currentStatus = quote.status || (quote.converted_to_loan_id ? 'CONVERTED' : 'PENDING')

                            return (
                                <Card key={quote.quote_id} className="border border-gray-200 bg-white hover:shadow-sm transition-all duration-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">
                                                    {quote.client?.full_name || 'Unknown Client'}
                                                </h4>
                                                <p className="text-xs text-gray-600 font-medium">
                                                    {quote.client?.mobile_number}
                                                </p>
                                            </div>
                                            {currentStatus === 'CONVERTED' ? (
                                                <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 font-semibold gap-1 rounded-lg">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Converted
                                                </Badge>
                                            ) : currentStatus === 'REJECTED' ? (
                                                <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-200 font-semibold gap-1 rounded-lg">
                                                    <XCircle className="h-3 w-3" />
                                                    Rejected
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200 font-semibold gap-1 rounded-lg">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Quote Details */}
                                        <div className="grid grid-cols-2 gap-y-2 border-t border-b border-gray-100 py-3 mb-3 text-sm">
                                            <div>
                                                <span className="text-xs text-gray-600 font-medium block">Principal Amount</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(quote.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-600 font-medium block">Total Payable</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(quote.final_amount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-600 font-medium block">Interest Rate</span>
                                                <span className="font-medium text-gray-900">{quote.interest_rate}% p.a.</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-600 font-medium block">Tenure</span>
                                                <span className="font-medium text-gray-900">{quote.tenure} Months</span>
                                            </div>
                                        </div>

                                        {/* Rejection Feedback */}
                                        {currentStatus === 'REJECTED' && quote.rejection_reason && (
                                            <div className="bg-red-50/70 text-red-800 text-xs rounded-lg p-2.5 mb-3 border border-red-150 font-medium">
                                                <span className="font-bold">Admin Feedback:</span> {quote.rejection_reason}
                                            </div>
                                        )}

                                        {/* Footer Info */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatDateTime(quote.created_at)}</span>
                                            </div>

                                            {quote.pdf_document_url && (
                                                <a
                                                    href={quote.pdf_document_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={`Quotation-${quote.client?.full_name || 'Client'}.pdf`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-colors"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    <span>PDF</span>
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
