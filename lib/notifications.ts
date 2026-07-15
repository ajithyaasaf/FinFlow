import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

interface CreateNotificationParams {
    userId: string
    title: string
    message: string
    type: NotificationType
    entityType?: string
    entityId?: string
    linkUrl?: string
}

/**
 * Create a notification for a user
 */
export async function createNotification({
    userId,
    title,
    message,
    type,
    entityType,
    entityId,
    linkUrl,
}: CreateNotificationParams): Promise<void> {
    try {
        // Use admin client if key is set, otherwise fall back to authenticated user client
        let supabase
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            supabase = createAdminClient()
        } else {
            supabase = await createClient()
        }

        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                entity_type: entityType || null,
                entity_id: entityId || null,
                link_url: linkUrl || null,
            })

        if (error) {
            console.error('Notification error:', error)
        }
    } catch (error) {
        console.error('Notification exception:', error)
    }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const supabase = await createClient()

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        if (error) throw error

        return count || 0
    } catch (error) {
        console.error('Get unread count error:', error)
        return 0
    }
}

/**
 * Get recent notifications for a user
 */
export async function getNotifications(userId: string, limit: number = 10) {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Get notifications error:', error)
        return []
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('notification_id', notificationId)

        if (error) {
            console.error('Mark as read error:', error)
        }
    } catch (error) {
        console.error('Mark as read exception:', error)
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        if (error) {
            console.error('Mark all as read error:', error)
        }
    } catch (error) {
        console.error('Mark all as read exception:', error)
    }
}

/**
 * Run a check for upcoming callback reminders (due in the next 24 hours)
 * and generate notification alerts for the assigned agent and all admins.
 * Prevents duplicates by checking if a notification for the activity already exists.
 */
export async function generateCallbackAlerts(): Promise<number> {
    try {
        // Use admin client if key is set, otherwise fall back to authenticated user client
        let supabase
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            supabase = createAdminClient()
        } else {
            supabase = await createClient()
        }

        // 1. Fetch pending reminders due up to the next 24 hours (including past overdue reminders)
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 1) // +24 hours

        const { data: reminders, error: fetchErr } = await supabase
            .from('activities')
            .select(`
                *,
                related_lead:leads(lead_id, full_name)
            `)
            .eq('type', 'REMINDER')
            .eq('status', 'PENDING')
            .lte('due_date', targetDate.toISOString())

        if (fetchErr || !reminders) {
            console.error('Error fetching callback reminders:', fetchErr)
            return 0
        }

        // 2. Fetch all admin user IDs and agent roles to determine routing links
        const { data: appUsers, error: usersErr } = await supabase
            .from('app_users')
            .select('id, role')

        if (usersErr || !appUsers) {
            console.error('Error fetching app users for roles:', usersErr)
            return 0
        }

        const adminIds = appUsers.filter(u => u.role === 'ADMIN').map(u => u.id)

        let createdCount = 0

        for (const reminder of reminders) {
            // Check if notification already exists for this reminder to avoid duplicates
            const { data: existing, error: existErr } = await supabase
                .from('notifications')
                .select('notification_id')
                .eq('entity_type', 'ACTIVITY')
                .eq('entity_id', reminder.activity_id)
                .limit(1)

            if (existErr || (existing && existing.length > 0)) {
                // Already notified or error
                continue
            }

            const leadName = reminder.related_lead?.full_name || 'Prospect'
            const leadId = reminder.related_lead?.lead_id
            const dueDateString = new Date(reminder.due_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            const isOverdue = new Date(reminder.due_date) < new Date()
            const title = `${isOverdue ? 'Overdue' : 'Upcoming'} Callback: ${leadName}`
            const message = `Callback reminder "${reminder.title}" is ${isOverdue ? 'overdue since' : 'due on'} ${dueDateString}.`

            // Create notification for the assigned agent
            if (reminder.assigned_agent_id) {
                const isAgentAdmin = adminIds.includes(reminder.assigned_agent_id)
                const agentLink = isAgentAdmin 
                    ? `/dashboard/leads?leadId=${leadId}` 
                    : `/agent/leads?leadId=${leadId}`

                await createNotification({
                    userId: reminder.assigned_agent_id,
                    title,
                    message,
                    type: 'WARNING',
                    entityType: 'ACTIVITY',
                    entityId: reminder.activity_id,
                    linkUrl: agentLink
                })
                createdCount++
            }

            // Create notifications for all administrators
            for (const adminId of adminIds) {
                // Avoid notifying the admin twice if the admin is also the assigned agent
                if (adminId === reminder.assigned_agent_id) continue

                await createNotification({
                    userId: adminId,
                    title,
                    message,
                    type: 'WARNING',
                    entityType: 'ACTIVITY',
                    entityId: reminder.activity_id,
                    linkUrl: `/dashboard/leads?leadId=${leadId}`
                })
                createdCount++
            }
        }

        return createdCount
    } catch (err) {
        console.error('Exception in generateCallbackAlerts:', err)
        return 0
    }
}
