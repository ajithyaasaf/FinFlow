-- Migration: Add converted_to_loan_id to quotations table
-- This tracks which quotations have been converted to loans

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS converted_to_loan_id UUID REFERENCES loan_applications(loan_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotations_converted_to_loan_id 
ON quotations(converted_to_loan_id);

-- Comment for documentation
COMMENT ON COLUMN quotations.converted_to_loan_id IS 
'References the loan application created from this quotation. NULL if not yet converted.';
