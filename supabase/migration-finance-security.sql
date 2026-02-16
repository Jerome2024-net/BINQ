-- =============================================
-- MIGRATION: Sécurisation infrastructure financière
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- 1. Fonction RPC pour mise à jour atomique du solde wallet
-- Évite les race conditions (read-modify-write)
CREATE OR REPLACE FUNCTION update_wallet_balance(p_user_id UUID, p_delta NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_solde NUMERIC;
BEGIN
  UPDATE wallets
  SET solde = solde + p_delta,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND (p_delta >= 0 OR solde + p_delta >= 0)  -- Empêcher solde négatif
  RETURNING solde INTO v_new_solde;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet introuvable ou solde insuffisant pour user %', p_user_id;
  END IF;

  RETURN v_new_solde;
END;
$$;

-- 2. Ajouter colonne stripe_payment_intent_id pour idempotence webhook
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Index unique pour éviter les doublons de paiement Stripe
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_pi
ON transactions(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- 3. Ajouter colonne stripe_subscription_id sur abonnements
ALTER TABLE abonnements
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE abonnements
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- 4. Ajouter colonnes Connect sur profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_type
ON transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_statut
ON transactions(statut);

CREATE INDEX IF NOT EXISTS idx_wallets_user
ON wallets(user_id);

-- 6. Contrainte de solde non-négatif sur wallets
ALTER TABLE wallets
ADD CONSTRAINT wallets_solde_non_negative CHECK (solde >= 0);
