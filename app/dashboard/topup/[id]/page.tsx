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

export const dynamic = 'force-dynamic'

interface PageProps {
    params: {
        id: string
    }
}

export default async function TopUpOfferPage({ params }: PageProps) {
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
                <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Top-Up Loan Offer</h1>
                        <p className="text-xs md:text-sm text-gray-500">Offer ID: {offer.offer_id.slice(0, 8)}</p>
                    </div>
                </div>
                {getStatusBadge(offer.status)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Offer Amount */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Offered Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-4 md:p-6 rounded-lg">
                                <p className="text-xs md:text-sm text-gray-600 mb-2">Top-Up Loan</p>
                                <p className="text-2xl md:text-4xl font-bold text-primary">
                                    {formatCurrency(offer.offered_amount)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Client Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-semibold">{client.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Mobile</p>
                                    <p className="font-semibold">{client.mobile_number}</p>
                                </div>
                            </div>
                            <div className="pt-3 border-t">
                                <p className="text-sm text-gray-600 mb-2">Quick Actions</p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => window.open(whatsappUrl, '_blank')}
                                        className="gap-2"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Send WhatsApp
                                    </Button>
                                    <Link href={`/dashboard/loans/${loan.loan_id}`}>
                                        <Button size="sm" variant="outline">
                                            View Original Loan
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
                                <DollarSign className="h-5 w-5" />
                                Original Loan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Interest Rate</p>
                                    <p className="font-semibold">{loan.interest_rate}% p.a.</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tenure</p>
                                    <p className="font-semibold">{loan.tenure} months</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Eligibility Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Eligibility Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">EMIs Paid</span>
                                <Badge variant="outline">
                                    {offer.eligibility_details?.emisPaid}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Principal Repaid</span>
                                <Badge variant="outline">
                                    {offer.eligibility_details?.repaidPercentage?.toFixed(1)}%
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Missed Payments</span>
                                <Badge variant={offer.eligibility_details?.missedPayments > 0 ? 'destructive' : 'default'}>
                                    {offer.eligibility_details?.missedPayments}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Amount Repaid</span>
                                <span className="font-semibold text-sm">
                                    {formatCurrency(offer.eligibility_details?.principalRepaid || 0)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Offer Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-600">Offered On</p>
                                <p className="font-semibold">{formatDate(offer.offered_at)}</p>
                            </div>
                            {offer.expires_at && (
                                <div>
                                    <p className="text-gray-600">Expires On</p>
                                    <p className="font-semibold">{formatDate(offer.expires_at)}</p>
                                </div>
                            )}
                            {offer.accepted_at && (
                                <div>
                                    <p className="text-gray-600">Accepted On</p>
                                    <p className="font-semibold">{formatDate(offer.accepted_at)}</p>
                                </div>
                            )}
                            {offer.rejected_at && (
                                <div>
                                    <p className="text-gray-600">Rejected On</p>
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
                            loanId={loan.loan_id}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
