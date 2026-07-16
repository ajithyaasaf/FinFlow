-- 019_add_lead_identity_fields.sql
-- Add PAN and Aadhaar to leads table so it can be collected initially

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
