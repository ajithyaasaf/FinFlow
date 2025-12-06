-- FinFlow Database Security: Row Level Security Policies
-- WARNING: Run this AFTER creating all tables in Supabase
-- This migration enables RLS and creates policies for data isolation

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- APP_USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON app_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- CLIENTS TABLE POLICIES
-- ============================================================================

-- Agents can SELECT only clients they onboarded
CREATE POLICY "Agents view own clients" ON clients
  FOR SELECT USING (
    auth.uid() = onboarding_agent_id
  );

-- Agents can INSERT clients (onboarding_agent_id will be set to their ID)
CREATE POLICY "Agents can onboard clients" ON clients
  FOR INSERT WITH CHECK (
    auth.uid() = onboarding_agent_id
  );

-- Admins have full access to all clients
CREATE POLICY "Admins full access to clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- LOAN_APPLICATIONS TABLE POLICIES
-- ============================================================================

-- Agents can view loan applications for their own clients
CREATE POLICY "Agents view own client loans" ON loan_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.client_id = loan_applications.client_id
      AND clients.onboarding_agent_id = auth.uid()
    )
  );

-- Agents can create loan applications for their own clients
CREATE POLICY "Agents create loans for own clients" ON loan_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.client_id = loan_applications.client_id
      AND clients.onboarding_agent_id = auth.uid()
    )
  );

-- Only admins can update loan process stages
CREATE POLICY "Admins update loan stages" ON loan_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can view all loan applications
CREATE POLICY "Admins view all loans" ON loan_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- QUOTATIONS TABLE POLICIES
-- ============================================================================

-- Agents can view their own quotations
CREATE POLICY "Agents view own quotations" ON quotations
  FOR SELECT USING (
    auth.uid() = created_by
  );

-- Agents can create quotations for their own clients
CREATE POLICY "Agents create quotations for own clients" ON quotations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.client_id = quotations.client_id
      AND clients.onboarding_agent_id = auth.uid()
    )
  );

-- Admins can view all quotations (especially high-value ones)
CREATE POLICY "Admins view all quotations" ON quotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can update quotations
CREATE POLICY "Admins update quotations" ON quotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- ATTENDANCE_LOGS TABLE POLICIES
-- ============================================================================

-- Agents can view only their own attendance logs
CREATE POLICY "Agents view own attendance" ON attendance_logs
  FOR SELECT USING (
    auth.uid() = agent_id
  );

-- Agents can insert their own attendance
CREATE POLICY "Agents create own attendance" ON attendance_logs
  FOR INSERT WITH CHECK (
    auth.uid() = agent_id
  );

-- Admins can view all attendance logs
CREATE POLICY "Admins view all attendance" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- STORAGE POLICIES (For Supabase Storage 'documents' bucket)
-- ============================================================================
-- Note: These need to be created in Supabase Dashboard > Storage > Policies

-- Policy Name: "Users can upload to their own folders"
-- Allowed operation: INSERT
-- Policy definition:
-- (bucket_id = 'documents'::text) AND 
-- (auth.uid()::text = (storage.foldername(name))[1])

-- Policy Name: "Users can view their own files"
-- Allowed operation: SELECT
-- Policy definition:
-- (bucket_id = 'documents'::text) AND 
-- (auth.uid()::text = (storage.foldername(name))[1])

-- Policy Name: "Admins can view all files"
-- Allowed operation: SELECT
-- Policy definition:
-- (bucket_id = 'documents'::text) AND 
-- EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
