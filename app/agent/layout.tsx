import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNavigation } from '@/components/agent/bottom-navigation'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default async function AgentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify user is an agent
    const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'AGENT') {
        redirect('/dashboard')
    }

    return (
        <div>
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-lg font-bold">FinFlow</h1>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                </div>
            </div>
            {children}
            <BottomNavigation />
        </div>
    )
}
