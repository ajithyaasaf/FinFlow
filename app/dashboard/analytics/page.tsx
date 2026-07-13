import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMDAnalytics } from '@/lib/services/analyticsService'
import { AnalyticsClient } from '@/components/dashboard/analytics-client'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AnalyticsPageProps {
    searchParams: {
        range?: string
    }
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
    const supabase = await createClient()

    // 1. Fetch current logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // 2. Fetch user's app role
    const { data: appUser, error: roleError } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (roleError || !appUser) {
        console.error('Error fetching user role for analytics check:', roleError)
        redirect('/login')
    }

    // 3. Restrict strictly to MD role
    if (appUser.role !== 'MD') {
        redirect('/dashboard')
    }

    // 4. Fetch the analytics data with requested time range
    const timeRange = searchParams.range || 'last_12_months'
    const analyticsData = await getMDAnalytics(timeRange)

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Warning banner just in case an unauthorized admin is bypassed (redundant security) */}
            {appUser.role !== 'MD' && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-sm">Access Denied</h3>
                        <p className="text-xs mt-0.5 text-red-700">
                            This dashboard contains confidential financial data and is restricted to the Managing Director.
                        </p>
                    </div>
                </div>
            )}

            {appUser.role === 'MD' && (
                <AnalyticsClient data={analyticsData} currentRange={timeRange} />
            )}
        </div>
    )
}
