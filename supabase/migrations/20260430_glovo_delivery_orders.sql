-- BINQ LOCAL COMMERCE — Multi-item delivery orders

-- Extend existing marketplace orders for Glovo-like local delivery.
ALTER TABLE commandes
  ADD COLUMN IF NOT EXISTS client_nom TEXT,
  ADD COLUMN IF NOT EXISTS client_telephone TEXT,
  ADD COLUMN IF NOT EXISTS adresse_livraison TEXT,
  ADD COLUMN IF NOT EXISTS note_livraison TEXT,
  ADD COLUMN IF NOT EXISTS sous_total NUMERIC,
  ADD COLUMN IF NOT EXISTS frais_livraison NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_total NUMERIC,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Allow delivery workflow statuses while keeping legacy marketplace statuses.
ALTER TABLE commandes DROP CONSTRAINT IF EXISTS commandes_statut_check;
ALTER TABLE commandes
  ADD CONSTRAINT commandes_statut_check
  CHECK (statut IN ('nouvelle', 'payee', 'acceptee', 'preparation', 'en_livraison', 'confirmee', 'livree', 'annulee'));

CREATE TABLE IF NOT EXISTS commande_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES produits(id) ON DELETE SET NULL,
  nom_produit TEXT NOT NULL,
  image_url TEXT,
  quantite INT NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire NUMERIC NOT NULL CHECK (prix_unitaire >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  devise TEXT DEFAULT 'XOF',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commande_items_commande ON commande_items(commande_id);
CREATE INDEX IF NOT EXISTS idx_commande_items_produit ON commande_items(produit_id);

ALTER TABLE commande_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commande_items_owner_read" ON commande_items;
CREATE POLICY "commande_items_owner_read" ON commande_items FOR SELECT
  USING (
    commande_id IN (
      SELECT id FROM commandes
      WHERE acheteur_id = auth.uid() OR vendeur_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "commande_items_insert" ON commande_items;
CREATE POLICY "commande_items_insert" ON commande_items FOR INSERT WITH CHECK (true);
