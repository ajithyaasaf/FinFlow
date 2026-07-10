'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    BarChart3,
    LogOut,
    User,
    CreditCard,
    ChevronRight,
    TrendingUp,
    Clock,
    X,
    FileText,
    Flame,
    Building,
    BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMobileMenu } from './mobile-menu-context'

const navItems = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '/dashboard/leads',
        label: 'Leads Hub',
        icon: Flame,
    },
    {
        href: '/dashboard/loans',
        label: 'Loan Applications',
        icon: CreditCard,
    },
    {
        href: '/dashboard/quotations',
        label: 'Quotations',
        icon: FileText,
    },
    {
        href: '/dashboard/partners',
        label: 'Bank Partners',
        icon: Building,
    },
    {
        href: '/dashboard/agents',
        label: 'Agents',
        icon: Users,
    },
    {
        href: '/dashboard/attendance',
        label: 'Attendance Tracker',
        icon: Clock,
    },
    {
        href: '/dashboard/clients',
        label: 'Clients',
        icon: User,
    },
    {
        href: '/dashboard/topup',
        label: 'Top-Up Offers',
        icon: TrendingUp,
    },
    {
        href: '/dashboard/wiki',
        label: 'Policy Wiki',
        icon: BookOpen,
    },
    {
        href: '/dashboard/reports',
        label: 'Reports',
        icon: BarChart3,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { isOpen, closeMenu } = useMobileMenu()
    const [clickedHref, setClickedHref] = useState<string | null>(null)

    // Close menu when route changes and reset clicked state
    useEffect(() => {
        setClickedHref(null)
        closeMenu()
    }, [pathname, closeMenu])

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar - Desktop Fixed + Mobile Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out",
                    "lg:translate-x-0 lg:z-30",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo + Mobile Close Button */}
                <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                            <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-gray-900">FinFlow</span>
                            <p className="text-[10px] text-gray-400 -mt-0.5">Admin Portal</p>
                        </div>
                    </div>

                    {/* Close button - only visible on mobile */}
                    <button
                        onClick={closeMenu}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                    <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Menu
                    </p>

                    {navItems.map((item) => {
                        const isActive = clickedHref
                            ? clickedHref === item.href
                            : (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (pathname !== item.href) {
                                        setClickedHref(item.href)
                                    }
                                }}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                    isActive
                                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                )}
                            >
                                <Icon className={cn(
                                    "h-5 w-5",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                                )} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && (
                                    <ChevronRight className="h-4 w-4 opacity-70" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User & Sign Out */}
                <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                            <p className="text-xs text-gray-400">Super Admin</p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={async () => {
                            const { createClient } = await import('@/lib/supabase/client')
                            const supabase = createClient()
                            await supabase.auth.signOut()
                            window.location.href = '/login'
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>

                {/* Godiva Tech Branding */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] text-gray-400 text-center">
                        Developed by
                    </p>
                    <a
                        href="https://www.godivatech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gray-600 hover:text-primary text-center block transition-colors"
                    >
                        Godiva Tech, Madurai
                    </a>
                </div>
            </aside>
        </>
    )
}
