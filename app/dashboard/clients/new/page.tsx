'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminClientForm } from '@/components/dashboard/admin-client-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { AppUser } from '@/types'

export default function NewClientPage() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [agents, setAgents] = useState<AppUser[]>([])

    useEffect(() => {
        async function loadAgents() {
            setLoading(true)
            try {
                const supabase = createClient()

                const { data } = await supabase
                    .from('app_users')
                    .select('id, full_name, email, role')
                    .eq('role', 'AGENT')
                    .order('full_name')

                setAgents((data || []) as AppUser[])
            } catch (err) {
                console.error('Failed to load agents list:', err)
            } finally {
                setLoading(false)
            }
        }

        loadAgents()
    }, [])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Loading creation form...</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Add New Client</h1>
                    <p className="text-xs md:text-sm text-gray-500">Create a new client profile</p>
                </div>
            </div>

            {/* Form */}
            <AdminClientForm mode="create" agents={agents} />
        </div>
    )
}
