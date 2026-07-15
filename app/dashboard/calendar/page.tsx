import { createClient } from '@/lib/supabase/server'
import { getActivities } from '@/lib/services/activityService'
import { CalendarClient } from '@/components/dashboard/calendar-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
    const supabase = await createClient()

    // Get current user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
        .from('app_users')
        .select('id, full_name, email, role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Fetch activities matching role rules (handled automatically inside getActivities service)
    const initialActivities = await getActivities()

    // Fetch all staff members for task allocation options
    const { data: staffMembers, error } = await supabase
        .from('app_users')
        .select('id, full_name, email, role')
        .order('full_name')

    if (error || !staffMembers) {
        console.error('Error fetching staff list for calendar:', error)
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
        </div>
    )
}
