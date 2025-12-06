# Row Level Security (RLS) Setup Guide

## ⚠️ CRITICAL: This MUST be configured before deploying to production

Row Level Security policies ensure that:
- Agents can ONLY access their own data
- Admins can access ALL data
- No user can bypass these restrictions via API calls

---

## Prerequisites

Before running the RLS migration, ensure:
1. You have created the Supabase project
2. All tables exist (`app_users`, `clients`, `loan_applications`, `quotations`, `attendance_logs`)
3. The `documents` storage bucket exists

---

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/001_enable_rls.sql`
5. Paste and click **Run**
6. Verify no errors appear

### Option 2: Supabase CLI

```bash
npx supabase migration up
```

---

## Understanding the Policies

### Clients Table
- **Agents**: Can only SELECT/INSERT clients where `onboarding_agent_id = their user ID`
- **Admins**: Full access to all clients
- **Result**: Agent A cannot see Agent B's clients

### Loan Applications
- **Agents**: Can SELECT/INSERT loans only for their own clients
- **Admins**: Can SELECT all loans and UPDATE process stages
- **Result**: Only admins can move loans through workflow stages

### Quotations
- **Agents**: Can SELECT/INSERT only quotations they created
- **Admins**: Can SELECT/UPDATE all quotations (especially high-value ones)
- **Result**: Admins can monitor all high-value quotes

### Attendance Logs
- **Agents**: Can SELECT/INSERT only their own attendance records
- **Admins**: Can SELECT all attendance logs
- **Result**: Agents cannot fake or view other agents' attendance

---

## Testing RLS Policies

### Test 1: Agent Data Isolation
1. Create two agent accounts in Supabase Auth
2. Login as Agent A in the app
3. Add a client as Agent A
4. Logout and login as Agent B
5. **Expected**: Agent B should NOT see Agent A's client

### Test 2: Admin Access
1. Create an admin account (set `role = 'ADMIN'` in `app_users`)
2. Login as admin
3. **Expected**: Admin should see ALL clients, loans, and quotations

### Test 3: Direct API Call (Security Check)
1. Login as Agent A
2. Get the session token from browser DevTools
3. Try to query all clients via REST API:
   ```bash
   curl 'YOUR_SUPABASE_URL/rest/v1/clients' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_SESSION_TOKEN"
   ```
4. **Expected**: Should only return Agent A's clients, not all clients

---

## Storage Bucket Policies

The SQL file includes comments for storage policies. These must be created manually in the Supabase Dashboard:

1. Go to **Storage** > **documents** bucket > **Policies**
2. Create the following policies:

### Policy 1: Upload to Own Folder
- **Name**: Users can upload to their own folders
- **Allowed operation**: INSERT
- **Policy**:
  ```sql
  (bucket_id = 'documents'::text) AND 
  (auth.uid()::text = (storage.foldername(name))[1])
  ```

### Policy 2: View Own Files
- **Name**: Users can view their own files
- **Allowed operation**: SELECT
- **Policy**:
  ```sql
  (bucket_id = 'documents'::text) AND 
  (auth.uid()::text = (storage.foldername(name))[1])
  ```

### Policy 3: Admins View All
- **Name**: Admins can view all files
- **Allowed operation**: SELECT
- **Policy**:
  ```sql
  (bucket_id = 'documents'::text) AND 
  EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
  ```

---

## Common Issues

### Issue: "Permission denied for table clients"
**Cause**: RLS is enabled but no policies match the user's action  
**Fix**: Verify the user's role in `app_users` table and check policy conditions

### Issue: Agent can see other agents' data
**Cause**: RLS not enabled or policies not created  
**Fix**: Re-run the migration SQL

### Issue: Storage uploads fail
**Cause**: Storage policies not created  
**Fix**: Create storage policies in Supabase Dashboard as described above

---

## Security Checklist

Before going live, verify:

- [ ] RLS is enabled on all 5 tables
- [ ] Agent A cannot see Agent B's clients (test in app)
- [ ] Admin can see all data (test in app)
- [ ] Direct API calls respect RLS (test with curl)
- [ ] Storage bucket has RLS policies
- [ ] No public access exists (check Supabase > Authentication > Policies)

---

## Need Help?

If RLS is not working:
1. Check Supabase logs (Dashboard > Logs)
2. Verify user's `role` field in `app_users` table
3. Test policies in SQL Editor:
   ```sql
   SELECT * FROM clients; -- Run this as different users
   ```
