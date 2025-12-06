# 🚀 Agent Management CRUD - Setup Required

## Critical: Service Role Key Configuration

The Agent Management CRUD feature requires the **Supabase Service Role Key** to create users via the Admin API.

### Setup Steps

1. **Get Your Service Role Key:**
   - Go to your Supabase Dashboard
   - Navigate to **Settings** > **API**
   - Copy the **service_role** key (⚠️ NOT the anon key!)

2. **Add to Environment Variables:**
   
   Edit `.env.local` and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **⚠️ Security Warning:**
   - **NEVER** commit the service role key to Git
   - **NEVER** expose it on the client side
   - Only use it in server-side API routes (we already handle this)

### Features Unlocked

With this setup, admins can:
- ✅ **Create** new agents with email/password
- ✅ **Edit** agent details (name, mobile)
- ✅ **Delete** agents from the system

### Alternative: Manual Agent Creation

If you prefer not to use the Service Role Key, you can still create agents manually:

1. Create user in Supabase Auth Dashboard
2. Run SQL to add to `app_users` table:
   ```sql
   INSERT INTO app_users (id, role, full_name, mobile_number, email)
   VALUES ('user_id_from_auth', 'AGENT', 'Agent Name', '9876543210', 'email@example.com');
   ```

### Testing

After setup, test by:
1. Login as Admin
2. Go to **Dashboard** > **Agents**
3. Click **Create Agent**
4. Fill form and submit

You should see the new agent appear immediately.

---

## Database Migrations

Run these migrations in Supabase SQL Editor:

### Migration 003: Loan Term Editing
```sql
-- Track original vs sanctioned amounts
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
ADD COLUMN IF NOT EXISTS original_rate NUMERIC,
ADD COLUMN IF NOT EXISTS original_tenure INTEGER;
```

---

## Implemented Features

### ✅ Phase 1: Agent Management CRUD
- Create agents with auto-generated credentials
- Edit agent personal details
- Delete agents (with confirmation dialog)
- Validation and error handling

### ✅ Phase 2: Edit Loan Terms
- Modify loan amount, rate, and tenure
- Track original vs sanctioned values
- Real-time EMI calculation
- Only editable in early stages (pre-approval)

---

## Coming Next

- 📜 Audit Trail System
- 🔔 Notifications
- 📤 Document Re-upload
- 👥 Client Management Page
