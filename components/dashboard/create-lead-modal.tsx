'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, UserPlus, Info, Briefcase, Home } from 'lucide-react'
import { createLeadAction } from '@/app/actions/leads'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface CreateLeadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    agents: { id: string; full_name: string; email?: string }[]
}

export function CreateLeadModal({ open, onOpenChange, agents }: CreateLeadModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'property'>('personal')
    const [formData, setFormData] = useState({
        full_name: '',
        company_name: '',
        phone_number: '',
        email: '',
        status: 'NEW',
        source: 'OTHER',
        heat_level: 'WARM',
        assigned_agent_id: '',
        constitution: '',
        industry_type: '',
        nature_of_business: '',
        property_details: '',
        ownership_type: '',
        regular_it: 'NO',
        address: '',
        city: '',
        state: '',
        zip_code: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required'
        }

        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required'
        } else if (!/^[0-9]{10}$/.test(formData.phone_number)) {
            newErrors.phone_number = 'Phone number must be 10 digits'
        }

        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            setActiveTab('personal') // Switch back to personal if validation failed
            return
        }

        setLoading(true)

        try {
            const dataToSubmit = { ...formData }
            if (!dataToSubmit.assigned_agent_id) {
                // @ts-ignore
                delete dataToSubmit.assigned_agent_id
            }

            const result = await createLeadAction(dataToSubmit as any)

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success('Lead created successfully!')
            // Close and reset immediately — refresh happens in background
            onOpenChange(false)
            setFormData({
                full_name: '',
                company_name: '',
                phone_number: '',
                email: '',
                status: 'NEW',
                source: 'OTHER',
                heat_level: 'WARM',
                assigned_agent_id: '',
                constitution: '',
                industry_type: '',
                nature_of_business: '',
                property_details: '',
                ownership_type: '',
                regular_it: 'NO',
                address: '',
                city: '',
                state: '',
                zip_code: '',
            })
            setErrors({})
            setActiveTab('personal')
            router.refresh()
        } catch (error: any) {
            console.error('Create lead error:', error)
            toast.error(error.message || 'Failed to create lead')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Create New Lead
                    </DialogTitle>
                    <DialogDescription>
                        Onboard a new inquiry and track their details before conversion.
                    </DialogDescription>
                </DialogHeader>

                {/* Custom Tabs */}
                <div className="flex border-b border-gray-200 mt-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('personal')}
                        className={`flex items-center gap-1.5 py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'personal'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Info className="h-4 w-4" />
                        Contact Info
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('business')}
                        className={`flex items-center gap-1.5 py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'business'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Briefcase className="h-4 w-4" />
                        Business Profile
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('property')}
                        className={`flex items-center gap-1.5 py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'property'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Home className="h-4 w-4" />
                        Property & Address
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tab 1: Personal & Contact */}
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input
                                    id="full_name"
                                    placeholder="e.g. Krishna Sankar"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className={errors.full_name ? 'border-red-500' : ''}
                                />
                                {errors.full_name && (
                                    <p className="text-xs text-red-500">{errors.full_name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone_number">Phone Number *</Label>
                                <Input
                                    id="phone_number"
                                    placeholder="e.g. 9876543210"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className={errors.phone_number ? 'border-red-500' : ''}
                                    maxLength={10}
                                />
                                {errors.phone_number && (
                                    <p className="text-xs text-red-500">{errors.phone_number}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g. krishna@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assigned_agent_id">Assign Staff</Label>
                        <SearchableSelect
                            options={agents.map((agent) => ({
                                value: agent.id,
                                label: agent.email ? `${agent.full_name} (${agent.email})` : agent.full_name,
                                searchString: agent.email ? `${agent.full_name} ${agent.email}` : agent.full_name
                            }))}
                            value={formData.assigned_agent_id}
                            onValueChange={(val) => setFormData({ ...formData, assigned_agent_id: val })}
                            placeholder="Select staff member"
                            searchPlaceholder="Search staff by name or email..."
                            className="h-11 rounded-xl shadow-none"
                        />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="heat_level">Heat Level</Label>
                                <Select
                                    value={formData.heat_level}
                                    onValueChange={(val) => setFormData({ ...formData, heat_level: val })}
                                >
                                    <SelectTrigger id="heat_level">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HOT">Hot 🔥</SelectItem>
                                        <SelectItem value="WARM">Warm ☀️</SelectItem>
                                        <SelectItem value="COLD">Cold ❄️</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source">Lead Source</Label>
                                <Select
                                    value={formData.source}
                                    onValueChange={(val) => setFormData({ ...formData, source: val })}
                                >
                                    <SelectTrigger id="source">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DIGITAL_MARKETING">Digital Marketing</SelectItem>
                                        <SelectItem value="COLD_CALLING">Cold Calling</SelectItem>
                                        <SelectItem value="REFERRAL">Referral</SelectItem>
                                        <SelectItem value="WALK_IN">Walk In</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Business details */}
                    {activeTab === 'business' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company / Shop Name</Label>
                                <Input
                                    id="company_name"
                                    placeholder="e.g. Senthil Grocery Stores"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="constitution">Constitution</Label>
                                <Select
                                    value={formData.constitution}
                                    onValueChange={(val) => setFormData({ ...formData, constitution: val })}
                                >
                                    <SelectTrigger id="constitution">
                                        <SelectValue placeholder="Select constitution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                                        <SelectItem value="Partnership">Partnership</SelectItem>
                                        <SelectItem value="Private Limited">Private Limited</SelectItem>
                                        <SelectItem value="Individual">Individual / Salaried</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="industry_type">Industry Type</Label>
                                <Input
                                    id="industry_type"
                                    placeholder="e.g. Retail, Manufacturing"
                                    value={formData.industry_type}
                                    onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nature_of_business">Nature of Business</Label>
                                <Input
                                    id="nature_of_business"
                                    placeholder="e.g. FMCG Retail Sales"
                                    value={formData.nature_of_business}
                                    onChange={(e) => setFormData({ ...formData, nature_of_business: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="regular_it">Regular IT Assessee?</Label>
                                <Select
                                    value={formData.regular_it}
                                    onValueChange={(val) => setFormData({ ...formData, regular_it: val })}
                                >
                                    <SelectTrigger id="regular_it">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="YES">Yes</SelectItem>
                                        <SelectItem value="NO">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Property & Address */}
                    {activeTab === 'property' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ownership_type">Ownership Type</Label>
                                    <Select
                                        value={formData.ownership_type}
                                        onValueChange={(val) => setFormData({ ...formData, ownership_type: val })}
                                    >
                                        <SelectTrigger id="ownership_type">
                                            <SelectValue placeholder="Select ownership" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Owned">Owned</SelectItem>
                                            <SelectItem value="Rented">Rented</SelectItem>
                                            <SelectItem value="Leased">Leased</SelectItem>
                                            <SelectItem value="Family Owned">Family Owned</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="property_details">Property Details / Survey No.</Label>
                                    <Input
                                        id="property_details"
                                        placeholder="e.g. Plot 43-A, Survey 102/3"
                                        value={formData.property_details}
                                        onChange={(e) => setFormData({ ...formData, property_details: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea
                                    id="address"
                                    placeholder="Enter street, locality, house details"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="e.g. Chennai"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        placeholder="e.g. Tamil Nadu"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="zip_code">ZIP / Postal Code</Label>
                                    <Input
                                        id="zip_code"
                                        placeholder="e.g. 600001"
                                        value={formData.zip_code}
                                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                        {activeTab !== 'personal' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab(activeTab === 'property' ? 'business' : 'personal')}
                            >
                                Back
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        {activeTab !== 'property' ? (
                            <Button
                                type="button"
                                onClick={() => setActiveTab(activeTab === 'personal' ? 'business' : 'property')}
                            >
                                Next Step
                            </Button>
                        ) : (
                            <Button type="submit" disabled={loading} className="px-6">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Creating...' : 'Save Lead'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
