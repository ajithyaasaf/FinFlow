import { getLeads } from '@/lib/services/leadService'
import { getAgents } from '@/lib/services/agentService'
import { LeadsBoard } from '@/components/dashboard/leads-board'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function LeadsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Leads Hub</h1>
                <p className="text-xs md:text-sm text-gray-500">Track raw inquiries, call logs, and customer conversion pipelines.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-4 py-4">
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-[400px] bg-gray-50 rounded-xl animate-pulse border border-gray-200"></div>
                        ))}
                    </div>
                </div>
            }>
                <LeadsLoader />
            </Suspense>
        </div>
    )
}

async function LeadsLoader() {
    const [leads, agents] = await Promise.all([
        getLeads(),
        getAgents()
    ])

    // Format agents for select components
    const formattedAgents = agents.map(a => ({
        id: a.id,
        full_name: a.full_name
    }))

    return <LeadsBoard initialLeads={leads || []} agents={formattedAgents} />
}
