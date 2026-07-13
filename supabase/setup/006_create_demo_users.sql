-- ============================================================================
-- STEP 6: CREATE DEMO USERS (UPDATED)
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor.
-- This automatically creates the default credentials (MD, Admin, Staff) in both
-- auth.users and public.app_users, and sets non-nullable fields to prevent
-- "Database error querying schema" errors from Supabase.

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix any existing users with NULL in the token/email_change columns
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE 
  confirmation_token IS NULL 
  OR email_change IS NULL 
  OR email_change_token_new IS NULL 
  OR recovery_token IS NULL;

DO $$
DECLARE
  md_id UUID := gen_random_uuid();
  admin_id UUID := gen_random_uuid();
  staff_id UUID := gen_random_uuid();
BEGIN
  -- 1. MD USER: md@finflow.com / password123
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'md@finflow.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      md_id,
      '00000000-0000-0000-0000-000000000000',
      'md@finflow.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Managing Director"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '', '', '', ''
    );

    INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
    VALUES (md_id, 'MD', 'Managing Director', '9876543212', 'md@finflow.com')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. ADMIN USER: admin@finflow.com / password123
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@finflow.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@finflow.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '', '', '', ''
    );

    INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
    VALUES (admin_id, 'ADMIN', 'Admin User', '9876543210', 'admin@finflow.com')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 3. STAFF USER: staff01@finflow.com / password123
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'staff01@finflow.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      staff_id,
      '00000000-0000-0000-0000-000000000000',
      'staff01@finflow.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Staff"}',
      'authenticated',
      'authenticated',
      now(),
      now(),
      '', '', '', ''
    );

    INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
    VALUES (staff_id, 'STAFF', 'Staff', '9876543211', 'staff01@finflow.com')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Demo users created successfully in both Auth and App Users tables!';
END $$;
