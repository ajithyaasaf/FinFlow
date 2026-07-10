import { getLeads } from '@/lib/services/leadService'
import { LeadsBoard } from '@/components/dashboard/leads-board'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function AgentLeadsPage() {
    return (
        <div className="p-4 space-y-4 pb-20">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Leads Hub</h1>
                <p className="text-xs text-gray-500">Track your prospects, log follow-up actions, and convert inquiries.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="h-64 bg-gray-55 rounded animate-pulse w-full text-center py-12 text-sm text-gray-400">Loading leads board...</div>
                </div>
            }>
                <LeadsLoader />
            </Suspense>
        </div>
    )
}

async function LeadsLoader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const [leads, agentProfileRes] = await Promise.all([
        getLeads(),
        supabase.from('app_users').select('id, full_name').eq('id', user?.id || '').single()
    ])

    const agentProfile = agentProfileRes.data
    const formattedAgents = agentProfile ? [{ id: agentProfile.id, full_name: agentProfile.full_name }] : []

    return <LeadsBoard initialLeads={leads || []} agents={formattedAgents} />
}
