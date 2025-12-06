'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/client'
import { uploadQuotationPDF } from '@/lib/storage'
import { isHighValueQuotation, calculateEMI, calculateTotalAmount, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calculator, Download, ArrowLeft, AlertTriangle } from 'lucide-react'
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
            const pdfUrl = await uploadQuotationPDF(blob, quotation.quote_id)

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/agent">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Quotation Calculator</h1>
                        <p className="text-xs text-gray-600">Generate instant loan quotes</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 pb-24 space-y-4">
                {/* Client Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Client *</Label>
                            {clients.length === 0 ? (
                                <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md">
                                    No clients found. <Link href="/agent/clients" className="text-primary underline">Add a client first</Link>
                                </div>
                            ) : (
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger>
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
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Loan Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Loan Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Loan Amount (₹) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="10000"
                                max="10000000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rate">Interest Rate (% per annum) *</Label>
                            <Input
                                id="rate"
                                type="number"
                                placeholder="Enter rate"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                min="1"
                                max="36"
                                step="0.1"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tenure">Tenure (months) *</Label>
                            <Input
                                id="tenure"
                                type="number"
                                placeholder="Enter tenure"
                                value={tenure}
                                onChange={(e) => setTenure(e.target.value)}
                                min="1"
                                max="360"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* EMI Calculation Result */}
                {emi > 0 && (
                    <Card className={highValue ? 'border-orange-300' : ''}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>Calculation Result</span>
                                {highValue && (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        High Value
                                    </Badge>
                                )}
                            </CardTitle>
                            {highValue && (
                                <CardDescription className="text-orange-600">
                                    This quotation requires admin approval (Amount ≥ ₹10 Lakhs)
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Monthly EMI</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(emi)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600">Principal</p>
                                    <p className="text-sm font-semibold">{formatCurrency(parseFloat(amount))}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-xs text-gray-600">Total Interest</p>
                                    <p className="text-sm font-semibold">{formatCurrency(totalAmount - parseFloat(amount))}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded">
                                <p className="text-xs text-gray-600">Total Payable</p>
                                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Generate Button */}
                <Button
                    onClick={handleGeneratePDF}
                    className="w-full"
                    size="lg"
                    disabled={!selectedClientId || !amount || !interestRate || !tenure || generating}
                >
                    {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {generating ? 'Generating PDF...' : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Generate & Download PDF
                        </>
                    )}
                </Button>
            </main>
        </div>
    )
}
