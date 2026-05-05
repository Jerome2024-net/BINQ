-- ============================================
-- Commerce wallet settlement and service fees
-- ============================================

ALTER TABLE public.commandes
  ADD COLUMN IF NOT EXISTS frais_service NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_marchand NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS montant_livreur NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS livreur_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS wallet_settled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_commandes_livreur_id ON public.commandes(livreur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_wallet_settled_at ON public.commandes(wallet_settled_at);
