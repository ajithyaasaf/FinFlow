import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PaymentCollectionReportProps {
    from?: string
    to?: string
}

export async function PaymentCollectionReport({ from, to }: PaymentCollectionReportProps) {
    const supabase = await createClient()

    const fromDate = from || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
    const toDate = to || new Date().toISOString()

    // Total expected (all EMIs due in period)
    const { data: dueEMIs } = await supabase
        .from('emi_schedule')
        .select('emi_amount')
        .gte('due_date', fromDate.split('T')[0])
        .lte('due_date', toDate.split('T')[0])

    const totalExpected = dueEMIs?.reduce((sum, emi) => sum + emi.emi_amount, 0) || 0

    // Total collected
    const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', fromDate)
        .lte('payment_date', toDate)

    const totalCollected = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

    // Collection rate
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

    // Overdue analysis
    const { data: overdueEMIs } = await supabase
        .from('emi_schedule')
        .select('emi_amount, late_fee')
        .eq('status', 'OVERDUE')

    const overdueAmount = overdueEMIs?.reduce((sum, emi) => sum + emi.emi_amount, 0) || 0
    const totalLateFees = overdueEMIs?.reduce((sum, emi) => sum + (emi.late_fee || 0), 0) || 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Payment Collection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">Expected</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalExpected)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">Collected</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Collection Rate</span>
                        <Badge variant={collectionRate >= 90 ? 'default' : collectionRate >= 70 ? 'secondary' : 'destructive'}>
                            {collectionRate.toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(collectionRate, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Overdue Amount</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(overdueAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Late Fees</p>
                        <p className="text-lg font-semibold">{formatCurrency(totalLateFees)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
