import { createClient } from '@/lib/supabase/server'
import { getActivities } from '@/lib/services/activityService'
import { CalendarClient } from '@/components/dashboard/calendar-client'
import { PageHeader } from '@/components/agent/page-header'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StaffCalendarPage() {
    const supabase = await createClient()

    // Get current user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to verify role
    const { data: profile } = await supabase
        .from('app_users')
        .select('id, full_name, email, role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.role !== 'STAFF' && profile.role !== 'AGENT')) {
        redirect('/dashboard')
    }

    // Fetch activities matching this staff's assigned activities (automatically filtered in getActivities based on agent role check)
    const initialActivities = await getActivities()

    // Fetch staff list for type matching
    const { data: staffMembers } = await supabase
        .from('app_users')
        .select('id, full_name, email, role')
        .order('full_name')

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                title="Operations Calendar"
                subtitle="Track callbacks & tasks"
                backHref="/staff"
                showNotifications={true}
            />
            <main className="p-4 pb-24 max-w-6xl mx-auto">
                <CalendarClient
                    initialActivities={initialActivities}
                    currentUser={{
                        id: profile.id,
                        full_name: profile.full_name,
                        email: profile.email,
                    }}
                    userRole={profile.role}
                    staffMembers={staffMembers || []}
                />
            </main>
        </div>
    )
}
