import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardTopBar } from '@/components/dashboard/top-bar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify user is an admin
    const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || userData.role !== 'ADMIN') {
        redirect('/agent')
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar />
            <div className="lg:pl-64">
                <DashboardTopBar />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
