'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationList } from './notification-list'

export function NotificationBell() {
    const supabase = createClient()
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            setNotifications(data || [])
            const unread = data?.filter(n => !n.is_read).length || 0
            setUnreadCount(unread)
        } catch (error) {
            console.error('Load notifications error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let subscription: any

        const setupSubscription = async () => {
            await loadNotifications()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            subscription = supabase
                .channel('notifications')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        loadNotifications()
                    }
                )
                .subscribe()
        }

        setupSubscription()

        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [])

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('notification_id', notificationId)

            if (error) throw error

            loadNotifications()
        } catch (error) {
            console.error('Mark as read error:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            if (error) throw error

            loadNotifications()
        } catch (error) {
            console.error('Mark all as read error:', error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <NotificationList
                    notifications={notifications}
                    loading={loading}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
