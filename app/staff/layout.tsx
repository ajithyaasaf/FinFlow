'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/agent/bottom-navigation'
import { Skeleton } from '@/components/ui/skeleton'

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push('/login')
                    return
                }

                // Verify user is a staff
                const { data: userData } = await supabase
                    .from('app_users')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (!userData || userData.role !== 'STAFF') {
                    router.push('/dashboard')
                    return
                }

                setLoading(false)
            } catch (error) {
                console.error('Staff auth check error:', error)
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 space-y-4">
                {/* Header Skeleton */}
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-7 w-1/3 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>

                {/* Content Cards Skeleton */}
                <div className="space-y-3 pt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-airbnb-sm">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                                    <Skeleton className="h-3 w-1/4 rounded-lg" />
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Skeleton className="h-3.5 w-full rounded-lg" />
                                <Skeleton className="h-3.5 w-5/6 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
                <BottomNavigation />
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {children}
            <BottomNavigation />
        </div>
    )
}
