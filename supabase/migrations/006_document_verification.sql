-- Add status and feedback to loan_documents
ALTER TABLE loan_documents 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_loan_documents_status ON loan_documents(status);

-- RLS: Agents can update documents if they created the loan (or if it's their client)
-- Existing policies might cover insert/select, but we need to ensure they can UPDATE re-uploads
-- For now, we'll rely on existing policies or add specific ones if needed.
-- Let's ensure agents can update their own documents if rejected.

CREATE POLICY "Agents can update rejected documents" ON loan_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN clients c ON la.client_id = c.client_id
      WHERE la.loan_id = loan_documents.loan_id
      AND c.onboarding_agent_id = auth.uid()
    )
    AND status = 'REJECTED'
  );
