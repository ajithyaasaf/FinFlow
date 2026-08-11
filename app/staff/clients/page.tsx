'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ClientList } from '@/components/dashboard/client-list'

export default function AgentClientsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('app_users')
                .select('role, is_tl')
                .eq('id', user.id)
                .single()

            let query = supabase
                .from('clients')
                .select(`
                    *,
                    onboarding_agent:app_users!clients_onboarding_agent_id_fkey(full_name)
                `)
                .order('created_at', { ascending: false })

            if (profile?.role !== 'ADMIN' && profile?.role !== 'MD') {
                query = query.eq('onboarding_agent_id', user.id)
            }

            const { data } = await query
            setClients(data || [])
        } catch (err) {
            console.error('Error fetching staff clients:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-xs md:text-sm text-gray-500">Manage client profiles and information</p>
                </div>
                <Link href="/staff/clients/new">
                    <Button className="gap-2 text-sm w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
            ) : (
                <ClientList initialClients={clients} basePath="/staff/clients" />
            )}
        </div>
    )
}
