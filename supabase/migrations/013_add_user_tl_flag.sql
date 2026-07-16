-- Migration: Add is_tl column to app_users table
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS is_tl BOOLEAN DEFAULT false;
