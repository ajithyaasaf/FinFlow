import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, ChevronRight, Clock, CheckCircle, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface TopUpOfferWithDetails {
    offer_id: string
    offered_amount: number
    status: string
    offered_at: string
    created_at: string
    client: any
    loan: any
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { variant: any; icon: any; className: string }> = {
        PENDING: { variant: 'secondary', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { variant: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
        REJECTED: { variant: 'destructive', icon: X, className: 'bg-red-100 text-red-800' },
        EXPIRED: { variant: 'outline', icon: AlertTriangle, className: 'bg-gray-100 text-gray-800' }
    }

    const { icon: Icon, className } = config[status] || config.PENDING

    return (
        <Badge className={`gap-1 ${className}`}>
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    )
}

export default async function TopUpListPage() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('topup_offers')
        .select(`
            *,
            client:clients(*),
            loan:loan_applications(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching top-up offers:', error)
    }

    const offers = (data || []) as TopUpOfferWithDetails[]
    const stats = {
        total: offers.length,
        pending: offers.filter(o => o.status === 'PENDING').length,
        accepted: offers.filter(o => o.status === 'ACCEPTED').length,
        rejected: offers.filter(o => o.status === 'REJECTED').length,
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Top-Up Offers</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage top-up loan offers for eligible customers</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-sm text-gray-500">Total Offers</p>
                    </CardContent>
                </Card>
                <Card className={stats.pending > 0 ? "border-yellow-300 bg-yellow-50" : ""}>
                    <CardContent className="pt-4">
                        <div className={`text-2xl font-bold ${stats.pending > 0 ? 'text-yellow-600' : ''}`}>
                            {stats.pending}
                        </div>
                        <p className="text-sm text-gray-500">Pending Review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                        <p className="text-sm text-gray-500">Accepted</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-gray-500">{stats.rejected}</div>
                        <p className="text-sm text-gray-500">Rejected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Offers List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        All Top-Up Offers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {offers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No top-up offers found.</p>
                            <p className="text-sm mt-1">
                                Offers are automatically generated when customers meet eligibility criteria.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {offers.map((offer) => {
                                const client = Array.isArray(offer.client) ? offer.client[0] : offer.client
                                const loan = Array.isArray(offer.loan) ? offer.loan[0] : offer.loan

                                return (
                                    <Link
                                        key={offer.offer_id}
                                        href={`/dashboard/topup/${offer.offer_id}`}
                                        className="block"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer gap-3">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <TrendingUp className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm md:text-base">{client?.full_name}</p>
                                                    <p className="text-xs md:text-sm text-gray-500">
                                                        Original: {formatCurrency(loan?.amount || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-4">
                                                <div className="text-right">
                                                    <StatusBadge status={offer.status} />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(offer.offered_at)}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-400 hidden sm:block" />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
