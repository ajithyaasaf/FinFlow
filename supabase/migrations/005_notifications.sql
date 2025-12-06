-- Create notifications table for real-time user updates
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  entity_type TEXT, -- 'LOAN', 'QUOTATION', 'CLIENT'
  entity_id UUID,
  link_url TEXT, -- Optional URL to navigate to
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only backend can create notifications (via service role)
CREATE POLICY "Only service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (false); -- Must use service role key

COMMENT ON TABLE notifications IS 'Real-time notifications for users';
