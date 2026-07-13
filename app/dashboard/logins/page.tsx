import { createClient } from '@/lib/supabase/server'
import { LoginsClient } from '@/components/dashboard/logins-client'
import { getLogins, getLoginsStats } from '@/lib/services/loginsService'
import { ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: {
        stage?: string
        region?: string
        bank?: string
        agent?: string
        search?: string
        from?: string
        to?: string
        page?: string
    }
}

export default async function LoginsPage({ searchParams }: PageProps) {
    const supabase = await createClient()

    const params = {
        stage:  searchParams.stage  || 'all',
        region: searchParams.region || 'all',
        bank:   searchParams.bank   || 'all',
        agent:  searchParams.agent  || 'all',
        search: searchParams.search || '',
        from:   searchParams.from   || '',
        to:     searchParams.to     || '',
        page:   searchParams.page   || '1',
    }

    // Fetch everything in parallel
    const [loginsResult, statsResult, agentsRes, partnersRes] = await Promise.all([
        getLogins(params),
        getLoginsStats({ region: params.region, bank: params.bank, from: params.from, to: params.to }),
        supabase.from('app_users').select('id, full_name, email').order('full_name'),
        supabase.from('bank_partners').select('partner_id, bank_name, branch_name').order('bank_name'),
    ])

    const { logins, total } = loginsResult
    const stats = statsResult
    const agents = agentsRes.data || []
    const partners = (partnersRes.data || []) as { partner_id: string; bank_name: string; branch_name: string | null }[]

    const pageSize = 25
    const totalPages = Math.ceil(total / pageSize)
    const currentPage = parseInt(params.page)

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Logins Hub</h1>
                        <p className="text-xs md:text-sm text-gray-500">
                            DSA file submissions to Banks &amp; NBFCs — track every stage of the approval pipeline.
                        </p>
                    </div>
                </div>
            </div>

            <LoginsClient
                logins={logins}
                stats={stats}
                total={total}
                currentPage={currentPage}
                totalPages={totalPages}
                agents={agents}
                partners={partners}
            />
        </div>
    )
}
