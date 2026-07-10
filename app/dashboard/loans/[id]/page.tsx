'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoanStatusUpdate } from '@/components/dashboard/loan-status-update'
import { EditLoanTerms } from '@/components/dashboard/edit-loan-terms'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    User, Phone, Calendar, FileText, ArrowLeft, CheckCircle, AlertCircle, CreditCard, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { DocumentList } from '@/components/dashboard/document-list'
import { createClient } from '@/lib/supabase/client'

export default function LoanDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [loan, setLoan] = useState<any>(null)
    const [auditLogs, setAuditLogs] = useState<any[]>([])

    useEffect(() => {
        if (!id) return

        async function loadData() {
            setLoading(true)
            try {
                const supabase = createClient()

                // Fetch loan details
                const { data: loanData, error: loanError } = await supabase
                    .from('loan_applications')
                    .select(`
                        *,
                        client:clients(*, onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name))
                    `)
                    .eq('loan_id', id)
                    .single()

                if (loanError || !loanData) {
                    setLoan(null)
                    setLoading(false)
                    return
                }

                // Fetch related quotation if exists (matching client and amount approx)
                const { data: quotation } = await supabase
                    .from('quotations')
                    .select('*')
                    .eq('client_id', loanData.client_id)
                    .eq('amount', loanData.amount)
                    .order('created_at', { ascending: false })
                    .limit(1)

                // Fetch documents
                const { data: documents } = await supabase
                    .from('loan_documents')
                    .select('*')
                    .eq('loan_id', id)

                // Fetch audit logs
                const { data: logs } = await supabase
                    .from('system_logs')
                    .select(`
                        *,
                        user:app_users(full_name, email)
                    `)
                    .eq('entity_type', 'LOAN')
                    .eq('entity_id', id)
                    .order('created_at', { ascending: false })

                setLoan({
                    ...loanData,
                    quotation: (quotation && quotation.length > 0) ? quotation[0] : null,
                    documents: documents || []
                })
                setAuditLogs(logs || [])
            } catch (err) {
                console.error('Failed to load loan details:', err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Loading application details...</p>
            </div>
        )
    }

    if (!loan) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Application Not Found</h2>
                <p className="text-sm text-gray-600">The loan application ID does not exist or was deleted.</p>
                <Link href="/dashboard/loans">
                    <Button>Back to Loans</Button>
                </Link>
            </div>
        )
    }

    const STAGE_COLORS: Record<string, string> = {
        'Application Submitted': 'bg-blue-100 text-blue-800',
        'Document Verification': 'bg-yellow-100 text-yellow-800',
        'Credit Appraisal': 'bg-purple-100 text-purple-800',
        'Approval': 'bg-green-100 text-green-800',
        'Disbursement': 'bg-indigo-100 text-indigo-800',
        'Closed': 'bg-gray-100 text-gray-800',
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/loans">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Loan Application</h1>
                        <p className="text-xs md:text-sm text-gray-500">ID: {loan.loan_id}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <Badge className={`text-sm px-3 py-1 ${STAGE_COLORS[loan.process_stage] || 'bg-slate-100 text-slate-800'}`}>
                        {loan.process_stage}
                    </Badge>
                    <EditLoanTerms
                        loanId={loan.loan_id}
                        currentAmount={loan.amount}
                        currentRate={loan.interest_rate}
                        currentTenure={loan.tenure}
                        originalAmount={loan.original_amount}
                        originalRate={loan.original_rate}
                        originalTenure={loan.original_tenure}
                        clientName={loan.client?.full_name}
                        currentStage={loan.process_stage}
                    />
                    <LoanStatusUpdate
                        loanId={loan.loan_id}
                        currentStage={loan.process_stage}
                        clientName={loan.client?.full_name}
                        loanAmount={loan.amount}
                        interestRate={loan.interest_rate}
                        tenure={loan.tenure}
                        agentId={loan.client?.onboarding_agent_id}
                    />
                    {loan.process_stage === 'Disbursed' && (
                        <Link href={`/dashboard/loans/${loan.loan_id}/payments`}>
                            <Button variant="outline" className="gap-2">
                                <CreditCard className="h-4 w-4" />
                                Manage Payments
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column - Loan & Client Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Client Profile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-500" />
                                Client Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Full Name</label>
                                    <p className="text-lg font-medium">{loan.client?.full_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Mobile Number</label>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <p className="text-lg font-medium">{loan.client?.mobile_number}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Onboarded By</label>
                                    <p className="text-sm">{loan.client?.onboarding_agent?.full_name || 'Unknown Staff'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Client Since</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <p className="text-sm">{formatDate(loan.client?.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Loan Terms Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-500" />
                                Loan Terms
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-center p-1 md:p-2">
                                    <p className="text-xs md:text-sm text-gray-500 mb-1">Principal Amount</p>
                                    <p className="text-lg md:text-2xl font-bold text-slate-900">{formatCurrency(loan.amount)}</p>
                                </div>
                                <div className="text-center p-1 md:p-2 border-l border-slate-200">
                                    <p className="text-xs md:text-sm text-gray-500 mb-1">Interest Rate</p>
                                    <p className="text-lg md:text-2xl font-bold text-slate-900">{loan.interest_rate}%</p>
                                </div>
                                <div className="text-center p-1 md:p-2 border-l border-slate-200">
                                    <p className="text-xs md:text-sm text-gray-500 mb-1">Tenure</p>
                                    <p className="text-lg md:text-2xl font-bold text-slate-900">{loan.tenure} <span className="text-xs md:text-sm font-normal text-gray-500">months</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Documents & Actions */}
                <div className="space-y-6">
                    {/* Documents Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Documents</CardTitle>
                            <CardDescription>Verify client documents</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DocumentList documents={loan.documents} />
                        </CardContent>
                    </Card>

                    {/* Verification Checklist */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Verification Checklist</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className={`h-4 w-4 ${loan.client?.kyc_document_url ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className={loan.client?.kyc_document_url ? 'text-gray-700' : 'text-gray-400'}>
                                    KYC Document Uploaded
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className={`h-4 w-4 ${loan.quotation ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className={loan.quotation ? 'text-gray-700' : 'text-gray-400'}>
                                    Quotation Linked
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className={`h-4 w-4 ${loan.process_stage !== 'Application Submitted' ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className={loan.process_stage !== 'Application Submitted' ? 'text-gray-700' : 'text-gray-400'}>
                                    Initial Review
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <ActivityTimeline logs={auditLogs as any} />
                </div>
            </div>
        </div>
    )
}
