import { createClient } from '../lib/supabase/server'

async function checkLeads() {
  // Let's inspect the leads table and app_users table directly
  const { createClient: createAdmin } = require('../lib/supabase/admin')
  const adminClient = createAdmin()

  const { data: users, error: userErr } = await adminClient
    .from('app_users')
    .select('*')

  console.log('App Users in DB:', users, userErr)

  const { data: leads, error: leadErr } = await adminClient
    .from('leads')
    .select('*')

  console.log('Leads in DB:', leads, leadErr)
}

checkLeads()
