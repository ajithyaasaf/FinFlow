'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AttendanceClient } from '@/components/dashboard/attendance-client'
import { createClient } from '@/lib/supabase/client'
import Loading from './loading'

function AttendancePageContent() {
    const searchParams = useSearchParams()
    const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])

    useEffect(() => {
        async function fetchAttendanceData() {
            setLoading(true)
            try {
                const supabase = createClient()

                // Calculate date range
                const [year, month, day] = selectedDate.split('-').map(Number)
                const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
                const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

                // Fetch logs and agents
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

                setLogs(zippedLogs)
                setAgents(fetchedAgents)
            } catch (error) {
                console.error('Error fetching attendance data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAttendanceData()
    }, [selectedDate])

    if (loading) {
        return <Loading />
    }

    return (
        <AttendanceClient 
            initialLogs={logs} 
            agents={agents} 
            selectedDate={selectedDate} 
        />
    )
}

import { Suspense } from 'react'

export default function AttendancePage() {
    return (
        <Suspense fallback={<Loading />}>
            <AttendancePageContent />
        </Suspense>
    )
}
