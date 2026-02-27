-- ============================================
-- Table: crypto_wallets (Bitcoin wallet per user)
-- ============================================
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  devise TEXT NOT NULL DEFAULT 'BTC',
  solde NUMERIC(18,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, devise)
);

-- ============================================
-- Table: crypto_transactions (buy/sell history)
-- ============================================
CREATE TABLE IF NOT EXISTS crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('achat', 'vente')),
  crypto_devise TEXT NOT NULL DEFAULT 'BTC',
  montant_crypto NUMERIC(18,8) NOT NULL,
  montant_eur NUMERIC(12,2) NOT NULL,
  prix_unitaire NUMERIC(12,2) NOT NULL,
  frais_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user ON crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_tx_user ON crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_tx_created ON crypto_transactions(created_at DESC);

-- RLS
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crypto wallet" ON crypto_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own crypto transactions" ON crypto_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access crypto_wallets" ON crypto_wallets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access crypto_transactions" ON crypto_transactions
  FOR ALL USING (true) WITH CHECK (true);
