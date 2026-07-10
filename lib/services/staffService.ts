import { createClient } from '@/lib/supabase/server'
import type { AppUser, AttendanceLog } from '@/types'

export interface StaffWithStats extends AppUser {
    client_count: number
    quotation_count: number
    converted_count: number
    latest_attendance?: AttendanceLog
}

export async function getStaff(): Promise<StaffWithStats[]> {
    const supabase = await createClient()

    // 1. Fetch all staff members
    const { data: staff, error: staffError } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'STAFF')
        .order('created_at', { ascending: false })

    if (staffError || !staff) {
        console.error('Error fetching staff:', staffError)
        return []
    }

    if (staff.length === 0) return []

    // 2. Fetch all counts and attendance in parallel
    const [clientsRes, quotationsRes, attendanceRes] = await Promise.all([
        supabase.from('clients').select('onboarding_agent_id'),
        supabase.from('quotations').select('created_by, converted_to_loan_id'),
        supabase.from('attendance_logs').select('*').order('check_in_time', { ascending: false })
    ])

    const clientsData = clientsRes.data || []
    const quotationsData = quotationsRes.data || []
    const attendanceData = attendanceRes.data || []

    // Group client counts
    const clientCounts: Record<string, number> = {}
    clientsData.forEach(c => {
        if (c.onboarding_agent_id) {
            clientCounts[c.onboarding_agent_id] = (clientCounts[c.onboarding_agent_id] || 0) + 1
        }
    })

    // Group quotation and converted counts
    const quotationCounts: Record<string, number> = {}
    const convertedCounts: Record<string, number> = {}
    quotationsData.forEach(q => {
        if (q.created_by) {
            quotationCounts[q.created_by] = (quotationCounts[q.created_by] || 0) + 1
            if (q.converted_to_loan_id) {
                convertedCounts[q.created_by] = (convertedCounts[q.created_by] || 0) + 1
            }
        }
    })

    // Group latest attendance per staff member
    const latestAttendance: Record<string, AttendanceLog> = {}
    attendanceData.forEach(a => {
        if (a.agent_id && !latestAttendance[a.agent_id]) {
            latestAttendance[a.agent_id] = a
        }
    })

    return staff.map(member => ({
        ...member,
        client_count: clientCounts[member.id] || 0,
        quotation_count: quotationCounts[member.id] || 0,
        converted_count: convertedCounts[member.id] || 0,
        latest_attendance: latestAttendance[member.id]
    }))
}

export async function getStaffStats() {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Execute aggregate queries in parallel
    const [totalStaffRes, totalClientsRes, totalQuotationsRes, todayAttendanceRes] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('role', 'STAFF'),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('quotations').select('*', { count: 'exact', head: true }),
        supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).gte('check_in_time', today.toISOString())
    ])

    return {
        totalStaff: totalStaffRes.count || 0,
        totalClients: totalClientsRes.count || 0,
        totalQuotations: totalQuotationsRes.count || 0,
        todayAttendance: todayAttendanceRes.count || 0,
    }
}
