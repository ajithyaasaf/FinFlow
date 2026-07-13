import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateAmortizationSchedule } from "@/lib/amortization"
import { formatCurrency } from "@/lib/utils"
import { CalendarClock } from "lucide-react"

interface AmortizationScheduleProps {
    amount: number
    rate: number
    tenure: number
}

export function AmortizationSchedule({ amount, rate, tenure }: AmortizationScheduleProps) {
    const schedule = calculateAmortizationSchedule(amount, rate, tenure)
    const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
    const totalPayment = amount + totalInterest

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarClock className="h-5 w-5" />
                    Repayment Schedule
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg text-sm">
                    <div>
                        <p className="text-gray-500">Total Principal</p>
                        <p className="font-semibold">{formatCurrency(amount)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Total Interest</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(totalInterest)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Total Payable</p>
                        <p className="font-semibold text-primary">{formatCurrency(totalPayment)}</p>
                    </div>
                </div>

                <div className="rounded-md border h-[300px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Month</TableHead>
                                <TableHead>EMI</TableHead>
                                <TableHead>Principal</TableHead>
                                <TableHead>Interest</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((row) => (
                                <TableRow key={row.month}>
                                    <TableCell className="font-medium">{row.month}</TableCell>
                                    <TableCell>{formatCurrency(row.payment)}</TableCell>
                                    <TableCell className="text-green-600">{formatCurrency(row.principal)}</TableCell>
                                    <TableCell className="text-orange-600">{formatCurrency(row.interest)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
