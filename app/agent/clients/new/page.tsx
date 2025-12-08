'use client'

import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/agent/page-header'
import { ClientForm } from '@/components/agent/client-form'

export default function NewClientPage() {
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
