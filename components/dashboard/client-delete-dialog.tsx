'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ClientDeleteDialogProps {
    clientId: string
    clientName: string
    hasLoans?: boolean
}

export function ClientDeleteDialog({
    clientId,
    clientName,
    hasLoans = false
}: ClientDeleteDialogProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        if (hasLoans) {
            toast.error('Cannot delete client with active loans')
            return
        }

        setLoading(true)
        try {
            // First delete any quotations
            await supabase
                .from('quotations')
                .delete()
                .eq('client_id', clientId)

            // Then delete the client
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('client_id', clientId)

            if (error) throw error

            toast.success('Client deleted successfully')
            setOpen(false)
            router.push('/dashboard/clients')
            router.refresh()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete client')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Delete Client
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {hasLoans ? (
                            <span className="text-red-600">
                                This client has active loan applications and cannot be deleted.
                                Please resolve all loans before deleting.
                            </span>
                        ) : (
                            <>
                                Are you sure you want to delete <strong>{clientName}</strong>?
                                This action cannot be undone. All associated quotations will also be deleted.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading || hasLoans}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Deleting...' : 'Delete Client'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
