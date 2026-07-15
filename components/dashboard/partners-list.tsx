'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building, Phone, Plus, Edit, Trash, Loader2 } from 'lucide-react'
import type { BankPartner } from '@/types'
import { createBankPartnerAction, updateBankPartnerAction, deleteBankPartnerAction } from '@/app/actions/partners'

interface PartnersListProps {
    initialPartners: BankPartner[]
}

export function PartnersList({ initialPartners }: PartnersListProps) {
    const [partners, setPartners] = useState<BankPartner[]>(initialPartners)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPartner, setSelectedPartner] = useState<BankPartner | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteConfirmPartnerId, setDeleteConfirmPartnerId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        bank_name: '',
        branch_name: '',
        manager_name: '',
        manager_phone: ''
    })

    const handleOpenCreate = () => {
        setSelectedPartner(null)
        setFormData({
            bank_name: '',
            branch_name: '',
            manager_name: '',
            manager_phone: ''
        })
        setModalOpen(true)
    }

    const handleOpenEdit = (partner: BankPartner) => {
        setSelectedPartner(partner)
        setFormData({
            bank_name: partner.bank_name,
            branch_name: partner.branch_name || '',
            manager_name: partner.manager_name || '',
            manager_phone: partner.manager_phone || ''
        })
        setModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.bank_name.trim()) {
            toast.error('Bank Name is required')
            return
        }

        setLoading(true)
        try {
            if (selectedPartner) {
                const result = await updateBankPartnerAction(selectedPartner.partner_id, formData)
                if (!result.success) throw new Error(result.error)
                // Optimistic update: patch the changed partner in local state
                setPartners(prev => prev.map(p =>
                    p.partner_id === selectedPartner.partner_id
                        ? { ...p, ...formData, updated_at: new Date().toISOString() }
                        : p
                ))
                toast.success('Bank partner updated successfully!')
            } else {
                const result = await createBankPartnerAction(formData)
                if (!result.success) throw new Error(result.error)
                // Optimistic update: append new partner returned by server
                if (result.partner) setPartners(prev => [result.partner as BankPartner, ...prev])
                toast.success('Bank partner added successfully!')
            }
            setModalOpen(false)
        } catch (error: any) {
            toast.error(error.message || 'Failed to save partner')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (partnerId: string) => {
        // Optimistic remove: filter out instantly, restore on failure
        const previousPartners = partners
        setPartners(prev => prev.filter(p => p.partner_id !== partnerId))
        try {
            const result = await deleteBankPartnerAction(partnerId)
            if (!result.success) throw new Error(result.error)
            toast.success('Bank partner deleted successfully!')
        } catch (error: any) {
            setPartners(previousPartners) // Rollback
            toast.error(error.message || 'Failed to delete partner')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleOpenCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bank Partner
                </Button>
            </div>

            <Card className="border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Bank / NBFC Name</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Manager Name</TableHead>
                            <TableHead>Manager Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partners.map((partner) => (
                            <TableRow key={partner.partner_id}>
                                <TableCell className="font-semibold flex items-center gap-2">
                                    <Building className="h-4 w-4 text-primary" />
                                    {partner.bank_name}
                                </TableCell>
                                <TableCell>{partner.branch_name || 'N/A'}</TableCell>
                                <TableCell>{partner.manager_name || 'N/A'}</TableCell>
                                <TableCell className="font-mono text-xs">
                                    {partner.manager_phone ? (
                                        <a href={`tel:${partner.manager_phone}`} className="flex items-center gap-1 hover:underline text-primary">
                                            <Phone className="h-3 w-3" />
                                            {partner.manager_phone}
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenEdit(partner)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteConfirmPartnerId(partner.partner_id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {partners.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                                    No external bank partners registered yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedPartner ? 'Edit Bank Partner' : 'Add New Bank Partner'}
                        </DialogTitle>
                        <DialogDescription>
                            Enter details for external bank / financial institution partner relationship.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Bank / NBFC Name *</Label>
                            <Input
                                id="bank_name"
                                placeholder="e.g. HDFC Bank Ltd"
                                value={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch_name">Branch Name</Label>
                            <Input
                                id="branch_name"
                                placeholder="e.g. KK Nagar Branch"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="manager_name">Bank Manager Name</Label>
                            <Input
                                id="manager_name"
                                placeholder="e.g. Rajesh Kumar"
                                value={formData.manager_name}
                                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="manager_phone">Manager Contact Phone</Label>
                            <Input
                                id="manager_phone"
                                placeholder="e.g. 9876543210"
                                value={formData.manager_phone}
                                onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                                maxLength={10}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Saving...' : 'Save Partner'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Partner Confirmation Dialog */}
            <Dialog open={!!deleteConfirmPartnerId} onOpenChange={(open) => !open && setDeleteConfirmPartnerId(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600">Delete Bank Partner?</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to remove this partner bank? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleteConfirmPartnerId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                if (deleteConfirmPartnerId) {
                                    const id = deleteConfirmPartnerId
                                    setDeleteConfirmPartnerId(null)
                                    await handleDelete(id)
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
