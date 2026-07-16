-- 017_add_activity_completed_by.sql
-- Add completed_by tracking for activities

ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS completed_by_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
