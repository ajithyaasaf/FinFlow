-- ============================================================================
-- Migration: 011_add_lead_branch.sql
-- Description: Adds branch tracking to app_users and leads tables, and sets up indexing.
-- ============================================================================

-- Add branch column to app_users if not exists
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS branch TEXT;

-- Add branch column to leads if not exists
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS branch TEXT;

-- Create indexes for optimization
CREATE INDEX IF NOT EXISTS idx_leads_branch ON public.leads(branch);

-- Comment explanations
COMMENT ON COLUMN public.app_users.branch IS 'Assigned branch location for staff management';
COMMENT ON COLUMN public.leads.branch IS 'Originating branch location where the lead was logged';
