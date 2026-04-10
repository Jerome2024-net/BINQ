-- ============================================
-- MIGRATION: Ajouter categorie_id aux events
-- Permet aux organisateurs de choisir une catégorie par événement
-- ============================================

-- Ajouter la colonne categorie_id à la table events
ALTER TABLE events ADD COLUMN IF NOT EXISTS categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Index pour filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_events_categorie ON events(categorie_id);

-- Ajouter les catégories manquantes pour la billetterie
INSERT INTO categories (nom, slug, icone, ordre) VALUES
  ('Restauration', 'restauration', '🍽️', 11),
  ('Bien-être', 'bien-etre', '🧘', 12),
  ('Hôtellerie & Immo', 'hotellerie', '🏨', 13)
ON CONFLICT (slug) DO NOTHING;
