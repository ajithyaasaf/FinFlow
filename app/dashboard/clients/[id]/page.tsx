import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ArrowLeft, User, Phone, Mail, CreditCard, FileText,
    Calendar, MapPin, Building, ChevronRight, Plus, Edit
} from 'lucide-react'
import Link from 'next/link'
import { ClientEditModal } from '@/components/dashboard/client-edit-modal'
import { ClientDeleteDialog } from '@/components/dashboard/client-delete-dialog'
import type { Client, LoanApplication, Quotation } from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

// Data fetching functions
async function getClientDetails(clientId: string) {
    const supabase = await createClient()

    // Fetch client with agent info
    const { data: client, error } = await supabase
        .from('clients')
        .select(`
            *,
            onboarding_agent:app_users!clients_onboarding_agent_id_fkey(id, full_name, email)
        `)
        .eq('client_id', clientId)
        .single()

    if (error || !client) return null

    // Fetch client's loans
    const { data: loans } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    // Fetch client's quotations
    const { data: quotations } = await supabase
        .from('quotations')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    return {
        client,
        loans: loans || [],
        quotations: quotations || []
    }
}

// Stage color mapping
const STAGE_COLORS: Record<string, string> = {
    'Application Submitted': 'bg-blue-100 text-blue-800',
    'Document Verification': 'bg-yellow-100 text-yellow-800',
    'Credit Appraisal': 'bg-purple-100 text-purple-800',
    'Sanction': 'bg-indigo-100 text-indigo-800',
    'Agreement Signed': 'bg-cyan-100 text-cyan-800',
    'Disbursement Ready': 'bg-teal-100 text-teal-800',
    'Disbursed': 'bg-green-100 text-green-800',
}

// Info Item Component
function InfoItem({ icon: Icon, label, value }: {
    icon: any
    label: string
    value: string | null | undefined
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-medium">{value || '-'}</p>
            </div>
        </div>
    )
}

// Loans Section Component
function LoansSection({ loans, clientId }: { loans: LoanApplication[], clientId: string }) {
    if (loans.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Loan Applications</CardTitle>
                    <Link href={`/dashboard/loans?client=${clientId}`}>
                        <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Loan
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No loan applications yet</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Loan Applications ({loans.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loans.map((loan) => (
                    <Link key={loan.loan_id} href={`/dashboard/loans/${loan.loan_id}`}>
                        <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                                    <p className="text-sm text-gray-500">
                                        {loan.tenure} months @ {loan.interest_rate}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge className={STAGE_COLORS[loan.process_stage] || 'bg-gray-100'}>
                                    {loan.process_stage}
                                </Badge>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

// Quotations Section Component
function QuotationsSection({ quotations }: { quotations: Quotation[] }) {
    if (quotations.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Quotations ({quotations.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {quotations.slice(0, 5).map((quote) => (
                    <div
                        key={quote.quote_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                        <div>
                            <p className="font-semibold">{formatCurrency(quote.amount)}</p>
                            <p className="text-sm text-gray-500">
                                {quote.tenure} months @ {quote.interest_rate}%
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge variant={quote.converted_to_loan_id ? 'default' : 'secondary'}>
                                {quote.converted_to_loan_id ? 'Converted' : 'Pending'}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatDate(quote.created_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default async function ClientDetailPage({ params }: PageProps) {
    const { id } = await params
    const data = await getClientDetails(id)

    if (!data) {
        notFound()
    }

    const { client, loans, quotations } = data
    const agent = Array.isArray(client.onboarding_agent)
        ? client.onboarding_agent[0]
        : client.onboarding_agent

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
                        <p className="text-sm text-gray-500">Client Profile</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ClientEditModal client={client} />
                    <ClientDeleteDialog
                        clientId={client.client_id}
                        clientName={client.full_name}
                        hasLoans={loans.length > 0}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left Column - Client Info */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-3">
                                    {client.full_name.charAt(0)}
                                </div>
                                <h2 className="text-xl font-semibold">{client.full_name}</h2>
                                <p className="text-sm text-gray-500">{client.mobile_number}</p>
                            </div>

                            <div className="space-y-4">
                                <InfoItem icon={Phone} label="Mobile" value={client.mobile_number} />
                                <InfoItem icon={Mail} label="Email" value={client.email} />
                                <InfoItem icon={CreditCard} label="PAN" value={client.pan_number} />
                                <InfoItem icon={FileText} label="Aadhaar" value={client.aadhaar_number} />
                                <InfoItem icon={MapPin} label="Address" value={client.address} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agent Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Onboarding Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {agent?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-medium">{agent?.full_name || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{agent?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KYC Document */}
                    {client.kyc_document_url && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">KYC Document</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <a
                                    href={client.kyc_document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FileText className="h-8 w-8 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-sm">View Document</p>
                                        <p className="text-xs text-gray-500">Click to open in new tab</p>
                                    </div>
                                </a>
                            </CardContent>
                        </Card>
                    )}

                    {/* Meta Info */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>Added on {formatDate(client.created_at)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Loans & Quotations */}
                <div className="md:col-span-2 space-y-6">
                    <LoansSection loans={loans} clientId={client.client_id} />
                    <QuotationsSection quotations={quotations} />
                </div>
            </div>
        </div>
    )
}
