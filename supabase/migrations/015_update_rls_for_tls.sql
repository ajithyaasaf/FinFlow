-- Migration: Update RLS policies for Team Leaders (TLs) and staff visibility

-- 1. APP_USERS Policies
-- Allow all authenticated users to view profiles of other staff members
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
DROP POLICY IF EXISTS "Admins and MD can view all users" ON public.app_users;

CREATE POLICY "Authenticated users can view app_users" ON public.app_users
  FOR SELECT TO authenticated USING (true);

-- 2. LEADS Policies
-- Allow Team Leaders to view leads assigned to their team members
DROP POLICY IF EXISTS "TLs can view team leads" ON public.leads;
CREATE POLICY "TLs can view team leads" ON public.leads
  FOR SELECT TO authenticated USING (
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "TLs can update team leads" ON public.leads;
CREATE POLICY "TLs can update team leads" ON public.leads
  FOR UPDATE TO authenticated USING (
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "TLs can insert team leads" ON public.leads;
CREATE POLICY "TLs can insert team leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

-- 3. ACTIVITIES Policies
-- Allow Team Leaders to view and update activities for their team members
DROP POLICY IF EXISTS "TLs can view team activities" ON public.activities;
CREATE POLICY "TLs can view team activities" ON public.activities
  FOR SELECT TO authenticated USING (
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "TLs can update team activities" ON public.activities;
CREATE POLICY "TLs can update team activities" ON public.activities
  FOR UPDATE TO authenticated USING (
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "TLs can insert team activities" ON public.activities;
CREATE POLICY "TLs can insert team activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

-- 4. CLIENTS Policies
-- Allow Team Leaders to view and manage clients onboarded by their team members
DROP POLICY IF EXISTS "TLs can view team clients" ON public.clients;
CREATE POLICY "TLs can view team clients" ON public.clients
  FOR SELECT TO authenticated USING (
    onboarding_agent_id = auth.uid() OR
    onboarding_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "TLs can onboard team clients" ON public.clients;
CREATE POLICY "TLs can onboard team clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (
    onboarding_agent_id = auth.uid() OR
    onboarding_agent_id IN (
      SELECT id FROM public.app_users WHERE tl_id = auth.uid()
    )
  );

-- 5. LOAN APPLICATIONS Policies
-- Allow Team Leaders to view and manage loans for clients onboarded by their team members
DROP POLICY IF EXISTS "TLs can view team client loans" ON public.loan_applications;
CREATE POLICY "TLs can view team client loans" ON public.loan_applications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.client_id = loan_applications.client_id
      AND (
        clients.onboarding_agent_id = auth.uid() OR
        clients.onboarding_agent_id IN (
          SELECT id FROM public.app_users WHERE tl_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "TLs can create loans for team clients" ON public.loan_applications;
CREATE POLICY "TLs can create loans for team clients" ON public.loan_applications
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.client_id = loan_applications.client_id
      AND (
        clients.onboarding_agent_id = auth.uid() OR
        clients.onboarding_agent_id IN (
          SELECT id FROM public.app_users WHERE tl_id = auth.uid()
        )
      )
    )
  );
