'use client'

import { useState, useEffect } from 'react'
import { PartnersList } from '@/components/dashboard/partners-list'
import { createClient } from '@/lib/supabase/client'
import Loading from './loading'

export default function PartnersPage() {
    const [loading, setLoading] = useState(true)
    const [partners, setPartners] = useState<any[]>([])

    useEffect(() => {
        async function fetchPartners() {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('bank_partners')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching bank partners:', error)
                } else {
                    setPartners(data || [])
                }
            } catch (error) {
                console.error('Failed to load bank partners:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPartners()
    }, [])

    if (loading) {
        return <Loading />
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bank Partners</h1>
                <p className="text-xs md:text-sm text-gray-500">Manage external banks, NBFCs, and lender branch manager relationships.</p>
            </div>

            <PartnersList initialPartners={partners} />
        </div>
    )
}
