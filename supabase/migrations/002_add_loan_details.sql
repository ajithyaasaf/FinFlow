-- Add missing columns for business logic
ALTER TABLE public.loan_applications 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS disbursement_reference TEXT;
