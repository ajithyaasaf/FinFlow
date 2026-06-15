'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/client'
import { uploadQuotationPDF } from '@/lib/storage'
import { isHighValueQuotation, calculateEMI, calculateTotalAmount, formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/agent/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calculator, Download, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { QuotationPDF } from '@/lib/pdf/quotation-template'
import type { Client } from '@/types'

export default function QuotationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [interestRate, setInterestRate] = useState<string>('')
    const [tenure, setTenure] = useState<string>('')
    const [emi, setEmi] = useState<number>(0)
    const [totalAmount, setTotalAmount] = useState<number>(0)
    const [highValue, setHighValue] = useState<boolean>(false)

    // Load clients on mount
    useEffect(() => {
        loadClients()
    }, [])

    // Pre-select client from URL parameter
    useEffect(() => {
        const clientId = searchParams.get('client')
        if (clientId && clients.length > 0) {
            setSelectedClientId(clientId)
        }
    }, [searchParams, clients])

    // Calculate EMI and total when values change
    useEffect(() => {
        const amountNum = parseFloat(amount)
        const rateNum = parseFloat(interestRate)
        const tenureNum = parseInt(tenure)

        if (amountNum > 0 && rateNum > 0 && tenureNum > 0) {
            const calculatedEmi = calculateEMI(amountNum, rateNum, tenureNum)
            const total = calculateTotalAmount(amountNum, rateNum, tenureNum)

            setEmi(calculatedEmi)
            setTotalAmount(total)
            setHighValue(isHighValueQuotation(amountNum, rateNum))
        } else {
            setEmi(0)
            setTotalAmount(0)
            setHighValue(false)
        }
    }, [amount, interestRate, tenure])

    const loadClients = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('onboarding_agent_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setClients(data || [])
        } catch (error) {
            console.error('Error loading clients:', error)
            toast.error('Failed to load clients')
        }
    }

    const handleGeneratePDF = async () => {
        if (!selectedClientId || !amount || !interestRate || !tenure) {
            toast.error('Please fill all fields')
            return
        }

        setGenerating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const selectedClient = clients.find(c => c.client_id === selectedClientId)
            if (!selectedClient) throw new Error('Client not found')

            const amountNum = parseFloat(amount)
            const rateNum = parseFloat(interestRate)
            const tenureNum = parseInt(tenure)

            // Insert quotation into database first
            const { data: quotation, error: quotationError } = await supabase
                .from('quotations')
                .insert({
                    client_id: selectedClientId,
                    amount: amountNum,
                    interest_rate: rateNum,
                    tenure: tenureNum,
                    final_amount: totalAmount,
                    is_high_value: highValue,
                    created_by: user.id,
                })
                .select()
                .single()

            if (quotationError) throw quotationError

            // Generate PDF
            toast.loading('Generating PDF...', { id: 'pdf-gen' })

            const quoteNumber = `QT-${quotation.quote_id.slice(0, 8).toUpperCase()}`

            const pdfDoc = <QuotationPDF
                quotation={{
                    amount: amountNum,
                    interest_rate: rateNum,
                    tenure: tenureNum,
                    final_amount: totalAmount,
                    is_high_value: highValue,
                    created_at: quotation.created_at,
                }}
                client={{
                    full_name: selectedClient.full_name,
                    mobile_number: selectedClient.mobile_number,
                }}
                quoteNumber={quoteNumber}
            />

            const blob = await pdf(pdfDoc).toBlob()

            // Upload PDF to storage
            const pdfUrl = await uploadQuotationPDF(blob, quotation.quote_id, user.id)

            // Update quotation with PDF URL
            await supabase
                .from('quotations')
                .update({ pdf_document_url: pdfUrl })
                .eq('quote_id', quotation.quote_id)

            toast.dismiss('pdf-gen')
            toast.success('Quotation generated successfully!')

            // Download PDF
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${quoteNumber}-${selectedClient.full_name}.pdf`
            link.click()
            URL.revokeObjectURL(url)

            // Reset form
            setAmount('')
            setInterestRate('')
            setTenure('')
            setSelectedClientId('')

        } catch (error) {
            console.error('PDF generation error:', error)
            toast.error('Failed to generate quotation')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Quotation Calculator"
                subtitle="Generate instant loan quotes"
                backHref="/agent"
            />

            {/* Main Content */}
            <main className="p-4 pb-24 space-y-4">
                {/* Client Selection */}
                <Card className="border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="text-base text-gray-900">Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Select Client *</Label>
                            {clients.length === 0 ? (
                                <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    No clients found. <Link href="/agent/clients/new" className="text-blue-600 underline font-semibold">Add a client first</Link>
                                </div>
                            ) : (
                                <>
                                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Choose a client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.client_id} value={client.client_id}>
                                                    {client.full_name} - {client.mobile_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-600 mt-2">
                                        Client not in list? <Link href="/agent/clients/new?return=/agent/quotation" className="text-blue-600 underline font-semibold">Add new client</Link>
                                    </p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Loan Details */}
                <Card className="border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                            <Calculator className="h-5 w-5" />
                            Loan Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-gray-700 font-medium">Loan Amount (₹) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="10000"
                                max="10000000"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rate" className="text-gray-700 font-medium">Interest Rate (% per annum) *</Label>
                            <Input
                                id="rate"
                                type="number"
                                placeholder="Enter rate"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                min="1"
                                max="36"
                                step="0.1"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tenure" className="text-gray-700 font-medium">Tenure (months) *</Label>
                            <Input
                                id="tenure"
                                type="number"
                                placeholder="Enter tenure"
                                value={tenure}
                                onChange={(e) => setTenure(e.target.value)}
                                min="1"
                                max="360"
                                className="h-11"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* EMI Calculation Result */}
                {emi > 0 && (
                    <Card className={`border-2 ${highValue ? 'border-orange-500' : 'border-blue-500'}`}>
                        <CardHeader className={`${highValue ? 'bg-orange-50 border-b border-orange-200' : 'bg-blue-50 border-b border-blue-200'}`}>
                            <CardTitle className="text-base flex items-center justify-between text-gray-900">
                                <span>Calculation Result</span>
                                {highValue && (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        High Value
                                    </Badge>
                                )}
                            </CardTitle>
                            {highValue && (
                                <CardDescription className="text-orange-700 font-medium">
                                    This quotation requires admin approval (Amount ≥ ₹10 Lakhs)
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                            <div className={`p-4 rounded-lg ${highValue ? 'bg-orange-100 border border-orange-300' : 'bg-blue-100 border border-blue-300'}`}>
                                <p className={`text-sm mb-1 font-medium ${highValue ? 'text-orange-900' : 'text-blue-900'}`}>Monthly EMI</p>
                                <p className={`text-3xl font-bold ${highValue ? 'text-orange-600' : 'text-blue-600'}`}>{formatCurrency(emi)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 font-medium">Principal</p>
                                    <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(parseFloat(amount))}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 font-medium">Total Interest</p>
                                    <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(totalAmount - parseFloat(amount))}</p>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1 font-medium">Total Payable</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Generate Button */}
                <Button
                    onClick={handleGeneratePDF}
                    className="w-full h-12"
                    size="lg"
                    disabled={!selectedClientId || !amount || !interestRate || !tenure || generating}
                >
                    {generating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {generating ? 'Generating PDF...' : (
                        <>
                            <Download className="mr-2 h-5 w-5" />
                            Generate & Download PDF
                        </>
                    )}
                </Button>
            </main>
        </div>
    )
}
