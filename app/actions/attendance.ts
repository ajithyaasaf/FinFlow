'use server'

import { revalidatePath } from 'next/cache'
import { saveManualAttendance, deleteAttendanceLog } from '@/lib/services/attendanceService'
import { createAuditLog } from '@/lib/audit-logger'
import { createClient } from '@/lib/supabase/server'

interface SaveAttendanceParams {
    agentId: string
    checkInTime: string
    latitude: number
    longitude: number
}

export async function saveManualAttendanceAction(params: SaveAttendanceParams) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const log = await saveManualAttendance(
            params.agentId,
            params.checkInTime,
            params.latitude,
            params.longitude
        )

        // Audit log action
        try {
            await createAuditLog({
                userId: user.id,
                action: 'AGENT_UPDATED',
                entityType: 'AGENT',
                entityId: params.agentId,
                newValue: {
                    agent_id: params.agentId,
                    check_in_time: params.checkInTime,
                    details: log.check_in_details
                }
            })
        } catch (auditError) {
            console.error('Failed to write attendance audit log:', auditError)
        }

        revalidatePath('/dashboard/attendance')
        revalidatePath('/dashboard/agents')
        
        return { success: true }
    } catch (error: any) {
        console.error('Save manual attendance action failed:', error)
        return { success: false, error: error.message || 'Failed to record attendance entry' }
    }
}

export async function deleteAttendanceLogAction(logId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const success = await deleteAttendanceLog(logId)
        if (!success) throw new Error('Deletion failed')

        // Audit log action
        try {
            await createAuditLog({
                userId: user.id,
                action: 'AGENT_UPDATED',
                entityType: 'AGENT',
                entityId: logId,
                newValue: { deleted: true }
            })
        } catch (auditError) {
            console.error('Failed to write attendance delete audit log:', auditError)
        }

        revalidatePath('/dashboard/attendance')
        revalidatePath('/dashboard/agents')
        
        return { success: true }
    } catch (error: any) {
        console.error('Delete attendance action failed:', error)
        return { success: false, error: error.message || 'Failed to remove attendance log' }
    }
}
