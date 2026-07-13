'use client'

import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Notification {
    notification_id: string
    title: string
    message: string
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
    link_url?: string | null
    is_read: boolean
    created_at: string
}

interface NotificationListProps {
    notifications: Notification[]
    loading: boolean
    onMarkAsRead: (id: string) => void
    onMarkAllAsRead: () => void
}

const TYPE_CONFIG = {
    INFO: { icon: Info, color: 'text-primary bg-primary/10' },
    SUCCESS: { icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    WARNING: { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
    ERROR: { icon: XCircle, color: 'text-red-600 bg-red-50' },
}

export function NotificationList({
    notifications,
    loading,
    onMarkAsRead,
    onMarkAllAsRead,
}: NotificationListProps) {
    const unreadCount = notifications.filter(n => !n.is_read).length

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center">
                <Info className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col max-h-96">
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllAsRead}
                        className="h-7 text-xs"
                    >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Notification List */}
            <ScrollArea className="flex-1">
                <div className="divide-y">
                    {notifications.map((notification) => {
                        const config = TYPE_CONFIG[notification.type]
                        const Icon = config.icon

                        const content = (
                            <div
                                className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''
                                    }`}
                                onClick={() => {
                                    if (!notification.is_read) {
                                        onMarkAsRead(notification.notification_id)
                                    }
                                }}
                            >
                                <div className="flex gap-3">
                                    <div className={`p-2 rounded-full ${config.color} h-fit`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                                {notification.title}
                                            </p>
                                            {!notification.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )

                        if (notification.link_url) {
                            return (
                                <Link
                                    key={notification.notification_id}
                                    href={notification.link_url}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            onMarkAsRead(notification.notification_id)
                                        }
                                    }}
                                >
                                    {content}
                                </Link>
                            )
                        }

                        return (
                            <div key={notification.notification_id}>
                                {content}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
