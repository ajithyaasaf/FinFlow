-- ============================================================================
-- STEP 2: ADD TEST USERS
-- ============================================================================
-- Run this AFTER Step 1 (creating tables) AND after creating users in Supabase Auth

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
-- 2. Create admin@finflow.com with password: password123
-- 3. Create agent@finflow.com with password: password123
-- 4. Copy each user's UUID from the dashboard
-- 5. Replace the UUIDs below and run this script

-- ============================================================================
-- REPLACE THESE UUIDs WITH THE ACTUAL UUIDs FROM YOUR USERS
-- ============================================================================

-- Admin User
INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
VALUES (
  'REPLACE-WITH-ADMIN-UUID-FROM-AUTH-USERS',  -- 👈 PASTE ADMIN UUID HERE
  'ADMIN',
  'Admin User',
  '9876543210',
  'admin@finflow.com'
);

-- MD User
INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
VALUES (
  'REPLACE-WITH-MD-UUID-FROM-AUTH-USERS',  -- 👈 PASTE MD UUID HERE
  'MD',
  'Managing Director',
  '9876543212',
  'md@finflow.com'
);

-- Staff User
INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
VALUES (
  'REPLACE-WITH-STAFF-UUID-FROM-AUTH-USERS',  -- 👈 PASTE STAFF UUID HERE
  'STAFF',
  'Field Staff',
  '9876543211',
  'staff01@finflow.com'
);

-- ============================================================================
-- SUCCESS! Users created. You can now login!
-- ============================================================================
