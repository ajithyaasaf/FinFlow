import { LeadsBoard } from '@/components/dashboard/leads-board'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/agent/page-header'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AgentLeadsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile to check role & TL status
    const { data: agentProfile } = await supabase
        .from('app_users')
        .select('id, full_name, role, is_tl')
        .eq('id', user.id)
        .single()

    let agentsList: any[] = []

    if (agentProfile) {
        agentsList = [{ id: agentProfile.id, full_name: agentProfile.full_name }]

        if (agentProfile.role === 'STAFF' && agentProfile.is_tl) {
            // Fetch active team members reporting to this TL
            const { data: teamMembers } = await supabase
                .from('app_users')
                .select('id, full_name, email')
                .eq('tl_id', agentProfile.id)
                .eq('status', 'ACTIVE')
            
            if (teamMembers) {
                agentsList = [...agentsList, ...teamMembers]
            }
        }
    }

    // Fetch leads with assigned_agent relation joined
    const { data: leads } = await supabase
        .from('leads')
        .select(`
            *,
            assigned_agent:app_users(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHeader
                title="Leads Hub"
                subtitle="Track your prospects, log follow-up actions, and convert inquiries."
            />

            <main className="p-4">
                <LeadsBoard initialLeads={leads || []} agents={agentsList} />
            </main>
        </div>
    )
}
