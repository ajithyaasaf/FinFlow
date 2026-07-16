import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { canManageStaff, canDeleteUser } from '@/lib/roles'
import { UserRole } from '@/types'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()

        // Verify admin role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: adminUser } = await supabase
            .from('app_users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!adminUser || !canManageStaff(adminUser.role as UserRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { full_name, mobile_number, email, password, status, is_tl, tl_id } = body

        if (!full_name && !mobile_number && !email && !password && !status && is_tl === undefined && tl_id === undefined) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        // If email or password needs update, use Supabase Admin Auth API
        if (email || password) {
            const supabaseAdmin = createAdminClient()
            const authUpdateData: any = {}
            if (email) authUpdateData.email = email
            if (password) authUpdateData.password = password
            authUpdateData.email_confirm = true // Auto-confirm email change

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                params.id,
                authUpdateData
            )

            if (authError) {
                console.error('Auth update error:', authError)
                return NextResponse.json({ error: authError.message }, { status: 500 })
            }
        }

        // Update app_users table
        const updateData: any = {}
        if (full_name) updateData.full_name = full_name
        if (mobile_number) updateData.mobile_number = mobile_number
        if (email) updateData.email = email
        if (status) updateData.status = status
        if (is_tl !== undefined) updateData.is_tl = is_tl
        if (tl_id !== undefined) updateData.tl_id = tl_id

        const { data: updatedStaff, error } = await supabase
            .from('app_users')
            .update(updateData)
            .eq('id', params.id)
            .eq('role', 'STAFF') // Only allow updating staff
            .select()
            .single()

        if (error) {
            console.error('Update error:', error)
            return NextResponse.json({ error: 'Failed to update staff database record' }, { status: 500 })
        }

        if (!updatedStaff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        // Revalidate the staff page to show the updated staff immediately
        revalidatePath('/dashboard/staff')

        return NextResponse.json({
            success: true,
            staff: updatedStaff,
            message: 'Staff updated successfully'
        })

    } catch (error) {
        console.error('Update staff error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()

        // Verify admin role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: adminUser } = await supabase
            .from('app_users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!adminUser || !canDeleteUser(adminUser.role as UserRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete from auth using admin client (cascade will handle app_users)
        const supabaseAdmin = createAdminClient()
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.id)

        if (authError) {
            console.error('Auth delete error:', authError)
            
            // Customize error message for foreign key constraint / active records
            const isReferenceError = authError.message.toLowerCase().includes('foreign key') || 
                                     authError.message.toLowerCase().includes('violates') ||
                                     authError.status === 500;
                                     
            const errorMessage = isReferenceError
                ? 'Cannot delete staff member because they have linked clients, quotations, or attendance logs. Please reassign their clients first.'
                : authError.message;

            return NextResponse.json({ error: errorMessage }, { status: 500 })
        }

        // Revalidate the staff page to remove the deleted staff immediately
        revalidatePath('/dashboard/staff')

        return NextResponse.json({
            success: true,
            message: 'Staff deleted successfully'
        })

    } catch (error: any) {
        console.error('Delete staff error:', error)
        const isReferenceError = error?.message?.toLowerCase().includes('foreign key') || 
                                 error?.message?.toLowerCase().includes('violates');
                                 
        const errorMessage = isReferenceError
            ? 'Cannot delete staff member because they have linked clients, quotations, or attendance logs. Please reassign their clients first.'
            : 'Internal server error';

        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
