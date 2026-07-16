-- 016_update_activities_rls.sql
-- Allow users to view activities that are linked to leads or clients they own

DROP POLICY IF EXISTS "TLs can view team activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities; -- if it exists

-- Combined policy for SELECT:
-- 1. If assigned_agent_id is them or their team members
-- 2. OR if the activity is linked to a lead that belongs to them or their team members
CREATE POLICY "Users and TLs can view relevant activities" ON public.activities
  FOR SELECT TO authenticated USING (
    -- 1. Direct assignment to self or team
    assigned_agent_id = auth.uid() OR
    assigned_agent_id IN (SELECT id FROM public.app_users WHERE tl_id = auth.uid())
    OR
    -- 2. Lead assignment to self or team
    related_lead_id IN (
        SELECT lead_id FROM public.leads WHERE 
        assigned_agent_id = auth.uid() OR 
        assigned_agent_id IN (SELECT id FROM public.app_users WHERE tl_id = auth.uid())
    )
    OR
    -- 3. Client assignment to self or team
    related_client_id IN (
        SELECT client_id FROM public.clients WHERE 
        onboarding_agent_id = auth.uid() OR 
        onboarding_agent_id IN (SELECT id FROM public.app_users WHERE tl_id = auth.uid())
    )
  );

-- 2. Give MD and Admin full access to everything (Leads and Activities)
DROP POLICY IF EXISTS "Admins full access to activities" ON public.activities;
DROP POLICY IF EXISTS "Admins and MD full access to activities" ON public.activities;

CREATE POLICY "Admins and MD full access to activities" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
    )
  );

DROP POLICY IF EXISTS "Admins full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Admins and MD full access to leads" ON public.leads;

CREATE POLICY "Admins and MD full access to leads" ON public.leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
    )
  );
