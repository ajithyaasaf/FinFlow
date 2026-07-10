import { createClient } from '@/lib/supabase/server'
import type { Activity, ActivityStatus } from '@/types'

export async function getActivities() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch user profile to check role
    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    let query = supabase.from('activities').select(`
        *,
        assigned_agent:app_users(id, full_name, email),
        related_lead:leads(lead_id, full_name, phone_number),
        related_client:clients(client_id, full_name, mobile_number)
    `)

    // Agents only view activities assigned to them
    if (profile.role === 'AGENT') {
        query = query.eq('assigned_agent_id', user.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching activities:', error)
        return []
    }

    return data || []
}

export async function createActivity(activityData: Partial<Activity>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    const finalActivityData = {
        ...activityData,
        assigned_agent_id: profile?.role === 'AGENT' ? user.id : (activityData.assigned_agent_id || user.id)
    }

    const { data, error } = await supabase
        .from('activities')
        .insert([finalActivityData])
        .select(`
            *,
            assigned_agent:app_users(id, full_name, email)
        `)
        .single()

    if (error) {
        console.error('Error creating activity:', error)
        throw error
    }

    return data
}

export async function updateActivityStatus(activityId: string, status: ActivityStatus) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('activities')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('activity_id', activityId)
        .select()
        .single()

    if (error) {
        console.error('Error updating activity status:', error)
        throw error
    }

    return data
}

export async function getDueActivitiesCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const today = new Date().toISOString()

    const { count, error } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_agent_id', user.id)
        .eq('status', 'PENDING')
        .lte('due_date', today)

    if (error) {
        console.error('Error counting due activities:', error)
        return 0
    }

    return count || 0
}
