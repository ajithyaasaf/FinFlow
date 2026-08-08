import { createAdminClient } from './supabase/admin'

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOAN_STATUS_CHANGE'
    | 'LOAN_TERMS_EDIT'
    | 'LOAN_CREATED'
    | 'LOAN_DISBURSED'
    | 'PAYMENT_RECORDED'
    | 'AGENT_CREATED'
    | 'AGENT_UPDATED'
    | 'AGENT_DELETED'
    | 'CLIENT_CREATED'
    | 'CLIENT_UPDATED'
    | 'QUOTATION_CREATED'
    | 'QUOTATION_REJECTED';

export type EntityType = 'LOAN' | 'AGENT' | 'CLIENT' | 'USER' | 'QUOTATION';

interface AuditLogParams {
    userId: string
    action: AuditAction
    entityType: EntityType
    entityId: string
    oldValue?: any
    newValue?: any
    ipAddress?: string
    userAgent?: string
}

/**
 * Create an audit log entry
 * Uses admin client to ensure system logs are always persisted regardless of user RLS
 */
export async function createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
}: AuditLogParams): Promise<void> {
    try {
        const adminSupabase = createAdminClient()

        const { error } = await adminSupabase
            .from('system_logs')
            .insert({
                user_id: userId,
                action_type: action,
                entity_type: entityType,
                entity_id: entityId,
                old_value: oldValue || null,
                new_value: newValue || null,
                ip_address: ipAddress || null,
                user_agent: userAgent || null,
            })

        if (error) {
            console.error('Audit log error:', error)
        }
    } catch (error) {
        console.error('Audit log exception:', error)
    }
}

/**
 * Get audit logs for a specific entity with full user relation
 */
export async function getAuditLogs(entityType: EntityType, entityId: string) {
    try {
        const adminSupabase = createAdminClient()

        const { data, error } = await adminSupabase
            .from('system_logs')
            .select(`
                *,
                user:app_users (
                    full_name,
                    email,
                    role,
                    is_tl
                )
            `)
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Get audit logs error:', error)
        return []
    }
}
