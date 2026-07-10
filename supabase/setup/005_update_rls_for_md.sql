-- ============================================================================
-- STEP 5: GRANT MD ACCESS TO RLS POLICIES (ROBUST VERSION)
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor.
-- This updates Row Level Security (RLS) policies conditionally. It checks if
-- each table exists before trying to modify its policies, avoiding syntax or 
-- relation errors if some migrations haven't been applied yet.

DO $$
BEGIN
  -- 1. APP_USERS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_users') THEN
    DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
    CREATE POLICY "Admins and MD can view all users" ON public.app_users
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 2. CLIENTS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    DROP POLICY IF EXISTS "Admins full access to clients" ON public.clients;
    CREATE POLICY "Admins and MD full access to clients" ON public.clients
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 3. LOAN_APPLICATIONS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loan_applications') THEN
    DROP POLICY IF EXISTS "Admins update loan stages" ON public.loan_applications;
    CREATE POLICY "Admins and MD update loan stages" ON public.loan_applications
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );

    DROP POLICY IF EXISTS "Admins view all loans" ON public.loan_applications;
    CREATE POLICY "Admins and MD view all loans" ON public.loan_applications
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 4. QUOTATIONS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotations') THEN
    DROP POLICY IF EXISTS "Admins view all quotations" ON public.quotations;
    CREATE POLICY "Admins and MD view all quotations" ON public.quotations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );

    DROP POLICY IF EXISTS "Admins update quotations" ON public.quotations;
    CREATE POLICY "Admins and MD update quotations" ON public.quotations
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 5. ATTENDANCE_LOGS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance_logs') THEN
    DROP POLICY IF EXISTS "Admins view all attendance" ON public.attendance_logs;
    CREATE POLICY "Admins and MD view all attendance" ON public.attendance_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 6. SYSTEM_LOGS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_logs') THEN
    DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;
    CREATE POLICY "Admins and MD can view all logs" ON public.system_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE app_users.id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 7. EMI_SCHEDULE TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emi_schedule') THEN
    DROP POLICY IF EXISTS "Admins manage all EMI schedules" ON public.emi_schedule;
    CREATE POLICY "Admins and MD manage all EMI schedules" ON public.emi_schedule
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 8. PAYMENTS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DROP POLICY IF EXISTS "Admins manage all payments" ON public.payments;
    CREATE POLICY "Admins and MD manage all payments" ON public.payments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 9. SYSTEM_SETTINGS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    DROP POLICY IF EXISTS "Admins view settings" ON public.system_settings;
    CREATE POLICY "Admins and MD view settings" ON public.system_settings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );

    DROP POLICY IF EXISTS "Admins update settings" ON public.system_settings;
    CREATE POLICY "Admins and MD update settings" ON public.system_settings
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 10. TOPUP_OFFERS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'topup_offers') THEN
    DROP POLICY IF EXISTS "Admins manage all topup offers" ON public.topup_offers;
    CREATE POLICY "Admins and MD manage all topup offers" ON public.topup_offers
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 11. LEADS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    DROP POLICY IF EXISTS "Admins full access to leads" ON public.leads;
    CREATE POLICY "Admins and MD full access to leads" ON public.leads
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 12. BANK_PARTNERS TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bank_partners') THEN
    DROP POLICY IF EXISTS "Admins manage bank partners" ON public.bank_partners;
    CREATE POLICY "Admins and MD manage bank partners" ON public.bank_partners
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 13. ACTIVITIES TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities') THEN
    DROP POLICY IF EXISTS "Admins full access to activities" ON public.activities;
    CREATE POLICY "Admins and MD full access to activities" ON public.activities
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  -- 14. KNOWLEDGE_ARTICLES TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_articles') THEN
    DROP POLICY IF EXISTS "Admins manage articles" ON public.knowledge_articles;
    CREATE POLICY "Admins and MD manage articles" ON public.knowledge_articles
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.app_users
          WHERE id = auth.uid() AND role IN ('ADMIN', 'MD')
        )
      );
  END IF;

  RAISE NOTICE '✅ RLS policies updated successfully for existing tables!';
END $$;
