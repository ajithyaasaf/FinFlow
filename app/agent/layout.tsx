import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNavigation } from '@/components/agent/bottom-navigation'

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
        <div className="min-h-screen">
            {children}
            <BottomNavigation />
        </div>
    )
}
