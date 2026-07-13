-- ============================================================================
-- Migration: 011_logins_hub.sql
-- Description: Adds region, TL, and expanded DSA process stages to loan_applications
--              for the Logins Hub dashboard feature.
-- ============================================================================

-- Add region column (Madurai / Tenkasi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loan_applications' AND column_name = 'region'
  ) THEN
    ALTER TABLE public.loan_applications ADD COLUMN region TEXT DEFAULT 'Madurai';
  END IF;
END $$;

-- Add assigned_tl_id (Team Leader — any app_user, typically ADMIN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loan_applications' AND column_name = 'assigned_tl_id'
  ) THEN
    ALTER TABLE public.loan_applications
      ADD COLUMN assigned_tl_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add disbursement_type to distinguish New vs Repeat disbursals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loan_applications' AND column_name = 'disbursement_type'
  ) THEN
    ALTER TABLE public.loan_applications
      ADD COLUMN disbursement_type TEXT CHECK (disbursement_type IN ('New', 'Repeat', 'Spill Over')) DEFAULT 'New';
  END IF;
END $$;

-- Add sanctioned_amount (may differ from approved amount)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loan_applications' AND column_name = 'sanctioned_amount'
  ) THEN
    ALTER TABLE public.loan_applications ADD COLUMN sanctioned_amount NUMERIC;
  END IF;
END $$;
