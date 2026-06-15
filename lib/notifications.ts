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
        // Must use admin client to bypass the INSERT RLS policy (WITH CHECK (false))
        const supabase = createAdminClient()

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
