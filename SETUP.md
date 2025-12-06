# 🚀 Super Simple Setup (3 Steps)

## Problem: "relation 'app_users' does not exist"
**Solution**: You need to create the tables first!

---

## Step-by-Step Instructions

### Step 1: Create Tables in Supabase

1. Go to **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. **Copy and paste** this entire script:

```sql
-- Create all tables
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AGENT')),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  kyc_document_url TEXT,
  onboarding_agent_id UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotations (
  quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(client_id),
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure INTEGER NOT NULL,
  final_amount NUMERIC NOT NULL,
  is_high_value BOOLEAN DEFAULT FALSE,
  pdf_document_url TEXT,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.app_users(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_details JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loan_applications (
  loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(client_id),
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure INTEGER NOT NULL,
  process_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

6. Click **"Run"** → You should see "Success. No rows returned"

---

### Step 2: Create Users in Supabase Auth

1. Click **"Authentication"** in the left sidebar
2. Click **"Users"** tab
3. Click **"Add user"** button (top right)

**Create Admin:**
- Email: `admin@finflow.com`
- Password: `password123`
- ✅ Check "Auto Confirm User"
- Click "Create user"
- **📋 COPY THE UUID** (it looks like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Create Agent:**
- Click "Add user" again
- Email: `agent@finflow.com`
- Password: `password123`
- ✅ Check "Auto Confirm User"
- Click "Create user"
- **📋 COPY THE UUID**

---

### Step 3: Link Users to App

1. Go back to **"SQL Editor"**
2. Click **"New Query"**
3. **Replace the UUIDs** in this script with the ones you copied:

```sql
-- PASTE ADMIN UUID BELOW (replace the entire string in quotes)
INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
VALUES (
  'PASTE-ADMIN-UUID-HERE',
  'ADMIN',
  'Admin User',
  '9876543210',
  'admin@finflow.com'
);

-- PASTE AGENT UUID BELOW (replace the entire string in quotes)
INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
VALUES (
  'PASTE-AGENT-UUID-HERE',
  'AGENT',
  'Field Agent',
  '9876543211',
  'agent@finflow.com'
);
```

4. Click **"Run"**

---

### Step 4: Create Storage Bucket

1. Click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"**
3. Name: `documents`
4. Make it **Public** ✅
5. Click **"Create bucket"**

---

## ✅ You're Done! Now Login

Go to http://localhost:3000 and login:

**Admin:**
- Email: `admin@finflow.com`
- Password: `password123`

**Agent:**
- Email: `agent@finflow.com`
- Password: `password123`

---

## 🐛 Still Having Issues?

### Error: "Invalid login credentials"
- Make sure you checked "Auto Confirm User" when creating users
- Double-check email and password

### Error: "duplicate key value violates unique constraint"
- You already added this user. Try logging in!

### Check if everything is set up:
Run this in SQL Editor:
```sql
SELECT * FROM public.app_users;
```
You should see 2 users (admin and agent).

---

## 📁 Quick Reference Files

- Full setup: `QUICKSTART.md`
- Table creation: `supabase/setup/001_create_tables.sql`
- Add users: `supabase/setup/002_add_users.sql`
- Security: `README_RLS.md` (optional, for later)

Need more help? Check `README.md`!
