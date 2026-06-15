'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { FileText, Upload, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DocumentReuploadProps {
    documents: any[]
    loanId: string
}

export function DocumentReupload({ documents, loanId }: DocumentReuploadProps) {
    const supabase = createClient()
    const router = useRouter()
    const [uploadOpen, setUploadOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<any>(null)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const handleUpload = async () => {
        if (!file || !selectedDoc) return

        setLoading(true)
        try {
            // Get current user for storage RLS prefix
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Upload file with userId prefix to satisfy RLS
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${loanId}/${selectedDoc.document_type}_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Update database
            const { error: dbError } = await supabase
                .from('loan_documents')
                .update({
                    file_path: fileName,
                    status: 'PENDING',
                    admin_feedback: null
                })
                .eq('document_id', selectedDoc.document_id)

            if (dbError) throw dbError

            toast.success('Document re-uploaded successfully')
            setUploadOpen(false)
            setFile(null)
            router.refresh()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload document')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'VERIFIED': return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'REJECTED': return <AlertCircle className="h-5 w-5 text-red-500" />
            default: return <Clock className="h-5 w-5 text-yellow-500" />
        }
    }

    return (
        <div className="space-y-4">
            {documents.map((doc) => (
                <div key={doc.document_id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg h-fit">
                                <FileText className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{doc.document_type}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusIcon(doc.status)}
                                    <span className="text-sm text-gray-600 capitalize">{doc.status.toLowerCase()}</span>
                                </div>
                            </div>
                        </div>

                        {doc.status === 'REJECTED' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setSelectedDoc(doc)
                                    setUploadOpen(true)
                                }}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Re-upload
                            </Button>
                        )}
                    </div>

                    {doc.status === 'REJECTED' && doc.admin_feedback && (
                        <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
                            <p className="text-xs font-semibold text-red-800 mb-1">Action Required:</p>
                            <p className="text-sm text-red-700">{doc.admin_feedback}</p>
                        </div>
                    )}
                </div>
            ))}

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Re-upload Document</DialogTitle>
                        <DialogDescription>
                            Upload a new version of {selectedDoc?.document_type} to address the rejection.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Select File</Label>
                            <Input
                                id="file"
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!file || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
