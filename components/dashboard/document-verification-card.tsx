'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { createNotificationAction } from '@/app/actions/server-actions'

interface DocumentCardProps {
    doc: {
        document_id: string
        document_type: string
        file_path: string
        status: string
        admin_feedback?: string
        loan_id: string
    }
    onUpdate: () => void
}

export function DocumentVerificationCard({ doc, onUpdate }: DocumentCardProps) {
    const supabase = createClient()
    const [rejectOpen, setRejectOpen] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [loading, setLoading] = useState(false)

    const handleVerify = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('loan_documents')
                .update({ status: 'VERIFIED', admin_feedback: null })
                .eq('document_id', doc.document_id)

            if (error) throw error

            toast.success('Document verified')
            onUpdate()
        } catch (error) {
            console.error('Verify error:', error)
            toast.error('Failed to verify document')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!feedback.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('loan_documents')
                .update({ status: 'REJECTED', admin_feedback: feedback })
                .eq('document_id', doc.document_id)

            if (error) throw error

            // Notify staff
            const { data: loanData } = await supabase
                .from('loan_applications')
                .select(`
                    client:clients (
                        onboarding_agent_id,
                        full_name
                    )
                `)
                .eq('loan_id', doc.loan_id)
                .single()

            if (loanData?.client) {
                const client = Array.isArray(loanData.client) ? loanData.client[0] : loanData.client

                if (client?.onboarding_agent_id) {
                    await createNotificationAction({
                        userId: client.onboarding_agent_id,
                        title: 'Document Rejected',
                        message: `Document (${doc.document_type}) for ${client.full_name} was rejected. Reason: ${feedback}`,
                        type: 'ERROR',
                        entityType: 'LOAN',
                        entityId: doc.loan_id,
                        linkUrl: `/dashboard/loans/${doc.loan_id}`,
                    })
                }
            }

            toast.success('Document rejected')
            setRejectOpen(false)
            onUpdate()
        } catch (error) {
            console.error('Reject error:', error)
            toast.error('Failed to reject document')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED': return 'bg-green-100 text-green-800'
            case 'REJECTED': return 'bg-red-100 text-red-800'
            default: return 'bg-yellow-100 text-yellow-800'
        }
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                    <Eye className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{doc.document_type}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getStatusColor(doc.status)}>
                            {doc.status}
                        </Badge>
                        {doc.status === 'REJECTED' && doc.admin_feedback && (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {doc.admin_feedback}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(supabase.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl, '_blank')}
                >
                    View
                </Button>

                {doc.status !== 'VERIFIED' && (
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleVerify}
                            disabled={loading}
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>

                        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={loading}>
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Reject Document</DialogTitle>
                                    <DialogDescription>
                                        Please specify why this document is being rejected. The staff member will be notified to re-upload.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Textarea
                                        placeholder="e.g., Image too blurry, Wrong document type..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleReject} disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Reject Document
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>
        </div>
    )
}
