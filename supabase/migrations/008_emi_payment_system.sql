-- ============================================================================
-- EMI Payment & Top-Up System - Complete Database Schema
-- ============================================================================
-- Run this in Supabase SQL Editor after creating tables
-- This migration adds EMI tracking, payment management, and top-up features

-- ============================================================================
-- 1. EMI SCHEDULE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS emi_schedule (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
  emi_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  emi_amount NUMERIC(12, 2) NOT NULL,
  principal_component NUMERIC(12, 2) NOT NULL,
  interest_component NUMERIC(12, 2) NOT NULL,
  outstanding_principal NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL')),
  paid_date TIMESTAMP WITH TIME ZONE,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  late_fee NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_loan_emi UNIQUE (loan_id, emi_number)
);

-- ============================================================================
-- 2. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES emi_schedule(schedule_id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS')),
  reference_number TEXT,
  collected_by UUID REFERENCES app_users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. SYSTEM SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES app_users(id)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('late_fee_config', 
 '{"days_grace": 3, "fee_percentage": 2, "min_fee": 100, "max_fee": 1000}'::jsonb,
 'Late payment fee configuration'),
('topup_rules', 
 '{"min_emis_paid": 6, "min_principal_repaid_pct": 30, "max_topup_multiplier": 0.8, "notification_frequency_days": 30}'::jsonb,
 'Top-up loan eligibility rules')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 4. TOP-UP OFFERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS topup_offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  offered_amount NUMERIC(12, 2) NOT NULL CHECK (offered_amount > 0),
  eligibility_details JSONB NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. UPDATE LOAN_APPLICATIONS TABLE
-- ============================================================================
-- Add disbursement date if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_applications' AND column_name = 'disbursement_date'
  ) THEN
    ALTER TABLE loan_applications ADD COLUMN disbursement_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_emi_schedule_loan ON emi_schedule(loan_id);
CREATE INDEX IF NOT EXISTS idx_emi_schedule_due_date ON emi_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_emi_schedule_status ON emi_schedule(status);
CREATE INDEX IF NOT EXISTS idx_emi_schedule_status_due_date ON emi_schedule(status, due_date);

CREATE INDEX IF NOT EXISTS idx_payments_loan ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_schedule ON payments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_topup_offers_client ON topup_offers(client_id);
CREATE INDEX IF NOT EXISTS idx_topup_offers_loan ON topup_offers(loan_id);
CREATE INDEX IF NOT EXISTS idx_topup_offers_status ON topup_offers(status);
CREATE INDEX IF NOT EXISTS idx_topup_offers_expires ON topup_offers(expires_at) WHERE status = 'PENDING';

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE emi_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_offers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES FOR EMI_SCHEDULE
-- ============================================================================

-- Agents can view EMI schedule for their clients' loans
CREATE POLICY "Agents view own client EMI schedules" ON emi_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN clients c ON c.client_id = la.client_id
      WHERE la.loan_id = emi_schedule.loan_id
      AND c.onboarding_agent_id = auth.uid()
    )
  );

-- Admins can view and manage all EMI schedules
CREATE POLICY "Admins manage all EMI schedules" ON emi_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================================================
-- 9. RLS POLICIES FOR PAYMENTS
-- ============================================================================

-- Agents can view payments for their clients' loans
CREATE POLICY "Agents view own client payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN clients c ON c.client_id = la.client_id
      WHERE la.loan_id = payments.loan_id
      AND c.onboarding_agent_id = auth.uid()
    )
  );

-- Admins can insert and view all payments
CREATE POLICY "Admins manage all payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================================================
-- 10. RLS POLICIES FOR SYSTEM_SETTINGS
-- ============================================================================

-- Only admins can view settings
CREATE POLICY "Admins view settings" ON system_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Only admins can update settings
CREATE POLICY "Admins update settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================================================
-- 11. RLS POLICIES FOR TOPUP_OFFERS
-- ============================================================================

-- Agents can view top-up offers for their clients
CREATE POLICY "Agents view own client topup offers" ON topup_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.client_id = topup_offers.client_id
      AND c.onboarding_agent_id = auth.uid()
    )
  );

-- Admins can manage all top-up offers
CREATE POLICY "Admins manage all topup offers" ON topup_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================================================
-- 12. CREATE HELPFUL VIEWS
-- ============================================================================

-- View for loan payment summary
CREATE OR REPLACE VIEW loan_payment_summary AS
SELECT 
  la.loan_id,
  la.client_id,
  la.amount as loan_amount,
  la.process_stage,
  la.disbursement_date,
  COUNT(es.schedule_id) as total_emis,
  COUNT(CASE WHEN es.status = 'PAID' THEN 1 END) as paid_emis,
  COUNT(CASE WHEN es.status = 'OVERDUE' THEN 1 END) as overdue_emis,
  COUNT(CASE WHEN es.status = 'PENDING' THEN 1 END) as pending_emis,
  COALESCE(SUM(CASE WHEN es.status = 'PAID' THEN es.principal_component ELSE 0 END), 0) as principal_paid,
  COALESCE(MAX(es.outstanding_principal) FILTER (WHERE es.status != 'PAID'), la.amount) as outstanding_principal,
  MIN(CASE WHEN es.status = 'PENDING' OR es.status = 'OVERDUE' THEN es.due_date END) as next_due_date
FROM loan_applications la
LEFT JOIN emi_schedule es ON la.loan_id = es.loan_id
WHERE la.process_stage = 'Disbursed'
GROUP BY la.loan_id, la.client_id, la.amount, la.process_stage, la.disbursement_date;

-- ============================================================================
-- 13. CREATE FUNCTIONS
-- ============================================================================

-- Function to automatically mark overdue EMIs
CREATE OR REPLACE FUNCTION mark_overdue_emis()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE emi_schedule
  SET status = 'OVERDUE', updated_at = NOW()
  WHERE status = 'PENDING' 
    AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update outstanding principal on payment
CREATE OR REPLACE FUNCTION update_outstanding_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update subsequent EMIs' outstanding principal
  UPDATE emi_schedule
  SET outstanding_principal = outstanding_principal - NEW.principal_component
  WHERE loan_id = NEW.loan_id 
    AND emi_number > NEW.emi_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment updates
DROP TRIGGER IF EXISTS trigger_update_outstanding ON emi_schedule;
CREATE TRIGGER trigger_update_outstanding
  AFTER UPDATE OF status ON emi_schedule
  FOR EACH ROW
  WHEN (NEW.status = 'PAID' AND OLD.status != 'PAID')
  EXECUTE FUNCTION update_outstanding_on_payment();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ EMI Payment & Top-Up System migration completed successfully!';
  RAISE NOTICE 'Tables created: emi_schedule, payments, system_settings, topup_offers';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'RLS policies enabled for data security';
  RAISE NOTICE 'Helper views and functions created';
END $$;
