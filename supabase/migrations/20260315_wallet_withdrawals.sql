-- ============================================
-- Table: withdrawal_methods (moyens de retrait marchand)
-- MoMo MTN, Orange Money, Moov Money, Wave, etc.
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawal_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('momo_mtn', 'orange_money', 'moov_money', 'wave', 'bank_transfer')),
  label TEXT NOT NULL,            -- ex: "MTN 077xxxxxxx"
  numero TEXT NOT NULL,           -- numéro de téléphone ou IBAN
  nom_titulaire TEXT,             -- nom du bénéficiaire
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_methods_user ON withdrawal_methods(user_id);

-- Un seul moyen par défaut par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawal_methods_default
  ON withdrawal_methods(user_id) WHERE is_default = true AND is_active = true;

-- RLS
ALTER TABLE withdrawal_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own withdrawal methods" ON withdrawal_methods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access withdrawal_methods" ON withdrawal_methods
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Table: withdrawals (demandes de retrait)
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  wallet_id UUID NOT NULL,
  method_id UUID NOT NULL REFERENCES withdrawal_methods(id),
  montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
  frais NUMERIC(12,2) NOT NULL DEFAULT 0,
  net NUMERIC(12,2) NOT NULL CHECK (net > 0),
  devise TEXT NOT NULL DEFAULT 'XOF',
  statut TEXT NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference TEXT NOT NULL,
  motif_echec TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_statut ON withdrawals(statut);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created ON withdrawals(created_at DESC);

-- RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access withdrawals" ON withdrawals
  FOR ALL USING (true) WITH CHECK (true);
