-- ============================================
-- Table: admin_fees (commission tracking → Stripe)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  source TEXT NOT NULL,                          -- 'crypto_achat', 'crypto_vente', etc.
  montant NUMERIC(12,2) NOT NULL,
  transaction_ref TEXT,
  stripe_payment_id TEXT,
  stripe_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_admin_fees_status ON admin_fees(stripe_status);
CREATE INDEX IF NOT EXISTS idx_admin_fees_created ON admin_fees(created_at DESC);

-- RLS
ALTER TABLE admin_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access admin_fees" ON admin_fees
  FOR ALL USING (true) WITH CHECK (true);
