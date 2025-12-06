'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { uploadKYC } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, FileText, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Client, AppUser } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface ClientFormData {
    full_name: string
    mobile_number: string
    email: string
    pan_number: string
    aadhaar_number: string
    address: string
    onboarding_agent_id: string
}

interface AdminClientFormProps {
    mode: 'create' | 'edit'
    initialData?: Partial<Client>
    agents?: AppUser[]
    onSuccess?: (client: Client) => void
    onCancel?: () => void
}

// ============================================================================
// KYC UPLOAD COMPONENT
// ============================================================================

function KYCUploadField({
    onFileSelect,
    disabled,
    existingUrl
}: {
    onFileSelect: (file: File | null) => void
    disabled?: boolean
    existingUrl?: string | null
}) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (!file) {
            setSelectedFile(null)
            setPreviewUrl(existingUrl || null)
            onFileSelect(null)
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if (!validTypes.includes(file.type)) {
            toast.error('File must be PDF, JPEG, or PNG')
            return
        }

        setSelectedFile(file)
        onFileSelect(file)

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => setPreviewUrl(e.target?.result as string)
            reader.readAsDataURL(file)
        } else {
            setPreviewUrl(null)
        }
    }

    const handleRemove = () => {
        setSelectedFile(null)
        setPreviewUrl(existingUrl || null)
        onFileSelect(null)
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="kyc">KYC Document {existingUrl ? '(Update)' : '(Optional)'}</Label>

            {!selectedFile && !existingUrl ? (
                <div className="relative">
                    <input
                        id="kyc"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        disabled={disabled}
                        className="hidden"
                    />
                    <label
                        htmlFor="kyc"
                        className={`
                            flex flex-col items-center justify-center
                            border-2 border-dashed border-gray-300 rounded-lg
                            p-6 cursor-pointer hover:border-primary transition-colors
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload Aadhaar/PAN</span>
                        <span className="text-xs text-gray-400 mt-1">PDF, JPEG, or PNG (Max 5MB)</span>
                    </label>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {previewUrl && previewUrl.startsWith('data:image') ? (
                                <img src={previewUrl} alt="KYC Preview" className="w-16 h-16 object-cover rounded" />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {selectedFile?.name || 'Existing Document'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {selectedFile
                                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                        : 'Click to replace'
                                    }
                                </p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={handleRemove} disabled={disabled}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// ============================================================================
// MAIN FORM COMPONENT
// ============================================================================

export function AdminClientForm({
    mode,
    initialData,
    agents = [],
    onSuccess,
    onCancel
}: AdminClientFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ClientFormData>({
        full_name: initialData?.full_name || '',
        mobile_number: initialData?.mobile_number || '',
        email: '',
        pan_number: initialData?.pan_number || '',
        aadhaar_number: '',
        address: '',
        onboarding_agent_id: initialData?.onboarding_agent_id || '',
    })
    const [kycFile, setKycFile] = useState<File | null>(null)
    const [availableAgents, setAvailableAgents] = useState<AppUser[]>(agents)

    // Fetch agents if not provided
    useEffect(() => {
        if (agents.length === 0) {
            fetchAgents()
        }
    }, [])

    const fetchAgents = async () => {
        const { data } = await supabase
            .from('app_users')
            .select('id, full_name, email')
            .eq('role', 'AGENT')
            .order('full_name')

        if (data) setAvailableAgents(data as AppUser[])
    }

    // Form field update handler
    const updateField = (field: keyof ClientFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Validation
    const validateForm = (): string | null => {
        if (!formData.full_name.trim()) {
            return 'Please enter client name'
        }
        if (formData.full_name.length < 2) {
            return 'Name must be at least 2 characters'
        }
        if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
            return 'Please enter a valid 10-digit Indian mobile number'
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            return 'Please enter a valid email address'
        }
        if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.toUpperCase())) {
            return 'Please enter a valid PAN number (e.g., ABCDE1234F)'
        }
        if (formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number)) {
            return 'Please enter a valid 12-digit Aadhaar number'
        }
        if (mode === 'create' && !formData.onboarding_agent_id) {
            return 'Please select an onboarding agent'
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const validationError = validateForm()
        if (validationError) {
            toast.error(validationError)
            return
        }

        setLoading(true)

        try {
            // Upload KYC if provided
            let kycUrl = initialData?.kyc_document_url || null
            if (kycFile) {
                toast.loading('Uploading KYC document...', { id: 'kyc-upload' })
                kycUrl = await uploadKYC(kycFile)
                toast.dismiss('kyc-upload')
            }

            // Prepare data
            const clientData = {
                full_name: formData.full_name.trim(),
                mobile_number: formData.mobile_number.trim(),
                pan_number: formData.pan_number.toUpperCase().trim() || null,
                kyc_document_url: kycUrl,
                onboarding_agent_id: formData.onboarding_agent_id || initialData?.onboarding_agent_id,
            }

            let client: Client

            if (mode === 'create') {
                const { data, error } = await supabase
                    .from('clients')
                    .insert(clientData)
                    .select()
                    .single()

                if (error) throw error
                client = data
                toast.success('Client created successfully!')
            } else {
                const { data, error } = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('client_id', initialData?.client_id)
                    .select()
                    .single()

                if (error) throw error
                client = data
                toast.success('Client updated successfully!')
            }

            if (onSuccess) {
                onSuccess(client)
            } else {
                router.push('/dashboard/clients')
                router.refresh()
            }
        } catch (error) {
            console.error('Client save error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save client')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                placeholder="Enter client's full name"
                                value={formData.full_name}
                                onChange={(e) => updateField('full_name', e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mobile_number">Mobile Number *</Label>
                            <Input
                                id="mobile_number"
                                type="tel"
                                placeholder="98XXXXXXXX"
                                value={formData.mobile_number}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                    updateField('mobile_number', value)
                                }}
                                disabled={loading}
                                required
                            />
                            <p className="text-xs text-gray-500">10-digit Indian mobile number</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="client@example.com"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="Enter address"
                                value={formData.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Identity Documents */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Identity Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pan_number">PAN Number</Label>
                            <Input
                                id="pan_number"
                                placeholder="ABCDE1234F"
                                value={formData.pan_number}
                                onChange={(e) => updateField('pan_number', e.target.value.toUpperCase().slice(0, 10))}
                                disabled={loading}
                                className="uppercase"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                            <Input
                                id="aadhaar_number"
                                placeholder="XXXX XXXX XXXX"
                                value={formData.aadhaar_number}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                                    updateField('aadhaar_number', value)
                                }}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <KYCUploadField
                        onFileSelect={setKycFile}
                        disabled={loading}
                        existingUrl={initialData?.kyc_document_url}
                    />
                </CardContent>
            </Card>

            {/* Agent Assignment */}
            {(mode === 'create' || availableAgents.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Agent Assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="agent">Onboarding Agent *</Label>
                            <Select
                                value={formData.onboarding_agent_id}
                                onValueChange={(value) => updateField('onboarding_agent_id', value)}
                                disabled={loading || mode === 'edit'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAgents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {mode === 'edit' && (
                                <p className="text-xs text-gray-500">Agent cannot be changed after creation</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading} className="min-w-32">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading
                        ? (mode === 'create' ? 'Creating...' : 'Saving...')
                        : (mode === 'create' ? 'Create Client' : 'Save Changes')
                    }
                </Button>

                {onCancel ? (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                ) : (
                    <Link href="/dashboard/clients">
                        <Button type="button" variant="outline" disabled={loading}>
                            Cancel
                        </Button>
                    </Link>
                )}
            </div>
        </form>
    )
}
