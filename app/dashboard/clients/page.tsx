import { ClientList } from '@/components/dashboard/client-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getClients } from '@/lib/services/clientService'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function ClientsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-xs md:text-sm text-gray-500">Manage client profiles and information</p>
                </div>
                <Link href="/dashboard/clients/new">
                    <Button className="gap-2 text-sm w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </Link>
            </div>

            <Suspense fallback={
                <div className="space-y-4 py-4">
                    <div className="h-8 bg-gray-100 rounded animate-pulse w-full"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-55 rounded animate-pulse w-full"></div>
                    ))}
                </div>
            }>
                <ClientsLoader />
            </Suspense>
        </div>
    )
}

async function ClientsLoader() {
    const clients = await getClients()
    return <ClientList initialClients={clients || []} />
}
