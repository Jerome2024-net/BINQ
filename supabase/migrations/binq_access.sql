-- ═══════════════════════════════════════════
-- BINQ ACCESS — Contrôle d'accès entreprises
-- ═══════════════════════════════════════════

-- 1. Espaces (zones à contrôler)
CREATE TABLE IF NOT EXISTS access_spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT,
  horaire_debut TIME DEFAULT '08:00',
  horaire_fin TIME DEFAULT '18:00',
  jours_actifs TEXT[] DEFAULT ARRAY['lundi','mardi','mercredi','jeudi','vendredi'],
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Membres autorisés
CREATE TABLE IF NOT EXISTS access_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES access_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'employé' CHECK (role IN ('employé', 'visiteur', 'VIP')),
  qr_code TEXT UNIQUE NOT NULL,
  actif BOOLEAN DEFAULT true,
  date_debut DATE,
  date_fin DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Logs d'accès
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES access_members(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES access_spaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
  statut TEXT NOT NULL CHECK (statut IN ('autorise', 'refuse')),
  raison_refus TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_access_spaces_user ON access_spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_access_members_space ON access_members(space_id);
CREATE INDEX IF NOT EXISTS idx_access_members_qr ON access_members(qr_code);
CREATE INDEX IF NOT EXISTS idx_access_logs_space ON access_logs(space_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_member ON access_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_scanned ON access_logs(scanned_at DESC);

-- RLS (Row Level Security)
ALTER TABLE access_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own data
CREATE POLICY "Users can manage their spaces" ON access_spaces
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage members of their spaces" ON access_members
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view logs of their spaces" ON access_logs
  FOR ALL USING (
    space_id IN (SELECT id FROM access_spaces WHERE user_id = auth.uid())
  );
