import { ClientList } from '@/components/dashboard/client-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getClients } from '@/lib/services/clientService'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
    const clients = await getClients()

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

            <ClientList initialClients={clients || []} />
        </div>
    )
}
