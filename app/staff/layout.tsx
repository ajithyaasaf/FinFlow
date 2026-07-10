'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/agent/bottom-navigation'
import { Loader2 } from 'lucide-react'

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
            <div className="min-h-screen flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Verifying authorization...</p>
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
