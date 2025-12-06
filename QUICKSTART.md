# Quick Start: Create Your First Users

## ⚡ 5-Minute Setup Guide

Follow these simple steps to create test users and start using FinFlow.

---

## Step 1: Create Users in Supabase Auth

1. **Go to your Supabase project** at https://supabase.com/dashboard
2. **Click on "Authentication"** in the left sidebar
3. **Click on "Users"** tab
4. **Click "Add User"** button (top right)

### Create Admin User:
- **Email**: `admin@finflow.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅ Yes
- Click **"Create User"**

### Create Agent User:
- Click **"Add User"** again
- **Email**: `agent@finflow.com`
- **Password**: `password123`
- **Auto Confirm User**: ✅ Yes
- Click **"Create User"**

> [!IMPORTANT]
> **Copy the User IDs!** After creating each user, you'll see a UUID (something like `123e4567-e89b-12d3-a456-426614174000`). Copy these - you'll need them in Step 2.

---

## Step 2: Add Users to app_users Table

Now we need to link these users to our app with their roles.

1. **Go to "SQL Editor"** in the left sidebar
2. **Click "New Query"**
3. **Copy and paste this SQL** (replace the UUIDs with the ones you copied):

```sql
-- First, let's check if the app_users table exists
-- If you get an error, you need to create the table first (see Step 3)

-- Add the ADMIN user
INSERT INTO app_users (id, role, full_name, mobile_number, email)
VALUES (
  'PASTE-ADMIN-UUID-HERE',  -- Replace with the UUID you copied
  'ADMIN',
  'Admin User',
  '9876543210',
  'admin@finflow.com'
);

-- Add the AGENT user
INSERT INTO app_users (id, role, full_name, mobile_number, email)
VALUES (
  'PASTE-AGENT-UUID-HERE',  -- Replace with the UUID you copied
  'AGENT',
  'Field Agent',
  '9876543211',
  'agent@finflow.com'
);
```

4. **Click "Run"** button

> [!TIP]
> If you get an error saying the table doesn't exist, go to Step 3 first!

---

## Step 3: Create Tables (If Needed)

If you haven't created the database tables yet, run this SQL:

```sql
-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AGENT')),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  kyc_document_url TEXT,
  onboarding_agent_id UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(client_id),
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure INTEGER NOT NULL,
  final_amount NUMERIC NOT NULL,
  is_high_value BOOLEAN DEFAULT FALSE,
  pdf_document_url TEXT,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES app_users(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_details JSONB NOT NULL
);

-- Create loan_applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(client_id),
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure INTEGER NOT NULL,
  process_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Click **"Run"**

---

## Step 4: Create Storage Bucket

1. **Go to "Storage"** in the left sidebar
2. **Click "Create a new bucket"**
3. **Bucket name**: `documents`
4. **Public bucket**: ✅ Yes (or set up RLS policies later)
5. **Click "Create bucket"**

---

## Step 5: Login to Your App!

Now you can login! Go to http://localhost:3000

### Admin Login:
- **Email**: `admin@finflow.com`
- **Password**: `password123`
- You'll be redirected to `/dashboard`

### Agent Login:
- **Email**: `agent@finflow.com`
- **Password**: `password123`
- You'll be redirected to `/agent`

---

## 🎯 Quick Copy-Paste Commands

### Method 1: Using Supabase Dashboard (Easiest)

**After creating users in Auth > Users:**

1. Click on the admin user → Copy the ID
2. Go to SQL Editor and run:

```sql
INSERT INTO app_users (id, role, full_name, mobile_number, email)
VALUES (
  '👉 PASTE UUID HERE',
  'ADMIN',
  'Admin User',
  '9876543210',
  'admin@finflow.com'
);
```

3. Click on the agent user → Copy the ID
4. Run:

```sql
INSERT INTO app_users (id, role, full_name, mobile_number, email)
VALUES (
  '👉 PASTE UUID HERE',
  'AGENT',
  'Field Agent',
  '9876543211',
  'agent@finflow.com'
);
```

---

## ❓ Troubleshooting

### Error: "relation 'app_users' does not exist"
**Solution**: Run the SQL from Step 3 to create tables first.

### Error: "new row violates row-level security policy"
**Solution**: You need to run the RLS migration. See `README_RLS.md` OR temporarily disable RLS:
```sql
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
```

### Can't login / Invalid credentials
**Solution**: 
1. Double-check the email and password
2. Make sure you clicked "Auto Confirm User" when creating the user
3. Check that the user exists in both `auth.users` AND `app_users` tables

### Check if user exists in app_users:
```sql
SELECT * FROM app_users;
```

---

## 🚀 You're All Set!

Once you've completed these steps, you can:

✅ Login as admin → See dashboard with KPI cards  
✅ Login as agent → Add clients, create quotations, mark attendance  
✅ Test the high-value quotation detection  
✅ Generate PDF quotations  

---

## 📝 Next Steps (Optional)

1. **Run RLS Migration**: See `README_RLS.md` to enable security
2. **Add more users**: Repeat Steps 1-2 for additional agents
3. **Test the system**: Add clients, create quotations, mark attendance

Need help? Check `README.md` for the full documentation!
