const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = '';
let serviceRoleKey = '';

try {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') {
            supabaseUrl = parts[1].trim().replace(/['"]/g, '');
        }
        if (parts[0] === 'SUPABASE_SERVICE_ROLE_KEY') {
            serviceRoleKey = parts[1].trim().replace(/['"]/g, '');
        }
    });
} catch (e) {
    console.error("Failed to read env file", e);
}

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing keys. URL:", supabaseUrl, "Key:", serviceRoleKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data: users, error: err1 } = await supabase.from('app_users').select('*').limit(1);
    console.log("Users:", users ? Object.keys(users[0] || {}) : null, err1);

    const { data: leads, error: err2 } = await supabase.from('leads').select('*').limit(1);
    console.log("Leads:", leads ? Object.keys(leads[0] || {}) : null, err2);
}

run();
