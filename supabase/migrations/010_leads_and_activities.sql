-- ============================================================================
-- Migration: 010_leads_and_activities.sql
-- Description: Adds tables for Lead Management, Bank Partners, Activities (Tasks, Calls, Reminders), and Policy Wiki.
-- ============================================================================

-- ============================================================================
-- 1. LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone_number TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED')),
  source TEXT DEFAULT 'OTHER' CHECK (source IN ('DIGITAL_MARKETING', 'COLD_CALLING', 'REFERRAL', 'WALK_IN', 'OTHER')),
  heat_level TEXT DEFAULT 'WARM' CHECK (heat_level IN ('HOT', 'WARM', 'COLD')),
  assigned_agent_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  constitution TEXT,
  industry_type TEXT,
  nature_of_business TEXT,
  property_details TEXT,
  ownership_type TEXT,
  regular_it TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. BANK PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bank_partners (
  partner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. ACTIVITIES TABLE (TASKS, CALL LOGS, REMINDERS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'TASK' CHECK (type IN ('TASK', 'REMINDER', 'CALL_LOG')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  due_date TIMESTAMP WITH TIME ZONE,
  related_lead_id UUID REFERENCES leads(lead_id) ON DELETE CASCADE,
  related_client_id UUID REFERENCES clients(client_id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. KNOWLEDGE ARTICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_articles (
  article_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. UPDATE LOAN_APPLICATIONS TABLE WITH NULLABLE BROKERAGE FIELDS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_applications' AND column_name = 'bank_partner_id'
  ) THEN
    ALTER TABLE loan_applications ADD COLUMN bank_partner_id UUID REFERENCES bank_partners(partner_id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_applications' AND column_name = 'product_name'
  ) THEN
    ALTER TABLE loan_applications ADD COLUMN product_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_applications' AND column_name = 'login_reference_number'
  ) THEN
    ALTER TABLE loan_applications ADD COLUMN login_reference_number TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_applications' AND column_name = 'original_request_date'
  ) THEN
    ALTER TABLE loan_applications ADD COLUMN original_request_date DATE;
  END IF;
END $$;

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS) & DECLARE POLICIES
-- ============================================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- 6.1 LEADS POLICIES
CREATE POLICY "Agents can view own leads" ON leads
  FOR SELECT USING (auth.uid() = assigned_agent_id);

CREATE POLICY "Agents can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = assigned_agent_id);

CREATE POLICY "Agents can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = assigned_agent_id);

CREATE POLICY "Admins full access to leads" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 6.2 BANK PARTNERS POLICIES
CREATE POLICY "All users can view bank partners" ON bank_partners
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage bank partners" ON bank_partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 6.3 ACTIVITIES POLICIES
CREATE POLICY "Agents can view own activities" ON activities
  FOR SELECT USING (auth.uid() = assigned_agent_id);

CREATE POLICY "Agents can insert activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = assigned_agent_id);

CREATE POLICY "Agents can update own activities" ON activities
  FOR UPDATE USING (auth.uid() = assigned_agent_id);

CREATE POLICY "Admins full access to activities" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 6.4 KNOWLEDGE ARTICLES POLICIES
CREATE POLICY "All users can view articles" ON knowledge_articles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage articles" ON knowledge_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
