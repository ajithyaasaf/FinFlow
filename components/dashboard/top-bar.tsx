'use client'

import { NotificationBell } from '@/components/notifications/notification-bell'

export function DashboardTopBar() {
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-end px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <NotificationBell />
            </div>
        </header>
    )
}
