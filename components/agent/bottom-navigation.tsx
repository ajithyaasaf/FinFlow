'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calculator, Camera, User, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNavigation() {
    const pathname = usePathname()

    const navItems = [
        { href: '/staff/attendance', label: 'Attendance', icon: Camera },
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
            <div className="grid grid-cols-2">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    
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
                                    ? 'text-primary font-semibold'
                                    : 'text-[#6a6a6a] hover:text-[#222222]'
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                            <Icon className={cn(
                                'transition-all',
                                isActive ? 'h-6 w-6 text-primary' : 'h-5 w-5'
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

