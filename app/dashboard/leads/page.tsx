import { LeadsBoard } from '@/components/dashboard/leads-board'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <p className="text-red-500">Not authenticated</p>
            </div>
        )
    }

    // Fetch role & TL status
    const { data: profile } = await supabase
        .from('app_users')
        .select('role, is_tl')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <p className="text-red-500">Profile not found</p>
            </div>
        )
    }

    // Build query
    let query = supabase.from('leads').select(`
        *,
        assigned_agent:app_users(id, full_name, email)
    `)

    let agentsQuery = supabase.from('app_users').select('id, full_name, email').eq('status', 'ACTIVE')

    if (profile.role === 'STAFF') {
        if (profile.is_tl) {
            // Fetch active team members
            const { data: teamMembers } = await supabase
                .from('app_users')
                .select('id')
                .eq('tl_id', user.id)
                .eq('status', 'ACTIVE')
            
            const teamIds = teamMembers ? teamMembers.map(m => m.id) : []
            const allowedIds = [user.id, ...teamIds]
            
            query = query.in('assigned_agent_id', allowedIds)
            agentsQuery = agentsQuery.or(`id.eq.${user.id},tl_id.eq.${user.id}`)
        } else {
            // Regular staff: only themselves
            query = query.eq('assigned_agent_id', user.id)
            agentsQuery = agentsQuery.eq('id', user.id)
        }
    } else {
        // Admin or MD: see all active staff
        agentsQuery = agentsQuery.eq('role', 'STAFF')
    }

    // Fetch leads and agents in parallel
    const [leadsRes, agentsRes] = await Promise.all([
        query.order('created_at', { ascending: false }),
        agentsQuery
    ])

    const leads = leadsRes.data || []
    const agents = agentsRes.data || []

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
