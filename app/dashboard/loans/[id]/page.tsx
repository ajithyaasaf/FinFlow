import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoanStatusUpdate } from '@/components/dashboard/loan-status-update'
import { EditLoanTerms } from '@/components/dashboard/edit-loan-terms'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    User, Phone, Calendar, FileText, ArrowLeft, CheckCircle, AlertCircle, CreditCard, MapPin
} from 'lucide-react'
import Link from 'next/link'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'

import { createClient } from '@/lib/supabase/server'
import { STAGE_COLORS } from '@/lib/services/loginsConstants'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: {
        id: string
    }
}

export default async function LoanDetailsPage({ params }: PageProps) {
    const id = params.id
    const supabase = await createClient()

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

    const loan = {
        ...loanData,
        documents: documents || []
    }
    const auditLogs = logs || []


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
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">PAN Number</label>
                                    <p className="text-sm">{loan.client?.pan_number || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Aadhaar Number</label>
                                    <p className="text-sm">{loan.client?.aadhaar_number || '-'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business & Property Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-gray-500" />
                                Business & Property Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Company Name</label>
                                    <p className="text-sm font-medium">{loan.client?.company_name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Constitution</label>
                                    <p className="text-sm">{loan.client?.constitution || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Industry / Nature</label>
                                    <p className="text-sm">{[loan.client?.industry_type, loan.client?.nature_of_business].filter(Boolean).join(' - ') || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Property Details</label>
                                    <p className="text-sm">{loan.client?.property_details || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Ownership</label>
                                    <p className="text-sm">{loan.client?.ownership_type || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">IT Returns</label>
                                    <p className="text-sm">{loan.client?.regular_it || '-'}</p>
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
