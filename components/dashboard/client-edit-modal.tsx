'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface ClientEditModalProps {
    client: any
}

export function ClientEditModal({ client }: ClientEditModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [agents, setAgents] = useState<any[]>([])
    const [userRole, setUserRole] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        full_name: client.full_name || '',
        mobile_number: client.mobile_number || '',
        pan_number: client.pan_number || '',
        onboarding_agent_id: client.onboarding_agent_id || '',
    })

    useEffect(() => {
        if (!open) return
        async function fetchData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase.from('app_users').select('role').eq('id', user.id).single()
                    if (profile) setUserRole(profile.role)
                }

                const { data } = await supabase
                    .from('app_users')
                    .select('id, full_name, email')
                    .eq('role', 'STAFF')
                    .order('full_name')
                if (data) setAgents(data)
            } catch (err) {
                console.error('Failed to fetch data:', err)
            }
        }
        fetchData()
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.full_name.trim()) {
            toast.error('Client name is required')
            return
        }
        if (!/^[6-9]\d{9}$/.test(formData.mobile_number.trim())) {
            toast.error('Please enter a valid 10-digit Indian mobile number')
            return
        }
        if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.toUpperCase().trim())) {
            toast.error('Please enter a valid PAN number (e.g. ABCDE1234F)')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    full_name: formData.full_name.trim(),
                    mobile_number: formData.mobile_number.trim(),
                    pan_number: formData.pan_number.toUpperCase().trim() || null,
                    ...( (userRole === 'MD' || userRole === 'ADMIN') ? { onboarding_agent_id: formData.onboarding_agent_id || null } : {} )
                })
                .eq('client_id', client.client_id)

            if (error) throw error

            toast.success('Client updated successfully')
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Update client error:', error)
            toast.error('Failed to update client. Please make sure the PAN column is added in Supabase.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Client</DialogTitle>
                    <DialogDescription>
                        Update client personal information.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile_number">Mobile Number *</Label>
                        <Input
                            id="mobile_number"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number</Label>
                        <Input
                            id="pan"
                            placeholder="ABCDE1234F"
                            value={formData.pan_number}
                            onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                        />
                    </div>

                    {(userRole === 'MD' || userRole === 'ADMIN') && (
                        <div className="space-y-2">
                            <Label htmlFor="agent">Onboarding Staff <span className="text-gray-400 font-normal">(Admin Override)</span></Label>
                            <SearchableSelect
                                options={agents.map((agent) => ({
                                    value: agent.id,
                                    label: agent.email ? `${agent.full_name} (${agent.email})` : agent.full_name,
                                    searchString: agent.email ? `${agent.full_name} ${agent.email}` : agent.full_name
                                }))}
                                value={formData.onboarding_agent_id}
                                onValueChange={(val) => setFormData({ ...formData, onboarding_agent_id: val })}
                                placeholder="Select a staff member"
                                searchPlaceholder="Search staff by name or email..."
                                className="h-10 rounded-xl"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
