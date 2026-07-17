import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    ArrowLeft, Clock, MessageCircle, User, DollarSign, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { generateWhatsAppLink } from '@/lib/topup-notifications'
import { TopUpActions } from '@/components/dashboard/topup-actions'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/agent/page-header'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: {
        id: string
    }
}

export default async function StaffTopUpOfferPage({ params }: PageProps) {
    const id = params.id
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('topup_offers')
        .select(`
            *,
            client:clients(*),
            loan:loan_applications(*)
        `)
        .eq('offer_id', id)
        .single()

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Offer Not Found</h2>
                <p className="text-sm text-gray-600">The top-up offer ID does not exist or was deleted.</p>
                <Link href="/staff/topup">
                    <Button>Back to Leads</Button>
                </Link>
            </div>
        )
    }

    const offer = data
    const client = Array.isArray(offer.client) ? offer.client[0] : offer.client
    const loan = Array.isArray(offer.loan) ? offer.loan[0] : offer.loan

    const whatsappUrl = generateWhatsAppLink(
        client.mobile_number,
        offer.offered_amount,
        client.full_name
    )

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            PENDING: { variant: 'secondary' as const, text: 'Pending' },
            ACCEPTED: { variant: 'default' as const, text: 'Accepted' },
            REJECTED: { variant: 'destructive' as const, text: 'Rejected' },
            EXPIRED: { variant: 'outline' as const, text: 'Expired' }
        }
        const config = variants[status] || variants.PENDING
        return <Badge variant={config.variant}>{config.text}</Badge>
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <PageHeader
                title="Top-Up Offer Details"
                subtitle={`Offer ID: ${offer.offer_id.slice(0, 8)}`}
                backHref="/staff/topup"
            />

            <main className="p-4 space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    {getStatusBadge(offer.status)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Eligibility Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Eligibility Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-green-50/50 border border-green-100 p-4 md:p-5 rounded-lg text-sm text-green-800 space-y-1">
                                    <p className="font-semibold">Pre-Approved for Top-Up</p>
                                    <p className="text-green-700 leading-relaxed">
                                        This client is eligible to apply for a top-up loan based on an active relationship of more than 12 months.
                                        Convert this offer to a loan to proceed to the creation form and specify the sanctioned amount.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-gray-500" />
                                    Client Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-semibold text-sm">{client.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Mobile</p>
                                        <p className="font-semibold text-sm">{client.mobile_number}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Quick Actions</p>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="gap-2 flex-1"
                                            asChild
                                        >
                                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle className="h-4 w-4" />
                                                Send Pitch
                                            </a>
                                        </Button>
                                        <Link href={`/staff/loans/${loan.loan_id}`} className="flex-1">
                                            <Button size="sm" variant="outline" className="w-full">
                                                Original Loan
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Original Loan Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-gray-500" />
                                    Original Loan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <p className="text-xs text-gray-500">Amount</p>
                                        <p className="font-semibold text-sm mt-0.5">{formatCurrency(loan.amount)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <p className="text-xs text-gray-500">Rate</p>
                                        <p className="font-semibold text-sm mt-0.5">{loan.interest_rate}% p.a.</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <p className="text-xs text-gray-500">Tenure</p>
                                        <p className="font-semibold text-sm mt-0.5">{loan.tenure} months</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Eligibility Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Eligibility Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-medium">Months Active</span>
                                    <Badge variant="outline" className="font-bold">
                                        {offer.eligibility_details?.monthsActive}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-medium">Disbursement Date</span>
                                    <span className="font-bold">
                                        {offer.eligibility_details?.disbursedDate ? formatDate(offer.eligibility_details.disbursedDate) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-medium">Original Loan Amount</span>
                                    <span className="font-bold">
                                        {formatCurrency(offer.eligibility_details?.originalAmount || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Offer Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <p className="text-gray-500">Offered On</p>
                                    <p className="font-semibold">{formatDate(offer.offered_at)}</p>
                                </div>
                                {offer.expires_at && (
                                    <div className="flex justify-between">
                                        <p className="text-gray-500">Expires On</p>
                                        <p className="font-semibold">{formatDate(offer.expires_at)}</p>
                                    </div>
                                )}
                                {offer.accepted_at && (
                                    <div className="flex justify-between">
                                        <p className="text-gray-500">Accepted On</p>
                                        <p className="font-semibold">{formatDate(offer.accepted_at)}</p>
                                    </div>
                                )}
                                {offer.rejected_at && (
                                    <div className="flex justify-between">
                                        <p className="text-gray-500">Rejected On</p>
                                        <p className="font-semibold">{formatDate(offer.rejected_at)}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        {offer.status === 'PENDING' && (
                            <TopUpActions
                                offerId={offer.offer_id}
                                clientName={client.full_name}
                                amount={offer.offered_amount}
                                clientId={client.client_id}
                                loanId={loan.loan_id}
                                userRole="STAFF"
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
