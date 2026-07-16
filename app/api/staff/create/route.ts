import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { canManageStaff } from '@/lib/roles'
import { UserRole } from '@/types'

export async function POST(request: NextRequest) {
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

        // Get request body
        const body = await request.json()
        const { email, password, full_name, mobile_number, role = 'STAFF', tl_id } = body

        // Validate inputs
        if (!email || !password || !full_name || !mobile_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Restrict role assignment: Admins can ONLY create STAFF accounts
        if (adminUser.role === 'ADMIN' && role !== 'STAFF') {
            return NextResponse.json({ error: 'Admins are only allowed to create Staff accounts' }, { status: 403 })
        }

        // Create admin client with service role key
        const supabaseAdmin = createAdminClient()

        // Create user in Supabase Auth using Admin API
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for admin-created users
            user_metadata: {
                full_name,
            },
        })

        if (authError) {
            console.error('Auth error:', authError)
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        // Create entry in app_users table
        const { data: appUser, error: dbError } = await supabase
            .from('app_users')
            .insert({
                id: authUser.user.id,
                role: body.role || 'STAFF',
                full_name,
                mobile_number,
                email,
                tl_id: tl_id || null,
            })
            .select()
            .single()

        if (dbError) {
            // Rollback: Delete auth user if db insert fails
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            console.error('Database error:', dbError)
            return NextResponse.json({ error: 'Failed to create staff profile' }, { status: 500 })
        }

        // Revalidate the staff page to show the new staff immediately
        revalidatePath('/dashboard/staff')

        return NextResponse.json({
            success: true,
            staff: appUser,
            message: 'Staff created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Create staff error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
