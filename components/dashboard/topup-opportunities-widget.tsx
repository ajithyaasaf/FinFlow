'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, ExternalLink, Loader2, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { generateWhatsAppLink } from '@/lib/topup-notifications'
import Link from 'next/link'

interface TopUpOpportunity {
    offer_id: string
    offered_amount: number
    offered_at: string
    client: {
        full_name: string
        mobile_number: string
    }
    loan: {
        loan_id: string
        amount: number
    }
    eligibility_details: {
        emisPaid?: number
        repaidPercentage?: number
        monthsActive?: number
        disbursedDate?: string
        originalAmount?: number
    }
}

export function TopUpOpportunitiesWidget() {
    const [opportunities, setOpportunities] = useState<TopUpOpportunity[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchOpportunities() {
            const { data } = await supabase
                .from('topup_offers')
                .select(`
          offer_id,
          offered_amount,
          offered_at,
          eligibility_details,
          client:clients(full_name, mobile_number),
          loan:loan_applications(loan_id, amount)
        `)
                .eq('status', 'PENDING')
                .order('offered_at', { ascending: false })
                .limit(10)

            setOpportunities((data as any) || [])
            setLoading(false)
        }

        fetchOpportunities()
    }, [])

    const handleWhatsAppClick = (mobile: string, amount: number, name: string) => {
        const url = generateWhatsAppLink(mobile, amount, name)
        window.open(url, '_blank')
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Top-Up Opportunities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Top-Up Opportunities
                    </CardTitle>
                    <Badge variant="secondary">{opportunities.length} Available</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {opportunities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No top-up opportunities yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Customers will appear here when they're eligible
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {opportunities.map((opp) => {
                            const client = Array.isArray(opp.client) ? opp.client[0] : opp.client
                            const loan = Array.isArray(opp.loan) ? opp.loan[0] : opp.loan

                            return (
                                <div
                                    key={opp.offer_id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{client?.full_name || 'Client'}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                            <span>Original: {formatCurrency(loan?.amount || 0)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {opp.eligibility_details.monthsActive} Months Active
                                            </Badge>
                                            {opp.eligibility_details.disbursedDate && (
                                                <Badge variant="outline" className="text-xs">
                                                    Disbursed: {new Date(opp.eligibility_details.disbursedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleWhatsAppClick(
                                                client?.mobile_number || '',
                                                opp.offered_amount,
                                                client?.full_name || ''
                                            )}
                                            className="gap-1"
                                        >
                                            <MessageCircle className="h-3 w-3" />
                                            WhatsApp
                                        </Button>
                                        <Link href={`/dashboard/topup/${opp.offer_id}`}>
                                            <Button size="sm" className="gap-1">
                                                <ExternalLink className="h-3 w-3" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {opportunities.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <Link href="/dashboard/topup">
                            <Button variant="outline" size="sm" className="w-full">
                                View All Opportunities
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
