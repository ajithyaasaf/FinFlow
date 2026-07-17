'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/agent/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateWhatsAppLink } from '@/lib/topup-notifications'
import {
    TrendingUp,
    MessageCircle,
    ChevronRight,
    Clock,
    CheckCircle,
    X,
    AlertTriangle,
    PhoneCall,
} from 'lucide-react'
import Link from 'next/link'

interface TopUpOffer {
    offer_id: string
    offered_amount: number
    status: string
    offered_at: string
    expires_at: string | null
    eligibility_details: {
        emisPaid?: number
        repaidPercentage?: number
        principalRepaid?: number
        missedPayments?: number
        monthsActive?: number
        disbursedDate?: string
        originalAmount?: number
    }
    client: {
        client_id: string
        full_name: string
        mobile_number: string
    }
    loan: {
        loan_id: string
        amount: number
    }
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { className: string; icon: any }> = {
        PENDING: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
        ACCEPTED: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
        REJECTED: { className: 'bg-red-100 text-red-800', icon: X },
        EXPIRED: { className: 'bg-gray-100 text-gray-600', icon: AlertTriangle },
        VOIDED: { className: 'bg-gray-100 text-gray-500', icon: X },
    }
    const { className, icon: Icon } = config[status] || config.PENDING
    return (
        <Badge className={`gap-1 text-xs ${className}`}>
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    )
}

export default function StaffTopUpPage() {
    const router = useRouter()
    const supabase = createClient()
    const [offers, setOffers] = useState<TopUpOffer[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING')

    useEffect(() => {
        async function fetchOffers() {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push('/login'); return }

                const { data } = await supabase
                    .from('topup_offers')
                    .select(`
                        offer_id,
                        offered_amount,
                        status,
                        offered_at,
                        expires_at,
                        eligibility_details,
                        client:clients(client_id, full_name, mobile_number),
                        loan:loan_applications(loan_id, amount)
                    `)
                    .order('offered_at', { ascending: false })

                setOffers((data as any) || [])
            } catch (err) {
                console.error('Error fetching top-up offers:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchOffers()
    }, [])

    const pendingOffers = offers.filter(o => o.status === 'PENDING')
    const displayedOffers = activeTab === 'PENDING' ? pendingOffers : offers

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <PageHeader title="Top-Up Leads" backHref="/staff/clients" />
                <main className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                            <Skeleton className="h-5 w-40 rounded-lg" />
                            <Skeleton className="h-4 w-28 rounded-lg" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20 rounded-lg" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHeader
                title="Top-Up Leads"
                subtitle={`${pendingOffers.length} pending`}
                backHref="/staff/clients"
            />

            <main className="p-4 space-y-4">
                {/* Summary KPIs */}
                <div className="grid grid-cols-3 gap-2">
                    <Card>
                        <CardContent className="pt-3 pb-3 text-center">
                            <p className="text-xl font-bold text-yellow-600">{pendingOffers.length}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-3 pb-3 text-center">
                            <p className="text-xl font-bold text-green-600">
                                {offers.filter(o => o.status === 'ACCEPTED').length}
                            </p>
                            <p className="text-xs text-gray-500">Converted</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-3 pb-3 text-center">
                            <p className="text-xl font-bold text-gray-500">
                                {offers.filter(o => o.status === 'REJECTED').length}
                            </p>
                            <p className="text-xs text-gray-500">Rejected</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tab Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'PENDING'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Pending ({pendingOffers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'ALL'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        All ({offers.length})
                    </button>
                </div>

                {/* Offers List */}
                {displayedOffers.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                            <p className="text-sm font-medium text-gray-600">No top-up leads yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Clients who qualify will appear here automatically
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {displayedOffers.map((offer) => {
                            const client = Array.isArray(offer.client) ? offer.client[0] : offer.client
                            const loan = Array.isArray(offer.loan) ? offer.loan[0] : offer.loan
                            const whatsappUrl = generateWhatsAppLink(
                                client?.mobile_number || '',
                                offer.offered_amount,
                                client?.full_name || ''
                            )

                            return (
                                <Card
                                    key={offer.offer_id}
                                    className={`border ${offer.status === 'PENDING' ? 'border-yellow-200' : 'border-gray-200'}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{client?.full_name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {client?.mobile_number}
                                                </p>
                                            </div>
                                            <StatusBadge status={offer.status} />
                                        </div>

                                        <div className="mb-3">
                                            <div className="bg-gray-50 rounded-lg p-2.5 flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Original Loan</span>
                                                <span className="font-semibold text-gray-800">
                                                    {formatCurrency(loan?.amount || 0)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 mb-3 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                                {offer.eligibility_details?.monthsActive} months active
                                            </Badge>
                                            {offer.eligibility_details?.disbursedDate && (
                                                <Badge variant="outline" className="text-xs">
                                                    Disbursed: {new Date(offer.eligibility_details.disbursedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </Badge>
                                            )}
                                        </div>

                                        {offer.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 gap-1"
                                                    onClick={() => window.open(whatsappUrl, '_blank')}
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    WhatsApp
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1"
                                                    onClick={() => window.location.href = `tel:${client?.mobile_number}`}
                                                >
                                                    <PhoneCall className="h-3.5 w-3.5" />
                                                </Button>
                                                <Link href={`/staff/topup/${offer.offer_id}`} className="flex-1">
                                                    <Button size="sm" className="w-full gap-1">
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                        Manage
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}

                                        {offer.status !== 'PENDING' && (
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>Offered {formatDate(offer.offered_at)}</span>
                                                <Link href={`/staff/topup/${offer.offer_id}`}>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
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
