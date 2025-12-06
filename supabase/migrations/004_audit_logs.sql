-- Create audit trail table for tracking all system changes
CREATE TABLE IF NOT EXISTS system_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id),
  action_type TEXT NOT NULL, -- 'LOGIN', 'LOAN_STATUS_CHANGE', 'LOAN_TERMS_EDIT', 'AGENT_CREATED', etc.
  entity_type TEXT NOT NULL, -- 'LOAN', 'AGENT', 'CLIENT', 'USER'
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);

-- RLS policies for system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all logs
CREATE POLICY "Admins can view all logs" ON system_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'ADMIN'
    )
  );

-- Only backend can insert logs (via service role)
CREATE POLICY "Only service role can insert logs" ON system_logs
  FOR INSERT
  WITH CHECK (false); -- Must use service role key

COMMENT ON TABLE system_logs IS 'Audit trail for tracking all critical system changes';
