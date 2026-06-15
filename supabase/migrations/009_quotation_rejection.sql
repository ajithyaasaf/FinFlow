-- Migration: Add status and rejection_reason columns to quotations table
-- This supports rejecting agent quotations with feedback

-- Add status column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'status'
  ) THEN
    ALTER TABLE quotations ADD COLUMN status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONVERTED', 'REJECTED'));
  END IF;
END $$;

-- Add rejection_reason column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE quotations ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Update existing records: if converted_to_loan_id is not null, status should be 'CONVERTED'
UPDATE quotations 
SET status = 'CONVERTED' 
WHERE converted_to_loan_id IS NOT NULL;
