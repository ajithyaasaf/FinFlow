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

    // 1. Get first active STAFF user in system to assign as the agent
    const { data: staffList, error: staffError } = await supabase
        .from('app_users')
        .select('id, full_name, email')
        .eq('role', 'STAFF')
        .eq('status', 'ACTIVE')
        .limit(1);

    if (staffError || !staffList || staffList.length === 0) {
        console.error('Could not find active staff user to assign test data to. Make sure a STAFF user exists and is active.');
        return;
    }

    const staff = staffList[0];
    console.log(`Using active staff user: ${staff.full_name} (${staff.email})`);

    // Let's create 3 test clients
    const testClients = [
        {
            full_name: 'Test Client Scenario 1 (Active Pending Offer)',
            mobile_number: '9876543210',
            onboarding_agent_id: staff.id,
            pan_number: 'ABCDE1234F',
            aadhaar_number: '123456789012',
            kyc_document_url: null
        },
        {
            full_name: 'Test Client Scenario 2 (Eligible Standard Path)',
            mobile_number: '9876543211',
            onboarding_agent_id: staff.id,
            pan_number: 'ABCDE1234G',
            aadhaar_number: '123456789013',
            kyc_document_url: null
        },
        {
            full_name: 'Test Client Scenario 3 (Eligible Partial Pre-payment)',
            mobile_number: '9876543212',
            onboarding_agent_id: staff.id,
            pan_number: 'ABCDE1234H',
            aadhaar_number: '123456789014',
            kyc_document_url: null
        }
    ];

    // Insert clients
    const insertedClients = [];
    for (const c of testClients) {
        // Check if client already exists to avoid duplication
        const { data: existing } = await supabase
            .from('clients')
            .select('client_id')
            .eq('mobile_number', c.mobile_number)
            .single();

        if (existing) {
            insertedClients.push(existing);
            console.log(`Client ${c.full_name} already exists.`);
        } else {
            const { data: inserted, error } = await supabase
                .from('clients')
                .insert(c)
                .select('client_id')
                .single();
            if (error) {
                console.error(`Error inserting client ${c.full_name}:`, error);
                return;
            }
            insertedClients.push(inserted);
            console.log(`Inserted client: ${c.full_name}`);
        }
    }

    const [c1, c2, c3] = insertedClients;

    // --- SCENARIO 1: Create an active PENDING topup offer directly ---
    console.log('\nCreating Scenario 1...');
    // Create original loan
    const { data: loan1, error: l1Error } = await supabase
        .from('loan_applications')
        .insert({
            client_id: c1.client_id,
            amount: 200000,
            interest_rate: 12,
            tenure: 12,
            process_stage: 'Disbursed',
            disbursement_type: 'New'
        })
        .select('loan_id')
        .single();
    
    if (l1Error) {
        console.error('Error creating Scenario 1 loan:', l1Error);
    } else {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        // Try creating with assigned_agent_id, if schema is not updated it might fail, we catch it
        const { error: o1Error } = await supabase
            .from('topup_offers')
            .insert({
                loan_id: loan1.loan_id,
                client_id: c1.client_id,
                offered_amount: 80000,
                status: 'PENDING',
                expires_at: expiresAt.toISOString(),
                assigned_agent_id: staff.id, // requires migration 020 to be run
                eligibility_details: {
                    emisPaid: 8,
                    missedPayments: 0,
                    principalRepaid: 100000,
                    repaidPercentage: 50,
                    loanStatus: 'Disbursed'
                }
            });
        
        if (o1Error) {
            console.error('Error creating Scenario 1 offer:', o1Error.message);
            console.log('💡 TIP: Please make sure you have run the migration 020_topup_system_improvements.sql in the Supabase SQL editor!');
        } else {
            console.log('Successfully created Scenario 1 Pending top-up offer (80,000 offered).');
        }
    }

    // --- SCENARIO 2: Create a loan + EMI schedule that makes it eligible via Standard Path (6 EMIs paid, 30% principal repaid) ---
    console.log('\nCreating Scenario 2...');
    const { data: loan2, error: l2Error } = await supabase
        .from('loan_applications')
        .insert({
            client_id: c2.client_id,
            amount: 100000,
            interest_rate: 12,
            tenure: 12,
            process_stage: 'Disbursed',
            disbursement_type: 'New'
        })
        .select('loan_id')
        .single();

    if (l2Error) {
        console.error('Error creating Scenario 2 loan:', l2Error);
    } else {
        // Create 12 EMIs, mark first 7 as PAID (principal component must total >= 30,000)
        // Each EMI: principal is ~8000, interest is ~1000
        const emis = [];
        const today = new Date();
        let outstanding = 100000;
        for (let i = 1; i <= 12; i++) {
            const dueDate = new Date();
            dueDate.setMonth(today.getMonth() - (8 - i)); // Past and future EMIs
            
            const principal = 8333.33;
            outstanding -= principal;
            emis.push({
                loan_id: loan2.loan_id,
                emi_number: i,
                due_date: dueDate.toISOString().split('T')[0],
                emi_amount: 9000,
                principal_component: principal,
                interest_component: 666.67,
                outstanding_principal: Math.max(0, outstanding),
                status: i <= 7 ? 'PAID' : 'PENDING'
            });
        }
        
        const { error: emi2Error } = await supabase.from('emi_schedule').insert(emis);
        if (emi2Error) console.error('Error inserting Scenario 2 EMIs:', emi2Error.message);
        else console.log('Successfully created Scenario 2 Loan + 7 PAID EMIs (eligible standard path).');
    }

    // --- SCENARIO 3: Create a loan + EMIs eligible via Partial Pre-payment (e.g. only 2 EMIs paid but > 50% principal repaid) ---
    console.log('\nCreating Scenario 3...');
    const { data: loan3, error: l3Error } = await supabase
        .from('loan_applications')
        .insert({
            client_id: c3.client_id,
            amount: 200000,
            interest_rate: 12,
            tenure: 12,
            process_stage: 'Disbursed',
            disbursement_type: 'New'
        })
        .select('loan_id')
        .single();

    if (l3Error) {
        console.error('Error creating Scenario 3 loan:', l3Error);
    } else {
        // Only 2 EMIs paid, but principal_component on first one is 110,000 (prepayment)
        const emis = [];
        const today = new Date();
        let outstanding = 200000;
        for (let i = 1; i <= 12; i++) {
            const dueDate = new Date();
            dueDate.setMonth(today.getMonth() - (3 - i));
            
            const principal = i === 1 ? 110000 : 8000;
            outstanding -= principal;
            
            emis.push({
                loan_id: loan3.loan_id,
                emi_number: i,
                due_date: dueDate.toISOString().split('T')[0],
                emi_amount: i === 1 ? 111000 : 9000,
                principal_component: principal,
                interest_component: 1000,
                outstanding_principal: Math.max(0, outstanding),
                status: i <= 2 ? 'PAID' : 'PENDING'
            });
        }
        
        const { error: emi3Error } = await supabase.from('emi_schedule').insert(emis);
        if (emi3Error) console.error('Error inserting Scenario 3 EMIs:', emi3Error.message);
        else console.log('Successfully created Scenario 3 Loan + High principal pre-payment (eligible partial pre-payment path).');
    }

    console.log('\nSeed data generation complete!');
    console.log(`Log in as agent: ${staff.email} to view and test the Leads.`);
}

run();
