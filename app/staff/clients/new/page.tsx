'use client'

import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/agent/page-header'
import { ClientForm } from '@/components/agent/client-form'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

function NewClientPageContent() {
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('return') || '/staff/clients'

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

const FormSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-5 w-40 rounded-lg" />
        </header>
        <main className="p-4 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20 rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                ))}
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </main>
    </div>
)

export default function NewClientPage() {
    return (
        <Suspense fallback={<FormSkeleton />}>
            <NewClientPageContent />
        </Suspense>
    )
}
