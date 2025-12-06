import { createClient } from '@/lib/supabase/server'
import { ClientList } from '@/components/dashboard/client-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ClientsPage() {
    const supabase = await createClient()

    const { data: clients } = await supabase
        .from('clients')
        .select(`
            *,
            onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-sm text-gray-500">Manage client profiles and information</p>
                </div>
                <Link href="/dashboard/clients/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </Link>
            </div>

            <ClientList initialClients={clients || []} />
        </div>
    )
}
