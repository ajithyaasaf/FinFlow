'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calculator, Camera, User, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNavigation() {
    const pathname = usePathname()

    const navItems = [
        { href: '/staff', label: 'Home', icon: Home },
        { href: '/staff/clients', label: 'Clients', icon: Users },
        { href: '/staff/quotation', label: 'Quote', icon: Calculator },
        { href: '/staff/attendance', label: 'Attend', icon: Camera },
        { href: '/staff/wiki', label: 'Handbook', icon: BookOpen },
        { href: '/staff/profile', label: 'Profile', icon: User },
    ]

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-airbnb-lg"
            style={{
                zIndex: 50,
                paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))'
            }}
        >
            <div className="grid grid-cols-6">
                {navItems.map((item) => {
                    const isActive = item.href === '/staff'
                        ? pathname === '/staff'
                        : pathname.startsWith(item.href)
                    
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 transition-all duration-200',
                                'min-h-[64px] py-2 px-1 relative',
                                'active:scale-95',
                                isActive
                                    ? 'text-blue-600 font-semibold'
                                    : 'text-[#6a6a6a] hover:text-[#222222]'
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                            <Icon className={cn(
                                'transition-all',
                                isActive ? 'h-6 w-6 text-blue-600' : 'h-5 w-5'
                            )} />
                            <span className="text-[10px] leading-tight font-medium">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
