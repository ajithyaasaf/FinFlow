'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { uploadKYC } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload, FileText, X } from 'lucide-react'
import type { Client } from '@/types'

interface KYCUploadProps {
    onFileSelect: (file: File | null) => void
    disabled?: boolean
}

export function KYCUpload({ onFileSelect, disabled }: KYCUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (!file) {
            setSelectedFile(null)
            setPreviewUrl(null)
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
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            setPreviewUrl(null)
        }
    }

    const handleRemove = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        onFileSelect(null)
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="kyc">KYC Document (Optional)</Label>

            {!selectedFile ? (
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
                        <span className="text-sm text-gray-600">
                            Click to upload Aadhaar/PAN
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                            PDF, JPEG, or PNG (Max 5MB)
                        </span>
                    </label>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="KYC Preview"
                                    className="w-16 h-16 object-cover rounded"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleRemove}
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

interface ClientFormProps {
    onSuccess?: (client: Client) => void
}

export function ClientForm({ onSuccess }: ClientFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        mobile_number: '',
    })
    const [kycFile, setKycFile] = useState<File | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate form data
            if (!formData.full_name.trim()) {
                throw new Error('Please enter client name')
            }

            if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
                throw new Error('Please enter a valid 10-digit mobile number')
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Upload KYC if provided
            let kycUrl = null
            if (kycFile) {
                toast.loading('Uploading KYC document...', { id: 'kyc-upload' })
                kycUrl = await uploadKYC(kycFile)
                toast.dismiss('kyc-upload')
            }

            // Insert client into database
            const { data: client, error } = await supabase
                .from('clients')
                .insert({
                    full_name: formData.full_name.trim(),
                    mobile_number: formData.mobile_number.trim(),
                    kyc_document_url: kycUrl,
                    onboarding_agent_id: user.id,
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Client added successfully!')

            // Reset form
            setFormData({ full_name: '', mobile_number: '' })
            setKycFile(null)

            // Call success callback or refresh
            if (onSuccess) {
                onSuccess(client)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error('Client creation error:', error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Failed to add client')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                    id="full_name"
                    type="text"
                    placeholder="Enter client's full name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
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
                        setFormData(prev => ({ ...prev, mobile_number: value }))
                    }}
                    disabled={loading}
                    required
                />
                <p className="text-xs text-gray-500">Enter 10-digit mobile number</p>
            </div>

            <KYCUpload
                onFileSelect={setKycFile}
                disabled={loading}
            />

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Adding Client...' : 'Add Client'}
            </Button>
        </form>
    )
}
