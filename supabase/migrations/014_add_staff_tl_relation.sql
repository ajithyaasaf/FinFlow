-- Migration: Add tl_id column to app_users to link staff to Team Leaders
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS tl_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
