import { createClient } from '@/lib/supabase/server'
import { AdminClientForm } from '@/components/dashboard/admin-client-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { AppUser } from '@/types'

export const dynamic = 'force-dynamic'

async function getAgents(): Promise<AppUser[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('app_users')
        .select('id, full_name, email, role')
        .eq('role', 'AGENT')
        .order('full_name')

    return (data || []) as AppUser[]
}

export default async function NewClientPage() {
    const agents = await getAgents()

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
                    <p className="text-sm text-gray-500">Create a new client profile</p>
                </div>
            </div>

            {/* Form */}
            <AdminClientForm mode="create" agents={agents} />
        </div>
    )
}
