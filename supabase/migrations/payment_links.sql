-- ============================================
-- Table: payment_links (Revolut-style payment links)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createur_id UUID NOT NULL REFERENCES auth.users(id),
  code TEXT NOT NULL UNIQUE,
  montant NUMERIC(12,2), -- NULL = montant libre
  devise TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'paye', 'expire', 'annule')),
  paye_par UUID REFERENCES auth.users(id),
  paye_at TIMESTAMPTZ,
  type TEXT NOT NULL DEFAULT 'request' CHECK (type IN ('request', 'send')),
  usage_unique BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- If table already exists, add column
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'request';

-- Index
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON payment_links(code);
CREATE INDEX IF NOT EXISTS idx_payment_links_createur ON payment_links(createur_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_statut ON payment_links(statut);

-- RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment links" ON payment_links
  FOR SELECT USING (auth.uid() = createur_id);

CREATE POLICY "Anyone can view active links by code" ON payment_links
  FOR SELECT USING (statut = 'actif');

CREATE POLICY "Service role full access payment_links" ON payment_links
  FOR ALL USING (true) WITH CHECK (true);
