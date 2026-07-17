const { createAdminClient } = require('../lib/supabase/admin');

async function checkUsers() {
    const supabase = createAdminClient();
    const { data: users, error } = await supabase
        .from('app_users')
        .select('id, email, role, full_name, status');
    
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    
    console.log('App Users in Database:');
    console.log(JSON.stringify(users, null, 2));
}

checkUsers();
