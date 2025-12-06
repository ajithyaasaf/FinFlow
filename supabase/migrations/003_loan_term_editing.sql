-- Track original vs sanctioned loan amounts for transparency
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
ADD COLUMN IF NOT EXISTS original_rate NUMERIC,
ADD COLUMN IF NOT EXISTS original_tenure INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN loan_applications.original_amount IS 'Original amount requested by client/agent';
COMMENT ON COLUMN loan_applications.amount IS 'Sanctioned amount approved by admin';
COMMENT ON COLUMN loan_applications.original_rate IS 'Original interest rate from quotation';
COMMENT ON COLUMN loan_applications.interest_rate IS 'Final approved interest rate';
COMMENT ON COLUMN loan_applications.original_tenure IS 'Original tenure requested';
COMMENT ON COLUMN loan_applications.tenure IS 'Final approved tenure';
