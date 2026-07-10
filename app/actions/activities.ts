'use server'

import { createActivity, updateActivityStatus } from '@/lib/services/activityService'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Activity, ActivityStatus } from '@/types'

export async function createActivityAction(activityData: Partial<Activity>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const activity = await createActivity(activityData)
        
        // If it's a callback reminder due in the next 24 hours, trigger notification alerts instantly
        if (activity && activity.type === 'REMINDER' && activity.due_date) {
            const dueDate = new Date(activity.due_date)
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            if (dueDate <= tomorrow) {
                const { generateCallbackAlerts } = await import('@/lib/notifications')
                await generateCallbackAlerts()
            }
        }
        
        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/clients')
        revalidatePath('/agent/leads')
        return { success: true, activity }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create activity' }
    }
}

export async function updateActivityStatusAction(activityId: string, status: ActivityStatus) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    try {
        const activity = await updateActivityStatus(activityId, status)

        revalidatePath('/dashboard/leads')
        revalidatePath('/dashboard/clients')
        revalidatePath('/agent/leads')
        return { success: true, activity }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update activity status' }
    }
}
