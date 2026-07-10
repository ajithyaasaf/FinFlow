'use client'

import { useState, useEffect } from 'react'
import { LeadsBoard } from '@/components/dashboard/leads-board'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

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
            <div className="p-4 space-y-4 pb-20">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Leads Hub</h1>
                    <p className="text-xs text-gray-500">Track your prospects, log follow-up actions, and convert inquiries.</p>
                </div>
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="h-64 bg-gray-55 rounded animate-pulse w-full flex flex-col items-center justify-center text-sm text-gray-400 gap-2">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span>Loading leads board...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4 pb-20">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Leads Hub</h1>
                <p className="text-xs text-gray-500">Track your prospects, log follow-up actions, and convert inquiries.</p>
            </div>

            <LeadsBoard initialLeads={leads} agents={agents} />
        </div>
    )
}
