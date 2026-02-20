-- ============================================
-- Migration : Épargne Individuelle
-- ============================================

-- Table principale des comptes d'épargne
CREATE TABLE IF NOT EXISTS epargnes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT 'Mon épargne',
  type TEXT NOT NULL CHECK (type IN ('libre', 'objectif', 'programmee')),
  devise TEXT NOT NULL DEFAULT 'XOF',
  solde NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Pour type "objectif"
  objectif_montant NUMERIC(12,2),
  objectif_date DATE,
  -- Pour type "programmee"
  montant_auto NUMERIC(12,2),
  frequence_auto TEXT CHECK (frequence_auto IN ('quotidien', 'hebdomadaire', 'mensuel')),
  prochaine_date_auto TIMESTAMPTZ,
  source_auto TEXT CHECK (source_auto IN ('wallet', 'carte')) DEFAULT 'wallet',
  -- Blocage optionnel
  bloque_jusqu_a DATE,
  -- Bonus (épargne programmée : 1%/an)
  bonus_cumule NUMERIC(12,2) NOT NULL DEFAULT 0,
  dernier_bonus TIMESTAMPTZ,
  -- Personnalisation
  icone TEXT DEFAULT '💰',
  couleur TEXT DEFAULT '#6366f1',
  -- Métadonnées
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'cloturee', 'suspendue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des transactions d'épargne
CREATE TABLE IF NOT EXISTS epargne_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epargne_id UUID NOT NULL REFERENCES epargnes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('depot_wallet', 'depot_carte', 'depot_auto', 'retrait', 'bonus')),
  montant NUMERIC(12,2) NOT NULL,
  solde_apres NUMERIC(12,2) NOT NULL,
  description TEXT,
  stripe_payment_id TEXT,
  statut TEXT NOT NULL DEFAULT 'completed' CHECK (statut IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_epargnes_user ON epargnes(user_id);
CREATE INDEX IF NOT EXISTS idx_epargnes_statut ON epargnes(statut);
CREATE INDEX IF NOT EXISTS idx_epargnes_prochaine_date ON epargnes(prochaine_date_auto) WHERE prochaine_date_auto IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_epargne_tx_epargne ON epargne_transactions(epargne_id);
CREATE INDEX IF NOT EXISTS idx_epargne_tx_user ON epargne_transactions(user_id);

-- RLS
ALTER TABLE epargnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE epargne_transactions ENABLE ROW LEVEL SECURITY;

-- Policies épargnes
CREATE POLICY "Users can view own epargnes"
  ON epargnes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own epargnes"
  ON epargnes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own epargnes"
  ON epargnes FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies transactions
CREATE POLICY "Users can view own epargne_transactions"
  ON epargne_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own epargne_transactions"
  ON epargne_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass (pour le CRON)
CREATE POLICY "Service role full access epargnes"
  ON epargnes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access epargne_transactions"
  ON epargne_transactions FOR ALL
  USING (auth.role() = 'service_role');
