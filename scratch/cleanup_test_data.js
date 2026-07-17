const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to parse .env.local file
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local file not found');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.substring(1, value.length - 1);
            }
            env[key] = value.trim();
        }
    });
    return env;
}

async function run() {
    const env = loadEnv();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing credentials in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch all clients whose name does NOT match "Godiva Tech" or similar
    console.log('Fetching clients...');
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('client_id, full_name');

    if (clientError) {
        console.error('Error fetching clients:', clientError);
        return;
    }

    console.log(`Found ${clients.length} total clients.`);

    const clientsToDelete = clients.filter(c => {
        const name = c.full_name.toLowerCase().replace(/\s+/g, '');
        return name !== 'godivatech';
    });

    console.log(`Identified ${clientsToDelete.length} clients to delete:`);
    clientsToDelete.forEach(c => console.log(`- ${c.full_name} (${c.client_id})`));

    if (clientsToDelete.length === 0) {
        console.log('No clients to delete.');
        return;
    }

    const clientIdsToDelete = clientsToDelete.map(c => c.client_id);

    // 2. Fetch loan applications for these clients to delete emi_schedules and topup_offers
    const { data: loans, error: loanError } = await supabase
        .from('loan_applications')
        .select('loan_id, client_id')
        .in('client_id', clientIdsToDelete);

    if (loanError) {
        console.error('Error fetching loans:', loanError);
        return;
    }

    const loanIdsToDelete = loans.map(l => l.loan_id);
    console.log(`Found ${loanIdsToDelete.length} loans associated with these clients.`);

    // 3. Delete topup_offers
    if (loanIdsToDelete.length > 0) {
        console.log('Deleting associated topup_offers...');
        const { error: topupError } = await supabase
            .from('topup_offers')
            .delete()
            .in('loan_id', loanIdsToDelete);
        if (topupError) console.error('Error deleting topup_offers:', topupError);
    }

    // 4. Delete emi_schedule
    if (loanIdsToDelete.length > 0) {
        console.log('Deleting associated emi_schedule...');
        const { error: emiError } = await supabase
            .from('emi_schedule')
            .delete()
            .in('loan_id', loanIdsToDelete);
        if (emiError) console.error('Error deleting emi_schedule:', emiError);
    }

    // 5. Delete activities
    console.log('Deleting associated activities...');
    const { error: activityError } = await supabase
        .from('activities')
        .delete()
        .in('related_client_id', clientIdsToDelete);
    if (activityError) console.error('Error deleting activities:', activityError);

    // 6. Delete loan_applications
    if (clientIdsToDelete.length > 0) {
        console.log('Deleting associated loan_applications...');
        const { error: delLoanError } = await supabase
            .from('loan_applications')
            .delete()
            .in('client_id', clientIdsToDelete);
        if (delLoanError) console.error('Error deleting loan_applications:', delLoanError);
    }

    // 7. Delete clients
    console.log('Deleting clients...');
    const { error: delClientError } = await supabase
        .from('clients')
        .delete()
        .in('client_id', clientIdsToDelete);
    
    if (delClientError) {
        console.error('Error deleting clients:', delClientError);
    } else {
        console.log('Successfully deleted all clients other than Godiva Tech!');
    }
}

run();
