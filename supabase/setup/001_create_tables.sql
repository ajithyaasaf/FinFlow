-- ============================================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will create all the tables you need for FinFlow

-- 1. app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AGENT')),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. clients table
CREATE TABLE IF NOT EXISTS public.clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  kyc_document_url TEXT,
  onboarding_agent_id UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. quotations table
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

-- 4. attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.app_users(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_details JSONB NOT NULL
);

-- 5. loan_applications table
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

-- ============================================================================
-- SUCCESS! Tables created. Now you can proceed to add users.
-- ============================================================================
