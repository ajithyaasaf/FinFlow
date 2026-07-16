'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react'
import { StaffEditModal } from './staff-edit-modal'

interface StaffActionsProps {
    staffId: string
    staffName: string
    currentName: string
    currentMobile: string
    currentEmail: string
    currentStatus?: 'ACTIVE' | 'INACTIVE'
}

export function StaffActions({ staffId, staffName, currentName, currentMobile, currentEmail, currentStatus = 'ACTIVE' }: StaffActionsProps) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(currentStatus)
    const [toggling, setToggling] = useState(false)

    const handleToggleStatus = async (checked: boolean) => {
        const newStatus = checked ? 'ACTIVE' : 'INACTIVE'
        setToggling(true)
        const oldStatus = status
        setStatus(newStatus)

        try {
            const response = await fetch(`/api/staff/${staffId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status')
            }

            toast.success(`Staff member is now ${newStatus.toLowerCase()}`)
            router.refresh()
        } catch (error) {
            console.error('Status update error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update status')
            setStatus(oldStatus)
        } finally {
            setToggling(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)

        try {
            const response = await fetch(`/api/staff/${staffId}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user')
            }

            toast.success('User deleted successfully')
            setDeleteOpen(false)  // Close immediately
            router.refresh()      // Refresh staff list in background
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete user')
        } finally {
            setDeleting(false)
        }
    }

    const isActive = status === 'ACTIVE'

    return (
        <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
            <div className="flex items-center gap-2">
                <span className={cn(
                    "text-xs font-semibold select-none transition-colors", 
                    isActive ? "text-green-600" : "text-gray-400"
                )}>
                    {isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                    checked={isActive}
                    onCheckedChange={handleToggleStatus}
                    disabled={toggling}
                />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <StaffEditModal
                open={editOpen}
                onOpenChange={setEditOpen}
                staffId={staffId}
                currentName={currentName}
                currentMobile={currentMobile}
                currentEmail={currentEmail}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{staffName}</strong>? This action cannot be undone.
                            All their data (clients, quotations, attendance) will remain in the system but will be orphaned.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
