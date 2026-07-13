import { ClientList } from '@/components/dashboard/client-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
    const supabase = await createClient()
    const { data: clients, error } = await supabase
        .from('clients')
        .select(`
            *,
            onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
    }

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
