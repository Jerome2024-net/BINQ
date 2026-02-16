-- Migration: Ajouter le champ 'code' à la table invitations
-- Ce champ contient un code unique pour les liens d'invitation directs (/rejoindre/{code})

-- 1. Ajouter la colonne code
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS code text;

-- 2. Générer des codes pour les invitations existantes (si il y en a)
UPDATE invitations 
SET code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) 
WHERE code IS NULL;

-- 3. Rendre la colonne NOT NULL et UNIQUE
ALTER TABLE invitations ALTER COLUMN code SET NOT NULL;
ALTER TABLE invitations ADD CONSTRAINT invitations_code_unique UNIQUE (code);

-- 4. Index pour la recherche par code
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);

-- 5. Politique RLS : permettre à tout le monde de lire une invitation par code (nécessaire pour /rejoindre/[code])
-- Les utilisateurs non connectés doivent pouvoir voir les détails de l'invitation
CREATE POLICY "Lecture invitation par code pour tous" ON invitations
  FOR SELECT USING (true);
