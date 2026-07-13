'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'

interface StaffCreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function StaffCreateModal({ open, onOpenChange }: StaffCreateModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
    const [formData, setFormData] = useState({
        full_name: '',
        login_id: '',
        mobile_number: '',
        password: '',
        role: 'STAFF',
    })

    useEffect(() => {
        if (!open) return
        async function fetchCurrentUserRole() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data } = await supabase
                        .from('app_users')
                        .select('role')
                        .eq('id', user.id)
                        .single()
                    if (data) {
                        setCurrentUserRole(data.role as UserRole)
                        if (data.role === 'ADMIN') {
                            setFormData(prev => ({ ...prev, role: 'STAFF' }))
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching current user role:', error)
            }
        }
        fetchCurrentUserRole()
    }, [open])

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required'
        }

        if (!formData.login_id.trim()) {
            newErrors.login_id = 'Login ID is required'
        } else if (/\s/.test(formData.login_id)) {
            newErrors.login_id = 'Login ID cannot contain spaces'
        }

        if (!formData.mobile_number.trim()) {
            newErrors.mobile_number = 'Mobile number is required'
        } else if (!/^[0-9]{10}$/.test(formData.mobile_number)) {
            newErrors.mobile_number = 'Mobile number must be 10 digits'
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
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
            // Construct email from login ID
            const email = formData.login_id.includes('@')
                ? formData.login_id
                : `${formData.login_id.trim()}@finflow.com`

            const response = await fetch('/api/staff/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    email,
                    mobile_number: formData.mobile_number,
                    password: formData.password,
                    role: formData.role,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user')
            }

            toast.success(`${formData.role} created successfully!`)
            // Close and reset form immediately — list refresh happens in background
            onOpenChange(false)
            setFormData({ full_name: '', login_id: '', mobile_number: '', password: '', role: 'STAFF' })
            setErrors({})
            router.refresh()
        } catch (error) {
            console.error('Create user error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Create New User
                    </DialogTitle>
                    <DialogDescription>
                        Create a user profile. A simple Login ID (e.g. staff01) is enough to log in.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className={errors.full_name ? 'border-red-500' : ''}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-500">{errors.full_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="login_id">Login ID / Email *</Label>
                            <Input
                                id="login_id"
                                placeholder="e.g. staff01 or name@email.com"
                                value={formData.login_id}
                                onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
                                className={errors.login_id ? 'border-red-500' : ''}
                            />
                            {errors.login_id && (
                                <p className="text-sm text-red-500">{errors.login_id}</p>
                            )}
                            <p className="text-[11px] text-gray-400">
                                Enter a simple ID (like staff01) or their actual email address to act as their login credentials.
                            </p>
                        </div>

                        {currentUserRole === 'MD' ? (
                            <div className="space-y-2">
                                <Label htmlFor="role">User Role *</Label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MD">Managing Director (MD)</option>
                                </select>
                            </div>
                        ) : (
                            currentUserRole === 'ADMIN' && (
                                <div className="space-y-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                                    <Label className="text-gray-500 text-xs">Role Assigned</Label>
                                    <p className="text-sm font-semibold text-gray-800">Staff</p>
                                    <p className="text-[11px] text-gray-400">Admins are only allowed to create Staff accounts.</p>
                                </div>
                            )
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="mobile_number">Mobile Number *</Label>
                            <Input
                                id="mobile_number"
                                placeholder="9876543210"
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
                            <Label htmlFor="password">Temporary Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                The user can change this after first login
                            </p>
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
                            {loading ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
