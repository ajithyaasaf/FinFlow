-- Migration: Add status column to app_users table
-- Run this in your Supabase SQL Editor to support enabling/disabling staff members.

ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'));
