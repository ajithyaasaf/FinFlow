'use client'

import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/agent/page-header'
import { ClientForm } from '@/components/agent/client-form'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

function NewClientPageContent() {
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('return') || '/agent/clients'

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Add New Client"
                subtitle="Enter client details"
                backHref={returnUrl}
            />

            <main className="p-4 pb-24">
                <ClientForm returnUrl={returnUrl} />
            </main>
        </div>
    )
}

export default function NewClientPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Loading form...</p>
            </div>
        }>
            <NewClientPageContent />
        </Suspense>
    )
}
