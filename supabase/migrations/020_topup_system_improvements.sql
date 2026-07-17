-- ============================================================================
-- Top-Up System Improvements Migration
-- Fixes gaps: VOIDED status, assigned_agent_id, partial pre-payment rule,
--             expiry enforcement, walk-in collision protection
-- ============================================================================

-- 1. Add VOIDED status to topup_offers and assigned_agent_id column
DO $$
BEGIN
  -- Add VOIDED to the check constraint by dropping and re-creating it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'topup_offers' AND constraint_name = 'topup_offers_status_check'
  ) THEN
    ALTER TABLE topup_offers DROP CONSTRAINT topup_offers_status_check;
  END IF;

  ALTER TABLE topup_offers 
    ADD CONSTRAINT topup_offers_status_check 
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'VOIDED'));

  -- Add assigned_agent_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'topup_offers' AND column_name = 'assigned_agent_id'
  ) THEN
    ALTER TABLE topup_offers 
      ADD COLUMN assigned_agent_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
  END IF;

  -- Add voided_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'topup_offers' AND column_name = 'voided_at'
  ) THEN
    ALTER TABLE topup_offers ADD COLUMN voided_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add void_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'topup_offers' AND column_name = 'void_reason'
  ) THEN
    ALTER TABLE topup_offers ADD COLUMN void_reason TEXT;
  END IF;

END $$;

-- 2. Index for agent-filtered queries
CREATE INDEX IF NOT EXISTS idx_topup_offers_agent ON topup_offers(assigned_agent_id) WHERE status = 'PENDING';

-- 3. Database function: Auto-void pending top-up offers when a new loan is created for the same client
--    This handles the "Walk-in Collision" scenario
CREATE OR REPLACE FUNCTION void_pending_topup_offers_on_new_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new loan application is inserted, void any PENDING top-up offers for that client
  UPDATE topup_offers
  SET 
    status = 'VOIDED',
    voided_at = NOW(),
    void_reason = 'Client self-applied or agent created a new loan directly.',
    updated_at = NOW()
  WHERE 
    client_id = NEW.client_id
    AND status = 'PENDING';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to loan_applications
DROP TRIGGER IF EXISTS trigger_void_topup_on_new_loan ON loan_applications;
CREATE TRIGGER trigger_void_topup_on_new_loan
  AFTER INSERT ON loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION void_pending_topup_offers_on_new_loan();

-- 4. Database function: Mark expired top-up offers (used by cron job)
CREATE OR REPLACE FUNCTION mark_expired_topup_offers()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE topup_offers
  SET status = 'EXPIRED', updated_at = NOW()
  WHERE status = 'PENDING' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Update system_settings to include partial pre-payment rule
UPDATE system_settings
SET setting_value = '{
  "min_emis_paid": 6, 
  "min_principal_repaid_pct": 30, 
  "max_topup_multiplier": 0.8, 
  "notification_frequency_days": 30,
  "partial_prepayment_threshold_pct": 50
}'::jsonb
WHERE setting_key = 'topup_rules';

-- 6. Update RLS policy to allow agents to see only their assigned offers
DROP POLICY IF EXISTS "Agents view own client topup offers" ON topup_offers;

CREATE POLICY "Agents view assigned topup offers" ON topup_offers
  FOR SELECT USING (
    assigned_agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clients c
      WHERE c.client_id = topup_offers.client_id
      AND c.onboarding_agent_id = auth.uid()
    )
  );

-- Allow agents to UPDATE topup offers (to accept/reject)
DROP POLICY IF EXISTS "Agents update their topup offers" ON topup_offers;
CREATE POLICY "Agents update their topup offers" ON topup_offers
  FOR UPDATE USING (
    assigned_agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clients c
      WHERE c.client_id = topup_offers.client_id
      AND c.onboarding_agent_id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Top-Up System Improvements migration completed!';
  RAISE NOTICE 'Changes: VOIDED status, assigned_agent_id, walk-in collision trigger, expiry function, partial pre-payment rule.';
END $$;
