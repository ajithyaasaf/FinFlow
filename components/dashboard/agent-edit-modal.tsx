'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Edit } from 'lucide-react'

interface AgentEditModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    agentId: string
    currentName: string
    currentMobile: string
}

export function AgentEditModal({ open, onOpenChange, agentId, currentName, currentMobile }: AgentEditModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: currentName,
        mobile_number: currentMobile,
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required'
        }

        if (!formData.mobile_number.trim()) {
            newErrors.mobile_number = 'Mobile number is required'
        } else if (!/^[0-9]{10}$/.test(formData.mobile_number)) {
            newErrors.mobile_number = 'Mobile number must be 10 digits'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update agent')
            }

            toast.success('Agent updated successfully!')
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            console.error('Update agent error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update agent')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Agent Details
                    </DialogTitle>
                    <DialogDescription>
                        Update agent information. Email cannot be changed.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className={errors.full_name ? 'border-red-500' : ''}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-500">{errors.full_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mobile_number">Mobile Number *</Label>
                            <Input
                                id="mobile_number"
                                value={formData.mobile_number}
                                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                className={errors.mobile_number ? 'border-red-500' : ''}
                                maxLength={10}
                            />
                            {errors.mobile_number && (
                                <p className="text-sm text-red-500">{errors.mobile_number}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
