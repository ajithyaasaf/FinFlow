'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calculator, Camera, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    {
        href: '/agent',
        label: 'Home',
        icon: Home,
    },
    {
        href: '/agent/clients',
        label: 'Clients',
        icon: Users,
    },
    {
        href: '/agent/quotation',
        label: 'Quote',
        icon: Calculator,
    },
    {
        href: '/agent/attendance',
        label: 'Attend',
        icon: Camera,
    },
    {
        href: '/agent/profile',
        label: 'Profile',
        icon: User,
    },
]

export function BottomNavigation() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
