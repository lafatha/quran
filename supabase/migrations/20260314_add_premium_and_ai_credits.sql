-- ============================================================================
-- Premium subscription & AI credit tracking
-- ============================================================================

-- Tracks premium status per user (one row per user, upserted on payment)
CREATE TABLE IF NOT EXISTS user_premium (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at    TIMESTAMPTZ,
  mayar_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Tracks daily AI prompt usage for non-premium users
-- One row per user per date; resets implicitly by creating a new row each day
CREATE TABLE IF NOT EXISTS ai_credits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_count  INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- RLS policies
ALTER TABLE user_premium ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credits   ENABLE ROW LEVEL SECURITY;

-- Users can read their own premium status
CREATE POLICY "Users can view own premium status"
  ON user_premium FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own credits
CREATE POLICY "Users can view own ai credits"
  ON ai_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (webhooks) can insert/update premium
CREATE POLICY "Service can manage premium"
  ON user_premium FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Service role can manage credits
CREATE POLICY "Service can manage credits"
  ON ai_credits FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_credits_user_date ON ai_credits (user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_premium_user    ON user_premium (user_id);
