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
import { useEffect } from 'react'
import type { Client, BankPartner, AppUser } from '@/types'
import { calculateEMI } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { REGIONS } from '@/lib/services/loginsConstants'

interface CreateLoanFormProps {
    clients: Client[]
    partners: BankPartner[]
    allStaff: AppUser[]
}

export function CreateLoanForm({ clients, partners, allStaff }: CreateLoanFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [lenderModel, setLenderModel] = useState<'DIRECT' | 'BROKERAGE'>('DIRECT')
    const [formData, setFormData] = useState({
        client_id: '',
        pan_number: '',
        aadhaar_number: '',
        amount: '',
        interest_rate: '12',
        tenure: '12',
        bank_partner_id: '',
        product_name: '',
        login_reference_number: '',
        original_request_date: '',
        region: 'Madurai',
        assigned_tl_id: '',
        disbursement_type: 'New',
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

    useEffect(() => {
        if (selectedClient) {
            setFormData(prev => ({
                ...prev,
                pan_number: selectedClient.pan_number || '',
                aadhaar_number: selectedClient.aadhaar_number || '',
            }))
        }
    }, [selectedClient])

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
            // Create loan application payload
            const payload: any = {
                client_id: formData.client_id,
                amount: amount,
                interest_rate: rate,
                tenure: tenure,
                process_stage: 'Application Submitted',
            }

            if (lenderModel === 'BROKERAGE') {
                payload.bank_partner_id = formData.bank_partner_id || null
                payload.product_name = formData.product_name || null
                payload.login_reference_number = formData.login_reference_number || null
                payload.original_request_date = formData.original_request_date || null
            }

            // Always save region and TL
            payload.region = formData.region || 'Madurai'
            payload.assigned_tl_id = (formData.assigned_tl_id && formData.assigned_tl_id !== 'none') 
                ? formData.assigned_tl_id 
                : null

            // Update client identity fields if they were entered
            if (formData.pan_number || formData.aadhaar_number) {
                await supabase
                    .from('clients')
                    .update({
                        pan_number: formData.pan_number.toUpperCase().trim() || null,
                        aadhaar_number: formData.aadhaar_number.replace(/\D/g, '').trim() || null,
                    })
                    .eq('client_id', formData.client_id)
            }

            const { data: loan, error } = await supabase
                .from('loan_applications')
                .insert(payload)
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

                    {/* Selected Client Info & Identity Update */}
                    {selectedClient && (
                        <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {selectedClient.full_name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Mobile: {selectedClient.mobile_number}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pan_number">PAN Number</Label>
                                    <Input
                                        id="pan_number"
                                        placeholder="ABCDE1234F"
                                        value={formData.pan_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pan_number: e.target.value.toUpperCase().slice(0, 10) }))}
                                        className="uppercase bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                                    <Input
                                        id="aadhaar_number"
                                        placeholder="123456789012"
                                        value={formData.aadhaar_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Identity details entered here will automatically be updated in the client's master profile.
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

            {/* Lender Model Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Lender Model</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lender_model">Business Archetype</Label>
                            <Select
                                value={lenderModel}
                                onValueChange={(val: 'DIRECT' | 'BROKERAGE') => setLenderModel(val)}
                            >
                                <SelectTrigger id="lender_model">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DIRECT">Direct Lending (HealthyHome In-House)</SelectItem>
                                    <SelectItem value="BROKERAGE">Brokerage Submission (External Bank)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {lenderModel === 'BROKERAGE' && (
                        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 animate-in fade-in duration-200">
                            <div className="space-y-2">
                                <Label htmlFor="bank_partner_id">Select Partner Bank</Label>
                                <Select
                                    value={formData.bank_partner_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, bank_partner_id: val }))}
                                >
                                    <SelectTrigger id="bank_partner_id">
                                        <SelectValue placeholder="Select lender partner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {partners.map((p) => (
                                            <SelectItem key={p.partner_id} value={p.partner_id}>
                                                {p.bank_name} ({p.branch_name || 'Main'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="product_name">Product / Program Name</Label>
                                <Input
                                    id="product_name"
                                    placeholder="e.g. Home Loan Plus, LAP"
                                    value={formData.product_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="login_reference_number">Login Reference Number</Label>
                                <Input
                                    id="login_reference_number"
                                    placeholder="e.g. REF-2026-9043"
                                    value={formData.login_reference_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, login_reference_number: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="original_request_date">Original Request Date</Label>
                                <Input
                                    id="original_request_date"
                                    type="date"
                                    value={formData.original_request_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, original_request_date: e.target.value }))}
                                />
                            </div>

                            {/* Region */}
                            <div className="space-y-2">
                                <Label htmlFor="region">Region</Label>
                                <Select
                                    value={formData.region}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, region: val }))}
                                >
                                    <SelectTrigger id="region">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REGIONS.map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Assigned TL */}
                            <div className="space-y-2">
                                <Label htmlFor="assigned_tl_id">Assigned TL <span className="text-gray-400 font-normal">(optional)</span></Label>
                                <Select
                                    value={formData.assigned_tl_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, assigned_tl_id: val }))}
                                >
                                    <SelectTrigger id="assigned_tl_id">
                                        <SelectValue placeholder="Select TL" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {allStaff.filter(s => s.role === 'ADMIN' || s.role === 'MD' || s.is_tl).map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.full_name} ({s.role === 'STAFF' && s.is_tl ? 'TL' : s.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
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
