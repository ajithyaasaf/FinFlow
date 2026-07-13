'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { createClient } from '@/lib/supabase/client'

interface PageHeaderProps {
    title: string
    subtitle?: string
    backHref?: string
    showNotifications?: boolean
    actions?: React.ReactNode
}

export function PageHeader({
    title,
    subtitle,
    backHref,
    showNotifications = true,
    actions
}: PageHeaderProps) {
    const handleLogout = async () => {
        const supabase = createClient()
        console.log('[FinFlow] PageHeader logout initiated')
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <header
            className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 shadow-sm"
            style={{
                zIndex: 40,
                paddingTop: 'max(12px, env(safe-area-inset-top, 0px))'
            }}
        >
            <div className="flex items-center gap-3">
                {backHref && (
                    <Link href={backHref}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 -ml-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                )}
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
                    {subtitle && (
                        <p className="text-xs text-gray-600 truncate">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    {showNotifications && <NotificationBell />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-10 w-10 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
