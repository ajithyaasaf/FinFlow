'use client'

import { useState, useEffect } from 'react'
import { LeadsBoard } from '@/components/dashboard/leads-board'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/agent/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export default function AgentLeadsPage() {
    const [loading, setLoading] = useState(true)
    const [leads, setLeads] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])

    useEffect(() => {
        async function fetchLeadsData() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                const [leadsRes, agentProfileRes] = await Promise.all([
                    supabase.from('leads').select('*').order('created_at', { ascending: false }),
                    supabase.from('app_users').select('id, full_name').eq('id', user?.id || '').single()
                ])

                setLeads(leadsRes.data || [])
                const agentProfile = agentProfileRes.data
                setAgents(agentProfile ? [{ id: agentProfile.id, full_name: agentProfile.full_name }] : [])
            } catch (error) {
                console.error('Failed to fetch leads data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeadsData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <PageHeader
                    title="Leads Hub"
                    subtitle="Track your prospects, log follow-up actions, and convert inquiries."
                />
                <main className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-airbnb-sm">
                                <Skeleton className="h-4 w-2/3 rounded-lg" />
                                <Skeleton className="h-3 w-1/2 rounded-lg" />
                                <Skeleton className="h-8 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHeader
                title="Leads Hub"
                subtitle="Track your prospects, log follow-up actions, and convert inquiries."
            />

            <main className="p-4">
                <LeadsBoard initialLeads={leads} agents={agents} />
            </main>
        </div>
    )
}
