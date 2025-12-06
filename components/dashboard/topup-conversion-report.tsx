import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

interface TopUpConversionReportProps {
    from?: string
    to?: string
}

export async function TopUpConversionReport({ from, to }: TopUpConversionReportProps) {
    const supabase = await createClient()

    const fromDate = from || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
    const toDate = to || new Date().toISOString()

    // Get all top-up offers in period
    const { data: offers } = await supabase
        .from('topup_offers')
        .select('offer_id, offered_amount, status')
        .gte('offered_at', fromDate)
        .lte('offered_at', toDate)

    const totalOffers = offers?.length || 0
    const acceptedOffers = offers?.filter(o => o.status === 'ACCEPTED').length || 0
    const rejectedOffers = offers?.filter(o => o.status === 'REJECTED').length || 0
    const pendingOffers = offers?.filter(o => o.status === 'PENDING').length || 0

    const conversionRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0

    const totalOfferedAmount = offers?.reduce((sum, o) => sum + o.offered_amount, 0) || 0
    const acceptedAmount = offers
        ?.filter(o => o.status === 'ACCEPTED')
        .reduce((sum, o) => sum + o.offered_amount, 0) || 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Top-Up Loan Conversion
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-blue-600 uppercase mb-1">Total Offers</p>
                        <p className="text-2xl font-bold text-blue-900">{totalOffers}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <p className="text-xs text-green-600 uppercase">Accepted</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{acceptedOffers}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <p className="text-xs text-red-600 uppercase">Rejected</p>
                        </div>
                        <p className="text-2xl font-bold text-red-900">{rejectedOffers}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase mb-1">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{pendingOffers}</p>
                    </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <Badge variant={conversionRate >= 50 ? 'default' : conversionRate >= 30 ? 'secondary' : 'outline'}>
                            {conversionRate.toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(conversionRate, 100)}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Total Offered</p>
                            <p className="text-lg font-semibold">{formatCurrency(totalOfferedAmount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Accepted Value</p>
                            <p className="text-lg font-semibold text-green-600">{formatCurrency(acceptedAmount)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
