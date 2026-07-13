'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Edit } from 'lucide-react'

interface StaffEditModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staffId: string
    currentName: string
    currentMobile: string
    currentEmail: string
}

export function StaffEditModal({ open, onOpenChange, staffId, currentName, currentMobile, currentEmail }: StaffEditModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: currentName,
        mobile_number: currentMobile,
        email: currentEmail,
        password: '',
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

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
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
            // Only send password if it is set
            const payload: any = {
                full_name: formData.full_name,
                mobile_number: formData.mobile_number,
                email: formData.email,
            }
            if (formData.password) {
                payload.password = formData.password
            }

            const response = await fetch(`/api/staff/${staffId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user')
            }

            toast.success('User updated successfully!')
            onOpenChange(false)   // Close immediately
            
            // Reset password field
            setFormData(prev => ({ ...prev, password: '' }))
            router.refresh()      // Refresh list in background
        } catch (error) {
            console.error('Update user error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update user')
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
                        Edit User Details
                    </DialogTitle>
                    <DialogDescription>
                        Update user information, Login ID (Email), and Password.
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

                        <div className="space-y-2">
                            <Label htmlFor="email">Login ID / Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password}</p>
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
