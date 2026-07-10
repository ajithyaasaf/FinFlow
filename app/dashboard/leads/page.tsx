'use client'

import { useState, useEffect } from 'react'
import { LeadsBoard } from '@/components/dashboard/leads-board'
import { createClient } from '@/lib/supabase/client'
import Loading from './loading'

export default function LeadsPage() {
    const [loading, setLoading] = useState(true)
    const [leads, setLeads] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])

    useEffect(() => {
        async function fetchLeadsData() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Fetch role
                const { data: profile } = await supabase
                    .from('app_users')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (!profile) return

                // Build query
                let query = supabase.from('leads').select(`
                    *,
                    assigned_agent:app_users(id, full_name, email)
                `)

                if (profile.role === 'STAFF') {
                    query = query.eq('assigned_agent_id', user.id)
                }

                // Fetch leads and agents in parallel
                const [leadsRes, agentsRes] = await Promise.all([
                    query.order('created_at', { ascending: false }),
                    supabase.from('app_users').select('id, full_name').eq('role', 'STAFF')
                ])

                if (leadsRes.data) {
                    setLeads(leadsRes.data)
                }

                if (agentsRes.data) {
                    setAgents(agentsRes.data)
                }
            } catch (error) {
                console.error('Error fetching leads:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeadsData()
    }, [])

    if (loading) {
        return <Loading />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Leads Hub</h1>
                <p className="text-xs md:text-sm text-gray-500">Track raw inquiries, call logs, and customer conversion pipelines.</p>
            </div>

            <LeadsBoard initialLeads={leads} agents={agents} />
        </div>
    )
}
