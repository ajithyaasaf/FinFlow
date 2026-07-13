import { PartnersList } from '@/components/dashboard/partners-list'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PartnersPage() {
    const supabase = await createClient()
    const { data: partners, error } = await supabase
        .from('bank_partners')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bank partners:', error)
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bank Partners</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage external banks, NBFCs, and lender branch manager relationships.</p>
            </div>

            <PartnersList initialPartners={partners || []} />
        </div>
    )
}
