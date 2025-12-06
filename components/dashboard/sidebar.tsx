'use client'

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
    TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '/dashboard/loans',
        label: 'Loan Applications',
        icon: CreditCard,
    },
    {
        href: '/dashboard/agents',
        label: 'Agents',
        icon: Users,
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
        href: '/dashboard/reports',
        label: 'Reports',
        icon: BarChart3,
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex h-16 items-center px-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                        <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-gray-900">FinFlow</span>
                        <p className="text-[10px] text-gray-400 -mt-0.5">Admin Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 space-y-1">
                <p className="px-3 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Menu
                </p>

                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
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

                <form action="/api/auth/signout" method="POST">
                    <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </form>
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
    )
}
