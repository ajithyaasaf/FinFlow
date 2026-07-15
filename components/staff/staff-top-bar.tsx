'use client'

import { NotificationBell } from '@/components/notifications/notification-bell'
import { HeartHandshake, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StaffTopBar() {
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
            {/* Left Section - Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
                {/* Mobile Logo/Branding - Only visible on mobile */}
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                        <HeartHandshake className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">HealthyHome</span>
                </div>
            </div>

            {/* Right Section - Notifications & Sign Out */}
            <div className="flex items-center gap-2 md:gap-4">
                <NotificationBell />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client')
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        window.location.href = '/login'
                    }}
                    className="h-10 w-10 text-gray-600 hover:text-red-600 hover:bg-red-50 lg:hidden"
                    title="Sign Out"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}

