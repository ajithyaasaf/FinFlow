import { generateCallbackAlerts } from '../lib/notifications'
import { createAdminClient } from '../lib/supabase/admin'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function run() {
    console.log('--- START TEST ---')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

    // Attempt to insert a test notification using anon client
    // Note: We need a valid user ID. Let's see if we can query users first.
    // Querying users might be blocked by RLS on anon, but app_users might be open.
    const { data: users, error: userErr } = await supabase
        .from('app_users')
        .select('id, full_name, role')
        .limit(2)

    console.log('Users query error:', userErr)
    console.log('Fetched users:', users)

    if (users && users.length > 0) {
        const userId = users[0].id
        console.log(`Attempting insert notification for user ${userId} using anon client...`)

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title: 'Test Anon Notif',
                message: 'Testing if anon client can insert notifications',
                type: 'INFO'
            })
            .select()

        console.log('Insert result:', data)
        console.log('Insert error:', error)
    }

    console.log('--- END TEST ---')
}

run().catch(console.error)

run().catch(console.error)
