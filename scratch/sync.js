const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function syncOldData() {
  // Find all clients that have empty business info but came from leads
  // Actually, we can just find the lead with phone 9948487684 (from the screenshot)
  const { data: lead } = await supabase.from('leads').select('*').eq('phone_number', '9948487684').single();
  
  if (lead) {
      console.log('Found lead:', lead.full_name);
      const { data: client, error } = await supabase.from('clients')
        .update({
            company_name: lead.company_name,
            email: lead.email,
            constitution: lead.constitution,
            industry_type: lead.industry_type,
            nature_of_business: lead.nature_of_business,
            property_details: lead.property_details,
            ownership_type: lead.ownership_type,
            regular_it: lead.regular_it,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            zip_code: lead.zip_code,
            branch: lead.branch
        })
        .eq('mobile_number', '9948487684')
        .select();
        
      if (error) console.error(error);
      else console.log('Successfully synced client:', client);
  } else {
      console.log('Lead not found');
  }
}

syncOldData();
