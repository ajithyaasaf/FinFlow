'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardTopBar } from '@/components/dashboard/top-bar'
import { MobileMenuProvider } from '@/components/dashboard/mobile-menu-context'
import { Loader2 } from 'lucide-react'
import { canAccessDashboard } from '@/lib/roles'
import { UserRole } from '@/types'

export default function DashboardLayout({
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

                const { data: userData } = await supabase
                    .from('app_users')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (!userData || !canAccessDashboard(userData.role as UserRole)) {
                    router.push('/staff')
                    return
                }

                setLoading(false)
            } catch (error) {
                console.error('Auth check error:', error)
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Verifying authorization...</p>
            </div>
        )
    }

    return (
        <MobileMenuProvider>
            <div className="min-h-screen bg-slate-100">
                <Sidebar />
                <div className="lg:pl-64">
                    <DashboardTopBar />
                    <main className="p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </MobileMenuProvider>
    )
}
