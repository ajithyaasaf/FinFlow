import { getBankPartners } from '@/lib/services/bankService'
import { PartnersList } from '@/components/dashboard/partners-list'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function PartnersPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bank Partners</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage external banks, NBFCs, and lender branch manager relationships.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="h-40 bg-gray-55 rounded animate-pulse w-full"></div>
                </div>
            }>
                <PartnersLoader />
            </Suspense>
        </div>
    )
}

async function PartnersLoader() {
    const partners = await getBankPartners()
    return <PartnersList initialPartners={partners || []} />
}
