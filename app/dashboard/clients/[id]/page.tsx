'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ArrowLeft, User, Phone, Mail, CreditCard, FileText,
    Calendar, MapPin, ChevronRight, Plus, Download, Loader2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { ClientEditModal } from '@/components/dashboard/client-edit-modal'
import { ClientDeleteDialog } from '@/components/dashboard/client-delete-dialog'
import { createClient } from '@/lib/supabase/client'
import type { LoanApplication } from '@/types'
import { STAGE_COLORS } from '@/lib/services/loginsConstants'


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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer gap-3">
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
                            <div className="flex items-center gap-2 md:gap-3">
                                <Badge className={STAGE_COLORS[loan.process_stage] || 'bg-gray-100'}>
                                    {loan.process_stage}
                                </Badge>
                                <ChevronRight className="h-5 w-5 text-gray-400 hidden sm:block" />
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

export default function ClientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [client, setClient] = useState<any>(null)
    const [loans, setLoans] = useState<any[]>([])

    useEffect(() => {
        if (!id) return

        async function loadData() {
            setLoading(true)
            try {
                const supabase = createClient()

                const { data: clientData, error: clientError } = await supabase
                    .from('clients')
                    .select(`
                        *,
                        onboarding_agent:app_users!clients_onboarding_agent_id_fkey(id, full_name, email)
                    `)
                    .eq('client_id', id)
                    .single()

                if (clientError || !clientData) {
                    setClient(null)
                    setLoading(false)
                    return
                }

                const { data: loansData } = await supabase
                    .from('loan_applications')
                    .select('*')
                    .eq('client_id', id)
                    .order('created_at', { ascending: false })

                setClient(clientData)
                setLoans(loansData || [])
            } catch (err) {
                console.error('Failed to load client details:', err)
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
                <p className="text-sm text-gray-500 font-medium font-sans">Loading client profile...</p>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Client Not Found</h2>
                <p className="text-sm text-gray-600">The client profile does not exist or was deleted.</p>
                <Link href="/dashboard/clients">
                    <Button>Back to Clients</Button>
                </Link>
            </div>
        )
    }

    const agent = Array.isArray(client.onboarding_agent)
        ? client.onboarding_agent[0]
        : client.onboarding_agent

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{client.full_name}</h1>
                        <p className="text-xs md:text-sm text-gray-500">Client Profile</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
                                <InfoItem icon={MapPin} label="Address" value={
                                    [client.address, client.city, client.state, client.zip_code].filter(Boolean).join(', ')
                                } />
                            </div>
                        </CardContent>
                    </Card>



                    <Card animate-duration-fast>
                        <CardHeader>
                            <CardTitle className="text-base">Onboarding Staff</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
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

                {/* Right Column - Loans */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Business & Property Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoItem icon={User} label="Company Name" value={client.company_name} />
                            <InfoItem icon={FileText} label="Constitution" value={client.constitution} />
                            <InfoItem icon={FileText} label="Industry / Nature" value={[client.industry_type, client.nature_of_business].filter(Boolean).join(' - ')} />
                            <InfoItem icon={MapPin} label="Property Details" value={client.property_details} />
                            <InfoItem icon={User} label="Ownership" value={client.ownership_type} />
                            <InfoItem icon={FileText} label="IT Returns" value={client.regular_it} />
                        </CardContent>
                    </Card>

                    <LoansSection loans={loans} clientId={client.client_id} />
                </div>
            </div>
        </div>
    )
}
