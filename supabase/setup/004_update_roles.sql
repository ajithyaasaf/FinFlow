-- ============================================================================
-- STEP 4: MIGRATE ROLES AND UPDATE CONSTRAINT
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor to update roles from AGENT to STAFF
-- and allow MD, ADMIN, and STAFF roles.

-- 1. Drop the existing check constraint on the role column
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 2. Update existing 'AGENT' users to 'STAFF'
UPDATE public.app_users SET role = 'STAFF' WHERE role = 'AGENT';

-- 3. Add the updated check constraint to allow 'ADMIN', 'MD', and 'STAFF'
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('ADMIN', 'MD', 'STAFF'));

-- 4. Check if update was successful
SELECT id, email, role, full_name FROM public.app_users;
