'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { calculateEMI, calculateTotalAmount } from '@/lib/utils'
import { Loader2, FileCheck } from 'lucide-react'
import { convertQuotationToLoanAction } from '@/app/actions/loan'

interface ConvertToLoanProps {
    quotationId: string
    clientId: string
    amount: number
    interestRate: number
    tenure: number
    clientName: string
}

export function ConvertToLoan({ quotationId, clientId, amount, interestRate, tenure, clientName }: ConvertToLoanProps) {
    const router = useRouter()

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleConvert = async () => {
        setLoading(true)

        try {
            const res = await convertQuotationToLoanAction({
                quotationId,
                clientId,
                amount,
                interestRate,
                tenure
            })

            if (!res.success) {
                toast.error(res.error || 'Failed to convert quotation')
                return
            }

            toast.success('Quotation converted to loan application successfully!')
            setOpen(false)
            router.refresh()

            // Redirect to loan details
            setTimeout(() => {
                router.push('/dashboard/loans')
            }, 1000)
        } catch (error) {
            console.error('Conversion error:', error)
            toast.error('Failed to convert quotation to loan')
        } finally {
            setLoading(false)
        }
    }

    const emi = calculateEMI(amount, interestRate, tenure)
    const totalAmount = calculateTotalAmount(amount, interestRate, tenure)

    return (
        <>
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
                <FileCheck className="mr-2 h-4 w-4" />
                Convert to Loan
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Convert to Loan Application</DialogTitle>
                        <DialogDescription>
                            Create a loan application for {clientName} based on this quotation
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                            <h4 className="font-semibold text-sm text-blue-900">Loan Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-600">Principal</p>
                                    <p className="font-semibold">₹{amount.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Interest Rate</p>
                                    <p className="font-semibold">{interestRate}% p.a.</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Tenure</p>
                                    <p className="font-semibold">{tenure} months</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Monthly EMI</p>
                                    <p className="font-semibold">₹{emi.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                                <p className="text-xs text-gray-600">Total Payable</p>
                                <p className="text-lg font-bold text-blue-900">₹{totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                            <p>This will:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Create a new loan application</li>
                                <li>Set status to "Application Submitted"</li>
                                <li>Link to this client and quotation</li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleConvert} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Converting...' : 'Create Loan Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
