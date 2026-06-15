import { getAttendanceLogs } from '@/lib/services/attendanceService'
import { getAgents } from '@/lib/services/agentService'
import { AttendanceClient } from '@/components/dashboard/attendance-client'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{
        date?: string
    }>
}

export default async function AttendancePage({ searchParams }: PageProps) {
    const params = await searchParams
    const selectedDate = params.date || new Date().toISOString().split('T')[0]
    
    const [logs, agents] = await Promise.all([
        getAttendanceLogs(selectedDate),
        getAgents()
    ])

    return (
        <AttendanceClient 
            initialLogs={logs} 
            agents={agents} 
            selectedDate={selectedDate} 
        />
    )
}
