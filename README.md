# FinFlow - Loan Management System

A production-ready, mobile-responsive web application for micro-finance management built with Next.js 14, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase project created
- Database tables set up (see Database Setup below)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Database Setup

### Step 1: Create Tables in Supabase

Run these SQL commands in your Supabase SQL Editor:

```sql
-- app_users table
CREATE TABLE app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AGENT')),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- clients table
CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  kyc_document_url TEXT,
  onboarding_agent_id UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- loan_applications table
CREATE TABLE loan_applications (
  loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(client_id),
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure INTEGER NOT NULL,
  process_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- quotations table
CREATE TABLE quotations (
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

-- attendance_logs table
CREATE TABLE attendance_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES app_users(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_details JSONB NOT NULL
);
```

### Step 2: Enable Row Level Security (CRITICAL!)

Run the RLS migration:

```bash
# See supabase/migrations/001_enable_rls.sql
```

Copy the entire contents of `supabase/migrations/001_enable_rls.sql` and run it in Supabase SQL Editor.

**📖 Full instructions:** See [README_RLS.md](./README_RLS.md)

### Step 3: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `documents`
3. Set it to **Public** or configure RLS policies

### Step 4: Create Test Users

In Supabase Dashboard → Authentication → Users, create two users:

**Admin User:**
- Email: `admin@finflow.com`
- Password: `password`

Then run in SQL Editor:
```sql
INSERT INTO app_users (id, role, full_name, mobile_number, email)
VALUES (
  '[COPY USER UUID FROM AUTH.USERS]',
  'ADMIN',
  'Admin User',
  '9876543210',
  'admin@finflow.com'
);
```

**Agent User:**
- Email: `agent@finflow.com`
- Password: `password`

Then run:
```sql
INSERT INTO app_users (id, role, full_name, mobile_number, email)
VALUES (
  '[COPY USER UUID FROM AUTH.USERS]',
  'AGENT',
  'Field Agent',
  '9876543211',
  'agent@finflow.com'
);
```

---

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Forms:** React Hook Form + Zod
- **PDF:** @react-pdf/renderer
- **Icons:** Lucide React

### Key Features
✅ **Row Level Security** - Data isolation between agents  
✅ **PWA Support** - Installable mobile app experience  
✅ **Role-Based Routing** - Automatic redirection based on user role  
✅ **Offline Support** - Service Worker for caching  
✅ **Type Safety** - Strict TypeScript throughout  

---

## 📱 Implementation Status

### ✅ Phase 1: Setup & Authentication - COMPLETE
- Next.js 14 with TypeScript strict mode
- Supabase client configuration
- Row Level Security (RLS) migration
- Authentication with role-based routing
- PWA configuration (manifest + service worker)
- File storage utilities

### ✅ Phase 2: Agent Mobile PWA - COMPLETE
- Client onboarding with KYC upload
- Quotation calculator with PDF generation
- High-value detection (>₹10L or <12% rate)
- GPS-based attendance with selfie capture
- Bottom navigation bar
- Mobile-first responsive design

### ✅ Phase 3: Admin Dashboard - COMPLETE
- Desktop dashboard with sidebar
- KPI cards (Total Loans, Active Agents, Pending Approvals)
- High-value quotations monitoring widget
- Sidebar navigation
- Placeholder pages for Loans, Agents, Reports

---

## 📊 Features Implemented

### Agent Features (Mobile PWA)
1. **Client Onboarding**
   - Add clients with name and mobile number
   - Upload KYC documents (Aadhaar/PAN)
   - View only own clients (RLS enforced)
   - Quick link to create quotations

2. **Quotation Calculator**
   - Real-time EMI calculation
   - Automatic high-value flagging
   - Professional PDF generation
   - Client-side rendering for offline support
   - Payment breakdown with processing fees

3. **Attendance System**
   - GPS location capture
   - Selfie verification
   - JSONB storage format
   - Permission error handling

### Admin Features (Desktop Dashboard)
1. **Dashboard Home**
   - KPI cards with live statistics
   - High-value quotations widget
   - Alert badges for review items

2. **Navigation**
   - Sidebar with section links
   - Active state highlighting
   - Easy sign-out

---

## 🎯 What's Built: Complete Feature List
- [x] Next.js project setup with TypeScript
- [x] Tailwind CSS + Shadcn/UI configuration
- [x] Supabase client (browser + server)
- [x] TypeScript types for all database tables
- [x] Row Level Security (RLS) migration SQL
- [x] Authentication system with login page
- [x] Role-based middleware routing
- [x] PWA configuration (manifest + service worker)
- [x] App icons (192x192 and 512x512)
- [x] File upload utilities
- [x] Basic agent dashboard placeholder
- [x] Basic admin dashboard placeholder

### What's Next (Phase 2):
- [ ] Agent: Client onboarding form
- [ ] Agent: KYC document upload
- [ ] Agent: Quotation calculator
- [ ] Agent: High-value detection logic
- [ ] Agent: PDF generation
- [ ] Agent: Attendance check-in with GPS
- [ ] Agent: Selfie capture and upload
- [ ] Agent: Bottom navigation bar

---

## 🧪 Testing

### Run Type Check
```bash
npm run type-check
```

### Build for Production
```bash
npm run build
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] RLS policies are enabled on ALL tables
- [ ] Storage bucket has RLS policies
- [ ] Test agent data isolation (Agent A can't see Agent B's data)
- [ ] Test admin access (Admin can see all data)
- [ ] Environment variables are set in production
- [ ] `.env.local` is in `.gitignore`

---

## 📖 Documentation

- [Implementation Plan](./C:/Users/Godivatech/.gemini/antigravity/brain/f464b072-5f07-4967-a38c-a803bef78266/implementation_plan.md)
- [Row Level Security Guide](./README_RLS.md)
- [Task Checklist](./C:/Users/Godivatech/.gemini/antigravity/brain/f464b072-5f07-4967-a38c-a803bef78266/task.md)

---

## 🆘 Common Issues

### "Invalid JWT" error
- Make sure you've created users in Supabase Auth
- Ensure users exist in `app_users` table with matching `id`

### "Permission denied" error
- RLS policies not enabled - run the migration
- Check user's role in `app_users` table

### PWA not installing
- Serve over HTTPS (or localhost)
- Check manifest.json is accessible
- Verify service worker is registered in DevTools

---

## 📞 Support

For issues or questions:
1. Check [README_RLS.md](./README_RLS.md) for security setup
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for errors

---

Built with ❤️ using Next.js, TypeScript, and Supabase
