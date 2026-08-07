'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminClientForm } from '@/components/dashboard/admin-client-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
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
                    .eq('role', 'STAFF')
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
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-72 rounded-md" />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl mt-4" />
                </div>
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
