-- 018_add_client_details.sql
-- Add lead fields to clients table so data is not lost on conversion

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS constitution TEXT,
ADD COLUMN IF NOT EXISTS industry_type TEXT,
ADD COLUMN IF NOT EXISTS nature_of_business TEXT,
ADD COLUMN IF NOT EXISTS property_details TEXT,
ADD COLUMN IF NOT EXISTS ownership_type TEXT,
ADD COLUMN IF NOT EXISTS regular_it TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
