'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Phone, FileText, Calendar, User, CreditCard, Plus, Download, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface ClientDetailsProps {
    params: {
        id: string
    }
}

interface ClientData {
    client_id: string
    full_name: string
    mobile_number: string
    pan_number: string
    created_at: string
    kyc_document_url: string | null
    loans: {
        loan_id: string
        amount: number
        status: string
        created_at: string
        interest_rate: number
        tenure: number
    }[]
}

export default function ClientDetailsPage({ params }: ClientDetailsProps) {
    const router = useRouter()
    const supabase = createClient()
    const [client, setClient] = useState<ClientData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchClientDetails()
    }, [params.id])

    const fetchClientDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select(`
                    *,
                    loans:loan_applications(
                        loan_id,
                        amount,
                        interest_rate,
                        tenure,
                        status:process_stage,
                        created_at
                    )
                `)
                .eq('client_id', params.id)
                .single()

            if (error) throw error
            setClient(data)
        } catch (error) {
            console.error('Error fetching client:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <PageHeader title="Client Details" backHref="/staff/clients" />
                <main className="p-4 space-y-4">
                    {/* Personal Information Skeleton */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-center">
                            <Skeleton className="h-20 w-20 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-16 rounded-lg" />
                            <Skeleton className="h-5 w-40 rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-20 rounded-lg" />
                            <Skeleton className="h-5 w-48 rounded-lg" />
                        </div>
                    </div>
                    {/* Loan History Card Skeleton */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                        <Skeleton className="h-5 w-32 rounded-lg" />
                        <div className="space-y-2 pt-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <Skeleton className="h-4 w-28 rounded-lg" />
                                    <Skeleton className="h-8 w-20 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-gray-50">
                <PageHeader title="Client Details" backHref="/staff/clients" />
                <div className="p-4 text-center">Client not found</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Client Details"
                backHref="/staff/clients"
            />

            <main className="p-4 pb-24 space-y-4">
                {/* Client Info Card */}
                <Card className="border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                                {client.full_name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-gray-600">Full Name</p>
                            <p className="text-base font-semibold text-gray-900">{client.full_name}</p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-600">Mobile Number</p>
                            <div className="flex items-center justify-between">
                                <p className="text-base font-semibold text-gray-900">{client.mobile_number}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => window.location.href = `tel:${client.mobile_number}`}
                                >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                </Button>
                            </div>
                        </div>

                        {client.pan_number && (
                            <div>
                                <p className="text-xs text-gray-600">PAN Number</p>
                                <p className="text-base font-semibold text-gray-900">{client.pan_number}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-xs text-gray-600">Client Since</p>
                            <p className="text-sm text-gray-900">{formatDateTime(client.created_at)}</p>
                        </div>

                        {client.kyc_document_url && (
                            <div>
                                <p className="text-xs text-gray-600 mb-2">KYC Document</p>
                                <Button asChild variant="outline" size="sm">
                                    <a href={client.kyc_document_url} target="_blank" rel="noopener noreferrer">
                                        <FileText className="h-3 w-3 mr-1" />
                                        View Document
                                    </a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Loans Card */}
                <Card className="border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Loan History ({client.loans?.length || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {!client.loans || client.loans.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-600">No loans yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {client.loans.map((loan) => (
                                    <div key={loan.loan_id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-base font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                                                <p className="text-xs text-gray-600">{loan.interest_rate}% • {loan.tenure} months</p>
                                            </div>
                                            <Badge variant={loan.status === 'Disbursed' ? 'default' : 'secondary'}>
                                                {loan.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-600">
                                                <Calendar className="h-3 w-3 inline mr-1" />
                                                {formatDateTime(loan.created_at)}
                                            </p>
                                            <Button asChild variant="outline" size="sm" className="h-8">
                                                <Link href={`/staff/loans/${loan.loan_id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
