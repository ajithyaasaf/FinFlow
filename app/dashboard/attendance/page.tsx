import { AttendanceClient } from '@/components/dashboard/attendance-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: {
        date?: string
    }
}

export default async function AttendancePage({ searchParams }: PageProps) {
    const selectedDate = searchParams.date || new Date().toISOString().split('T')[0]
    const supabase = await createClient()

    // Calculate date range
    const [year, month, day] = selectedDate.split('-').map(Number)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

    // Fetch logs and agents in parallel
    const [logsRes, agentsRes] = await Promise.all([
        supabase
            .from('attendance_logs')
            .select('*')
            .gte('check_in_time', startOfDay.toISOString())
            .lte('check_in_time', endOfDay.toISOString())
            .order('check_in_time', { ascending: false }),
        supabase
            .from('app_users')
            .select('*')
            .eq('role', 'STAFF')
    ])

    const fetchedLogs = logsRes.data || []
    const fetchedAgents = agentsRes.data || []

    // Map agents by ID
    const agentsMap = new Map<string, any>()
    fetchedAgents.forEach(a => agentsMap.set(a.id, a))

    // Zip logs with agent details
    const zippedLogs = fetchedLogs
        .map(log => {
            const agent = agentsMap.get(log.agent_id)
            if (!agent) return null
            return {
                ...log,
                agent
            }
        })
        .filter(item => item !== null)

    return (
        <AttendanceClient 
            initialLogs={zippedLogs as any} 
            agents={fetchedAgents as any} 
            selectedDate={selectedDate} 
        />
    )
}
