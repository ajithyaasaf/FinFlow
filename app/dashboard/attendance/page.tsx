import { getAttendanceLogs } from '@/lib/services/attendanceService'
import { getAgents } from '@/lib/services/agentService'
import { AttendanceClient } from '@/components/dashboard/attendance-client'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: Promise<{
        date?: string
    }>
}

export default async function AttendancePage({ searchParams }: PageProps) {
    const params = await searchParams
    const selectedDate = params.date || new Date().toISOString().split('T')[0]
    
    return (
        <Suspense fallback={
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Loading attendance records...</p>
            </div>
        }>
            <AttendanceLoader selectedDate={selectedDate} />
        </Suspense>
    )
}

async function AttendanceLoader({ selectedDate }: { selectedDate: string }) {
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
