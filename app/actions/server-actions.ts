'use server'

import { createNotification, NotificationType } from '@/lib/notifications'
import { createAuditLog, AuditAction, EntityType } from '@/lib/audit-logger'

interface NotificationParams {
    userId: string
    title: string
    message: string
    type: NotificationType
    entityType?: string
    entityId?: string
    linkUrl?: string
}

export async function createNotificationAction(params: NotificationParams) {
    await createNotification(params)
}

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

export async function createAuditLogAction(params: AuditLogParams) {
    await createAuditLog(params)
}
