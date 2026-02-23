-- ============================================
-- Table: transferts (P2P wallet transfers)
-- ============================================
CREATE TABLE IF NOT EXISTS transferts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id UUID NOT NULL REFERENCES auth.users(id),
  destinataire_id UUID NOT NULL REFERENCES auth.users(id),
  montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
  devise TEXT NOT NULL DEFAULT 'EUR',
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'confirme' CHECK (statut IN ('confirme', 'annule', 'en_attente')),
  payment_link_id UUID,
  reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK to payment_links (run payment_links.sql first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_links') THEN
    ALTER TABLE transferts ADD CONSTRAINT fk_transferts_payment_link
      FOREIGN KEY (payment_link_id) REFERENCES payment_links(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_transferts_expediteur ON transferts(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_transferts_destinataire ON transferts(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_transferts_created ON transferts(created_at DESC);

-- RLS
ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers" ON transferts
  FOR SELECT USING (auth.uid() = expediteur_id OR auth.uid() = destinataire_id);

CREATE POLICY "Service role full access transferts" ON transferts
  FOR ALL USING (true) WITH CHECK (true);
