import { UserRole } from '@/types'

/**
 * Roles defined in hierarchical order.
 * Index 0 is the highest role (MD), followed by ADMIN, then STAFF.
 */
export const ROLE_HIERARCHY: UserRole[] = ['MD', 'ADMIN', 'STAFF']

/**
 * Check if userRole meets or exceeds the requiredRole privilege level.
 */
export function hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    const userIndex = ROLE_HIERARCHY.indexOf(userRole)
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
    
    if (userIndex === -1 || requiredIndex === -1) return false
    
    // Lower index = higher permission level
    return userIndex <= requiredIndex
}

/**
 * Checks if the user is allowed to access the dashboard portal.
 * Currently MD and ADMIN. In the future, we can change this easily.
 */
export function canAccessDashboard(role: UserRole): boolean {
    return role === 'MD' || role === 'ADMIN'
}

/**
 * Checks if the user can create, edit, or delete staff members.
 * Currently MD and ADMIN.
 */
export function canManageStaff(role: UserRole): boolean {
    return role === 'MD' || role === 'ADMIN'
}

/**
 * Checks if the user can perform destructive admin actions (like deleting staff or altering core settings).
 * MD is the highest role, so MD can always do everything. ADMIN might be restricted later.
 */
export function canDeleteUser(role: UserRole): boolean {
    // Currently MD and ADMIN both allowed, but easily restricted to MD only in future
    return role === 'MD' || role === 'ADMIN'
}

/**
 * Checks if the user can modify system settings.
 * Currently MD and ADMIN.
 */
export function canManageSettings(role: UserRole): boolean {
    return role === 'MD' || role === 'ADMIN'
}
