const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function testQuery() {
  const { data, error } = await supabase
    .from('leads')
    .select('lead_id')
    .limit(1)
    .single();
    
  if (data) {
    const leadId = data.lead_id;
    console.log('Testing leadId:', leadId);
    const [leadRes, activitiesRes] = await Promise.all([
        supabase
            .from('leads')
            .select(`
                *,
                assigned_agent:app_users(id, full_name, email)
            `)
            .eq('lead_id', leadId)
            .single(),
        supabase
            .from('activities')
            .select(`
                *,
                assigned_agent:app_users!activities_assigned_agent_id_fkey(id, full_name, email),
                completed_by:app_users!activities_completed_by_id_fkey(id, full_name)
            `)
            .eq('related_lead_id', leadId)
            .order('created_at', { ascending: false })
    ]);
    
    if (activitiesRes.error) {
        console.error('ACTIVITIES ERROR:', activitiesRes.error.message);
    } else {
        console.log('ACTIVITIES SUCCESS:', activitiesRes.data.length);
    }
  }
}

testQuery();
