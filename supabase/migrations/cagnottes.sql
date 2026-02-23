-- ==============================
-- Tables Cagnottes Communes
-- À exécuter dans Supabase SQL Editor
-- ==============================

-- 1. Table principale des cagnottes
CREATE TABLE IF NOT EXISTS cagnottes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  createur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  objectif_montant NUMERIC(12,2),
  date_limite TIMESTAMPTZ,
  devise TEXT NOT NULL DEFAULT 'EUR' CHECK (devise IN ('EUR', 'USD')),
  icone TEXT DEFAULT '🎯',
  couleur TEXT DEFAULT '#6366f1',
  code_invitation TEXT UNIQUE NOT NULL,
  visibilite_montants BOOLEAN DEFAULT true,
  solde NUMERIC(12,2) DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'cloturee', 'supprimee')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des membres d'une cagnotte
CREATE TABLE IF NOT EXISTS cagnotte_membres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cagnotte_id UUID NOT NULL REFERENCES cagnottes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'membre' CHECK (role IN ('admin', 'membre')),
  total_contribue NUMERIC(12,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cagnotte_id, user_id)
);

-- 3. Table des contributions
CREATE TABLE IF NOT EXISTS cagnotte_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cagnotte_id UUID NOT NULL REFERENCES cagnottes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  montant NUMERIC(12,2) NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'contribution' CHECK (type IN ('contribution', 'retrait', 'retrait_reparti')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_cagnottes_createur ON cagnottes(createur_id);
CREATE INDEX IF NOT EXISTS idx_cagnotte_membres_user ON cagnotte_membres(user_id);
CREATE INDEX IF NOT EXISTS idx_cagnotte_membres_cagnotte ON cagnotte_membres(cagnotte_id);
CREATE INDEX IF NOT EXISTS idx_cagnotte_contributions_cagnotte ON cagnotte_contributions(cagnotte_id);
CREATE INDEX IF NOT EXISTS idx_cagnottes_code ON cagnottes(code_invitation);

-- 5. RLS (Row Level Security)
ALTER TABLE cagnottes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cagnotte_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE cagnotte_contributions ENABLE ROW LEVEL SECURITY;

-- Politique: les membres peuvent voir les cagnottes dont ils font partie
CREATE POLICY "Membres voient leur cagnotte" ON cagnottes
  FOR SELECT
  USING (
    id IN (SELECT cagnotte_id FROM cagnotte_membres WHERE user_id = auth.uid())
  );

-- Politique: seul le service role peut INSERT/UPDATE/DELETE les cagnottes
-- (les API routes utilisent le service role key)

-- Politique: les membres peuvent voir les membres de leur cagnotte
CREATE POLICY "Membres voient les membres" ON cagnotte_membres
  FOR SELECT
  USING (
    cagnotte_id IN (SELECT cagnotte_id FROM cagnotte_membres WHERE user_id = auth.uid())
  );

-- Politique: les membres peuvent voir les contributions de leur cagnotte
CREATE POLICY "Membres voient les contributions" ON cagnotte_contributions
  FOR SELECT
  USING (
    cagnotte_id IN (SELECT cagnotte_id FROM cagnotte_membres WHERE user_id = auth.uid())
  );

-- 6. Autoriser le service role à accéder à la colonne profiles pour les jointures
-- (normalement déjà configuré si les profiles sont accessibles)
