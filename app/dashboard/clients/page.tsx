'use client'

import { useState, useEffect } from 'react'
import { ClientList } from '@/components/dashboard/client-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Loading from './loading'

export default function ClientsPage() {
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<any[]>([])

    useEffect(() => {
        async function fetchClients() {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('clients')
                    .select(`
                        *,
                        onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name)
                    `)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching clients:', error)
                } else {
                    setClients(data || [])
                }
            } catch (error) {
                console.error('Failed to load clients:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchClients()
    }, [])

    if (loading) {
        return <Loading />
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

            <ClientList initialClients={clients} />
        </div>
    )
}
