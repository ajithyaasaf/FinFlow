'use client'

import { NotificationBell } from '@/components/notifications/notification-bell'
import { Menu, HeartHandshake } from 'lucide-react'
import { useMobileMenu } from './mobile-menu-context'
import { Button } from '@/components/ui/button'

export function DashboardTopBar() {
    const { toggleMenu } = useMobileMenu()

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
            {/* Left Section - Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
                {/* Hamburger Menu - Only visible on mobile */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMenu}
                    className="lg:hidden p-2"
                    aria-label="Toggle menu"
                >
                    <Menu className="h-5 w-5 text-gray-600" />
                </Button>

                {/* Mobile Logo/Branding - Only visible on mobile */}
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                        <HeartHandshake className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">HealthyHome</span>
                </div>
            </div>

            {/* Right Section - Notifications */}
            <div className="flex items-center gap-4">
                <NotificationBell />
            </div>
        </header>
    )
}
