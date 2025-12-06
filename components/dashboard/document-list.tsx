'use client'

import { useRouter } from 'next/navigation'
import { DocumentVerificationCard } from './document-verification-card'

interface DocumentListProps {
    documents: any[]
}

export function DocumentList({ documents }: DocumentListProps) {
    const router = useRouter()

    const handleUpdate = () => {
        router.refresh()
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No documents uploaded
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {documents.map((doc) => (
                <DocumentVerificationCard
                    key={doc.document_id}
                    doc={doc}
                    onUpdate={handleUpdate}
                />
            ))}
        </div>
    )
}
