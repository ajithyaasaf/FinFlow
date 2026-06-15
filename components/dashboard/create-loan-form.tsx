'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientSearchSelect } from '@/components/ui/client-search-select'
import { Loader2, Calculator, Search } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/types'
import { calculateEMI } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface CreateLoanFormProps {
    clients: Client[]
}

export function CreateLoanForm({ clients }: CreateLoanFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        client_id: '',
        amount: '',
        interest_rate: '12',
        tenure: '12',
    })

    // Calculate EMI preview
    const amount = parseFloat(formData.amount) || 0
    const rate = parseFloat(formData.interest_rate) || 0
    const tenure = parseInt(formData.tenure) || 0
    const emi = amount > 0 && rate > 0 && tenure > 0
        ? calculateEMI(amount, rate, tenure)
        : 0
    const totalAmount = emi * tenure
    const totalInterest = totalAmount - amount

    // Get selected client details
    const selectedClient = clients.find(c => c.client_id === formData.client_id)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.client_id) {
            toast.error('Please select a client')
            return
        }
        if (amount < 10000) {
            toast.error('Loan amount must be at least ₹10,000')
            return
        }
        if (amount > 10000000) {
            toast.error('Loan amount cannot exceed ₹1,00,00,000')
            return
        }
        if (rate < 1 || rate > 36) {
            toast.error('Interest rate must be between 1% and 36%')
            return
        }
        if (tenure < 1 || tenure > 360) {
            toast.error('Tenure must be between 1 and 360 months')
            return
        }

        setLoading(true)

        try {
            // Create loan application
            const { data: loan, error } = await supabase
                .from('loan_applications')
                .insert({
                    client_id: formData.client_id,
                    amount: amount,
                    interest_rate: rate,
                    tenure: tenure,
                    process_stage: 'Application Submitted',
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Loan application created successfully!')
            router.push(`/dashboard/loans/${loan.loan_id}`)
        } catch (error) {
            console.error('Create loan error:', error)
            toast.error('Failed to create loan application')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Select Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ClientSearchSelect
                        clients={clients}
                        selectedClientId={formData.client_id}
                        onSelect={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                        placeholder="Select a client"
                    />

                    {/* Selected Client Info */}
                    {selectedClient && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-800">
                                Selected: {selectedClient.full_name}
                            </p>
                            <p className="text-xs text-green-600">
                                Mobile: {selectedClient.mobile_number}
                                {selectedClient.pan_number && ` • PAN: ${selectedClient.pan_number}`}
                            </p>
                        </div>
                    )}

                    {/* Add New Client Link */}
                    <p className="text-sm text-gray-500">
                        Client not in list?{' '}
                        <Link href="/dashboard/clients/new" className="text-primary hover:underline">
                            Add new client
                        </Link>
                    </p>
                </CardContent>
            </Card>

            {/* Loan Terms */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Loan Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Loan Amount (₹) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="100000"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                min="10000"
                                max="10000000"
                                disabled={loading}
                                required
                            />
                            <p className="text-xs text-gray-500">Min ₹10,000 • Max ₹1Cr</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interest_rate">Interest Rate (% p.a.) *</Label>
                            <Input
                                id="interest_rate"
                                type="number"
                                step="0.5"
                                placeholder="12"
                                value={formData.interest_rate}
                                onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
                                min="1"
                                max="36"
                                disabled={loading}
                                required
                            />
                            <p className="text-xs text-gray-500">1% - 36% allowed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tenure">Tenure (Months) *</Label>
                            <Input
                                id="tenure"
                                type="number"
                                placeholder="12"
                                value={formData.tenure}
                                onChange={(e) => setFormData(prev => ({ ...prev, tenure: e.target.value }))}
                                min="1"
                                max="360"
                                disabled={loading}
                                required
                            />
                            <p className="text-xs text-gray-500">1 - 360 months</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* EMI Preview */}
            {emi > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            EMI Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(emi)}</p>
                                <p className="text-sm text-gray-500">Monthly EMI</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalInterest)}</p>
                                <p className="text-sm text-gray-500">Total Interest</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                                <p className="text-sm text-gray-500">Total Payable</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading} className="min-w-40">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Creating...' : 'Create Loan Application'}
                </Button>
                <Link href="/dashboard/loans">
                    <Button type="button" variant="outline" disabled={loading}>
                        Cancel
                    </Button>
                </Link>
            </div>
        </form>
    )
}
