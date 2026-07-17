import { createClient } from '@/lib/supabase/server'
import type { AttendanceLog, AppUser } from '@/types'

export interface AttendanceLogWithAgent extends AttendanceLog {
    agent: AppUser
}

/**
 * Fetch all attendance logs for a specific date
 */
export async function getAttendanceLogs(dateStr?: string): Promise<AttendanceLogWithAgent[]> {
    const supabase = await createClient()

    // 1. Determine target date range in a timezone-robust manner
    let startOfDay: Date
    let endOfDay: Date

    if (dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number)
        startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
        endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
    } else {
        const now = new Date()
        startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    }

    // 2. Fetch logs and agent users concurrently
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
            .eq('role', 'AGENT')
    ])

    const logs = logsRes.data || []
    const agents = agentsRes.data || []

    // 3. Map agents by ID for fast lookup
    const agentsMap = new Map<string, AppUser>()
    agents.forEach(a => agentsMap.set(a.id, a))

    // 4. Zip logs with agent details
    return logs
        .map(log => {
            const agent = agentsMap.get(log.agent_id)
            if (!agent) return null
            return {
                ...log,
                agent
            }
        })
        .filter((item): item is AttendanceLogWithAgent => item !== null)
}

/**
 * Create or update an attendance record manually (Admin Override)
 */
export async function saveManualAttendance(
    agentId: string,
    checkInTime: string,
    lat: number,
    lng: number
): Promise<AttendanceLog> {
    const supabase = await createClient()

    // Parse the date to locate if an attendance log already exists for this agent on this specific day
    const checkDate = new Date(checkInTime)
    const startOfDay = new Date(checkDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(checkDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Check if there is an existing log
    const { data: existingLogs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('agent_id', agentId)
        .gte('check_in_time', startOfDay.toISOString())
        .lte('check_in_time', endOfDay.toISOString())
        .limit(1)

    const existingLog = existingLogs?.[0]

    const recordData = {
        agent_id: agentId,
        check_in_time: checkInTime,
        check_in_details: {
            lat,
            lng,
            is_manual: true
        }
    }

    if (existingLog) {
        // Update existing log
        const { data, error } = await supabase
            .from('attendance_logs')
            .update(recordData)
            .eq('log_id', existingLog.log_id)
            .select()
            .single()

        if (error) throw error
        return data
    } else {
        // Insert new log
        const { data, error } = await supabase
            .from('attendance_logs')
            .insert(recordData)
            .select()
            .single()

        if (error) throw error
        return data
    }
}

/**
 * Delete an attendance record
 */
export async function deleteAttendanceLog(logId: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
        .from('attendance_logs')
        .delete()
        .eq('log_id', logId)

    if (error) {
        console.error('Delete attendance error:', error)
        return false
    }
    return true
}
